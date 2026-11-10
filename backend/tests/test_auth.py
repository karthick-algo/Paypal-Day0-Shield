"""Tests for authentication endpoints using Starlette TestClient."""

import pytest
from starlette.testclient import TestClient

from app.main import app
from app.security.auth import hash_password
from app.database import async_engine, AsyncSessionLocal
from app.models import Base, User


class TestAuthEndpoints:

    @classmethod
    def setup_class(cls):
        """Create tables and seed admin user."""
        import asyncio
        async def init():
            async with async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                res = await session.execute(select(User).where(User.username == "testadmin"))
                if not res.scalar_one_or_none():
                    u = User(
                        username="testadmin",
                        password_hash=hash_password("adminpass123"),
                        role="approver",
                    )
                    session.add(u)
                    await session.commit()
        asyncio.run(init())

    def test_invalid_login(self):
        with TestClient(app) as client:
            resp = client.post("/api/auth/login", json={"username": "fake", "password": "wrong"})
            assert resp.status_code == 401
            assert "detail" in resp.json() or "error" in resp.json()

    def test_successful_login_and_me_flow(self):
        with TestClient(app) as client:
            login_resp = client.post(
                "/api/auth/login",
                json={"username": "testadmin", "password": "adminpass123"},
            )
            assert login_resp.status_code == 200
            assert "day0_session" in login_resp.cookies or "session_token" in login_resp.cookies or "user" in login_resp.json()

            me_resp = client.get("/api/auth/me")
            assert me_resp.status_code == 200
            data = me_resp.json()
            assert data["username"] == "testadmin"
            assert data["role"] == "approver"

            logout_resp = client.post("/api/auth/logout")
            assert logout_resp.status_code == 200
