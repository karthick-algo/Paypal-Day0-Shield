"""Sensitive-value redaction for logging."""

import re
import json
import logging

SENSITIVE_KEYS = re.compile(
    r"(secret|token|authorization|password|client_secret|api_key|hash)",
    re.IGNORECASE,
)
BEARER_PATTERN = re.compile(r"Bearer\s+\S+", re.IGNORECASE)


def redact(data: dict) -> dict:
    """Recursively redact sensitive keys in a dict."""
    result = {}
    for k, v in data.items():
        if SENSITIVE_KEYS.search(k):
            result[k] = "***REDACTED***"
        elif isinstance(v, dict):
            result[k] = redact(v)
        elif isinstance(v, str):
            result[k] = BEARER_PATTERN.sub("Bearer ***REDACTED***", v)
        else:
            result[k] = v
    return result


class RedactingFormatter(logging.Formatter):
    """JSON log formatter that redacts sensitive values."""

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        msg = BEARER_PATTERN.sub("Bearer ***REDACTED***", msg)
        return msg


JsonRedactingFormatter = RedactingFormatter
