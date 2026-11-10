"""In-memory token bucket rate limiter middleware."""

import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class TokenBucket:
    """Simple per-key token bucket."""
    def __init__(self, rate: float, capacity: int):
        self.rate = rate  # tokens per second
        self.capacity = capacity
        self._buckets: dict[str, tuple[float, float]] = {}  # key -> (tokens, last_time)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        tokens, last = self._buckets.get(key, (self.capacity, now))
        elapsed = now - last
        tokens = min(self.capacity, tokens + elapsed * self.rate)
        if tokens >= 1:
            self._buckets[key] = (tokens - 1, now)
            return True
        self._buckets[key] = (tokens, now)
        return False


_TokenBucket = TokenBucket

# Global buckets
api_bucket = TokenBucket(rate=1.0, capacity=60)       # 60 req/min for /api/*
login_bucket = TokenBucket(rate=5/60, capacity=5)     # 5 req/min for login
_api_bucket = api_bucket
_login_bucket = login_bucket


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Only rate-limit API paths
        if not path.startswith("/api/"):
            return await call_next(request)

        client_ip = _get_client_ip(request)

        # Stricter limit on login
        if path == "/api/auth/login":
            if not login_bucket.allow(client_ip):
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too many login attempts. Please try again later."},
                    headers={"Retry-After": "60"},
                )

        # General API limit
        if not api_bucket.allow(client_ip):
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Please try again later."},
                headers={"Retry-After": "1"},
            )

        return await call_next(request)
