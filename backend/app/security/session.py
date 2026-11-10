"""Signed session cookie payload with idle + absolute timeouts (brief 14.4)."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Callable

from itsdangerous import BadSignature, URLSafeSerializer

from .csrf import new_token

IDLE_SECONDS = 30 * 60
ABSOLUTE_SECONDS = 8 * 60 * 60
COOKIE_NAME = "d0s_session"
COOKIE_ATTRS = {"httponly": True, "secure": True, "samesite": "strict", "path": "/"}


@dataclass(frozen=True)
class Session:
    user_id: int
    role: str
    csrf: str
    issued_at: float
    last_seen: float


class SessionCodec:
    def __init__(self, secret_key: str, clock: Callable[[], float] = time.time):
        self._ser = URLSafeSerializer(secret_key, salt="d0s-session-v1")
        self._clock = clock

    def issue(self, user_id: int, role: str) -> str:
        """Always mints a fresh token + CSRF value (rotation on login)."""
        now = self._clock()
        return self._ser.dumps({"u": user_id, "r": role, "c": new_token(), "i": now, "s": now})

    def read(self, cookie: str | None) -> Session | None:
        if not cookie:
            return None
        try:
            d = self._ser.loads(cookie)
            now = self._clock()
            if now - d["i"] > ABSOLUTE_SECONDS or now - d["s"] > IDLE_SECONDS:
                return None
            if d["r"] not in {"viewer", "approver"}:
                return None
            return Session(d["u"], d["r"], d["c"], d["i"], d["s"])
        except (BadSignature, KeyError, TypeError):
            return None

    def touch(self, s: Session) -> str:
        """Slide the idle window; absolute expiry is unchanged."""
        return self._ser.dumps({"u": s.user_id, "r": s.role, "c": s.csrf, "i": s.issued_at, "s": self._clock()})
