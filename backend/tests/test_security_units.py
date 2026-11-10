import asyncio
import json
import logging
import unittest

from app.security import csrf
from app.security.headers import SecurityHeadersMiddleware
from app.security.ratelimit import TokenBucket, login_bucket
from app.security.redact import JsonRedactingFormatter, redact
from app.security.session import ABSOLUTE_SECONDS, IDLE_SECONDS, SessionCodec


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class SessionTests(unittest.TestCase):
    def test_roundtrip_and_tamper(self):
        c = SessionCodec("k" * 40, Clock())
        cookie = c.issue(7, "approver")
        s = c.read(cookie)
        self.assertEqual((s.user_id, s.role), (7, "approver"))
        self.assertIsNone(c.read(cookie[:-2] + "xx"))
        self.assertIsNone(SessionCodec("z" * 40, Clock()).read(cookie))
        self.assertIsNone(c.read(None))

    def test_idle_and_absolute_timeouts(self):
        clk = Clock()
        c = SessionCodec("k" * 40, clk)
        cookie = c.issue(1, "viewer")
        clk.t += IDLE_SECONDS + 1
        self.assertIsNone(c.read(cookie))
        clk.t = 1000.0
        cookie = c.issue(1, "viewer")
        for _ in range(20):  # keep sliding the idle window
            clk.t += IDLE_SECONDS - 60
            s = c.read(cookie)
            if s is None:
                break
            cookie = c.touch(s)
        self.assertIsNone(c.read(cookie))  # absolute limit still wins
        self.assertGreater(clk.t - 1000.0, ABSOLUTE_SECONDS)

    def test_login_rotates_csrf(self):
        c = SessionCodec("k" * 40, Clock())
        self.assertNotEqual(c.read(c.issue(1, "viewer")).csrf, c.read(c.issue(1, "viewer")).csrf)


class CsrfTests(unittest.TestCase):
    def test_new_token_length(self):
        token = csrf.new_token()
        self.assertGreaterEqual(len(token), 32)
        token2 = csrf.new_token()
        self.assertNotEqual(token, token2)

    def test_safe_methods_defined(self):
        self.assertIn("GET", csrf.SAFE_METHODS)
        self.assertIn("HEAD", csrf.SAFE_METHODS)
        self.assertIn("OPTIONS", csrf.SAFE_METHODS)
        self.assertNotIn("POST", csrf.SAFE_METHODS)


class RateLimitTests(unittest.TestCase):
    def test_bucket_rate_and_capacity(self):
        b = TokenBucket(rate=1.0, capacity=3)
        self.assertTrue(b.allow("ip1"))
        self.assertTrue(b.allow("ip1"))
        self.assertTrue(b.allow("ip1"))
        self.assertFalse(b.allow("ip1"))  # capacity exhausted
        self.assertTrue(b.allow("ip2"))   # different key allowed

    def test_login_bucket_configured(self):
        self.assertEqual(login_bucket.capacity, 5)


class RedactTests(unittest.TestCase):
    def test_redact_keys_and_bearer(self):
        out = redact({
            "Authorization": "Bearer abc",
            "nested": {"client_secret": "x", "ok": "fine"},
            "msg": "sent Bearer abc.def-123 now",
        })
        self.assertEqual(out["Authorization"], "***REDACTED***")
        self.assertEqual(out["nested"], {"client_secret": "***REDACTED***", "ok": "fine"})
        self.assertNotIn("abc.def-123", out["msg"])

    def test_formatter_outputs_redacted_text(self):
        rec = logging.LogRecord("t", logging.INFO, "f", 1, "token=secret Bearer xyz123", (), None)
        msg = JsonRedactingFormatter().format(rec)
        self.assertNotIn("xyz123", msg)
        self.assertIn("Bearer ***REDACTED***", msg)


class HeaderTests(unittest.TestCase):
    def run_mw(self, path):
        sent = []

        async def app(scope, receive, send):
            await send({"type": "http.response.start", "status": 200, "headers": [(b"server", b"uvicorn")]})
            await send({"type": "http.response.body", "body": b""})

        async def send(m):
            sent.append(m)

        scope = {"type": "http", "path": path, "headers": []}
        asyncio.run(SecurityHeadersMiddleware(app)(scope, None, send))
        return dict(sent[0]["headers"])

    def test_headers(self):
        h = self.run_mw("/api/x")
        for k in (b"strict-transport-security", b"x-content-type-options", b"content-security-policy",
                  b"x-frame-options", b"referrer-policy", b"permissions-policy"):
            self.assertIn(k, h)
        self.assertEqual(h[b"cache-control"], b"no-store")
        self.assertNotIn(b"server", h)
        self.assertIn(b"frame-ancestors 'none'", h[b"content-security-policy"])

    def test_assets_immutable(self):
        self.assertIn(b"immutable", self.run_mw("/assets/a.js")[b"cache-control"])


if __name__ == "__main__":
    unittest.main()
