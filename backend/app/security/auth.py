"""Authentication utilities: password hashing, session tokens, FastAPI deps."""

import secrets
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Request, HTTPException, Depends
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

logger = logging.getLogger("day0shield.auth")

# ---------------------------------------------------------------------------
# Password hashing (argon2id)
# ---------------------------------------------------------------------------
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
    _ph = PasswordHasher()

    def hash_password(plain: str) -> str:
        return _ph.hash(plain)

    def verify_password(plain: str, hashed: str) -> bool:
        try:
            return _ph.verify(hashed, plain)
        except Exception:
            return False
except ImportError:
    # Fallback for environments without argon2-cffi
    import hashlib

    def hash_password(plain: str) -> str:
        return hashlib.sha256(plain.encode()).hexdigest()

    def verify_password(plain: str, hashed: str) -> bool:
        return hashlib.sha256(plain.encode()).hexdigest() == hashed


# ---------------------------------------------------------------------------
# Session tokens (itsdangerous)
# ---------------------------------------------------------------------------
COOKIE_NAME = "day0_session"
CSRF_HEADER = "X-CSRF-Token"
SESSION_MAX_AGE = 1800  # 30 min idle timeout
SESSION_ABSOLUTE_MAX = 28800  # 8 hours


def _get_serializer(secret_key: str) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key)


def create_session_token(
    user_id: int,
    username: str,
    role: str,
    secret_key: str,
    csrf_token: Optional[str] = None,
) -> str:
    s = _get_serializer(secret_key)
    if csrf_token is None:
        csrf_token = generate_csrf_token()
    return s.dumps({
        "user_id": user_id,
        "username": username,
        "role": role,
        "csrf": csrf_token,
        "iat": datetime.utcnow().isoformat(),
    })


def decode_session_token(
    token: str,
    secret_key: str,
    max_age: int = SESSION_MAX_AGE,
) -> Optional[dict]:
    s = _get_serializer(secret_key)
    try:
        data = s.loads(token, max_age=max_age)
        return data
    except (BadSignature, SignatureExpired):
        return None


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------
def get_current_user(request: Request) -> dict:
    """Extract and validate the session cookie. Returns user dict or raises 401."""
    from app.settings import settings
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = decode_session_token(token, settings.SECRET_KEY)
    if user is None:
        raise HTTPException(status_code=401, detail="Session expired")
    return user


def require_role(required_role: str):
    """Dependency factory: checks that the user has the required role."""
    def checker(user: dict = Depends(get_current_user)):
        if user.get("role") != required_role and user.get("role") != "approver":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker
