"""Authentication routes: login, logout, me."""

import json
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Request, Response, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import LoginRequest, LoginResponse
from app.settings import settings
from app.security.auth import (
    verify_password,
    create_session_token,
    decode_session_token,
    generate_csrf_token,
    get_current_user,
    COOKIE_NAME,
    SESSION_MAX_AGE,
)

logger = logging.getLogger("day0shield.auth")
router = APIRouter(tags=["auth"])

MAX_FAILED_LOGINS = 10
LOCKOUT_MINUTES = 15


async def _audit(db: AsyncSession, event: str, request: Request, user_id=None, **kwargs):
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    entry = AuditLog(
        user_id=user_id,
        ip=ip.split(",")[0].strip(),
        event=event,
        entity_type=kwargs.get("entity_type"),
        entity_id=kwargs.get("entity_id"),
        detail_json=json.dumps(kwargs.get("detail", {})) if kwargs.get("detail") else None,
    )
    db.add(entry)
    await db.commit()


@router.post("/auth/login")
async def login(body: LoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    # Find user in DB
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if user is None:
        await _audit(db, "login_failed", request, detail={"reason": "unknown_user"})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        await _audit(db, "login_locked", request, user_id=user.id)
        raise HTTPException(status_code=401, detail="Account temporarily locked")

    # Verify password
    if not verify_password(body.password, user.password_hash):
        user.failed_logins = (user.failed_logins or 0) + 1
        if user.failed_logins >= MAX_FAILED_LOGINS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        await db.commit()
        await _audit(db, "login_failed", request, user_id=user.id,
                     detail={"attempts": user.failed_logins})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Success - reset failed logins
    user.failed_logins = 0
    user.locked_until = None
    await db.commit()

    # Create session
    csrf_token = generate_csrf_token()
    token = create_session_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        secret_key=settings.SECRET_KEY,
        csrf_token=csrf_token,
    )

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )

    await _audit(db, "login_success", request, user_id=user.id)
    return LoginResponse(username=user.username, role=user.role, csrf_token=csrf_token)


@router.post("/auth/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        user = get_current_user(request)
        await _audit(db, "logout", request, user_id=user.get("user_id"))
    except HTTPException:
        pass
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"status": "ok"}


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "username": user["username"],
        "role": user["role"],
        "user_id": user["user_id"],
    }
