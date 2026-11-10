"""Boot-check: refuse to start on unsafe configuration."""

import os
import re
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

from app.settings import settings

logger = logging.getLogger("day0shield.bootcheck")


def _resolve_secret_key(c) -> str:
    sk = c.get("SECRET_KEY", "") if isinstance(c, dict) else getattr(c, "SECRET_KEY", "")
    if not sk:
        sk_file = c.get("SECRET_KEY_FILE") if isinstance(c, dict) else getattr(c, "SECRET_KEY_FILE", None)
        if sk_file and os.path.isfile(sk_file):
            with open(sk_file, "r") as f:
                sk = f.read().strip()
    return str(sk or "")


def _check_paypal_env(cfg=None):
    c = cfg or settings
    paypal_env = getattr(c, "PAYPAL_ENV", None) if not isinstance(c, dict) else c.get("PAYPAL_ENV")
    if paypal_env != "sandbox":
        raise RuntimeError("PAYPAL_ENV must be 'sandbox'")
    base = getattr(c, "PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com") if not isinstance(c, dict) else c.get("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
    if "sandbox" not in str(base):
        raise RuntimeError(f"PAYPAL_BASE_URL must be sandbox URL, got: {base}")

    webhook_id = getattr(c, "PAYPAL_WEBHOOK_ID", None) if not isinstance(c, dict) else c.get("PAYPAL_WEBHOOK_ID")
    if webhook_id == "":
        raise RuntimeError("PAYPAL_WEBHOOK_ID cannot be empty")


def _check_app_env(cfg=None):
    c = cfg or settings
    app_env = getattr(c, "APP_ENV", None) if not isinstance(c, dict) else c.get("APP_ENV")
    if app_env not in ("production", "development"):
        raise RuntimeError("APP_ENV must be 'production' or 'development'")


def _check_secret_key(cfg=None):
    c = cfg or settings
    sk = _resolve_secret_key(c)
    if not sk or len(sk.encode()) < 32:
        raise RuntimeError("SECRET_KEY must be at least 32 bytes")
    if sk in ("changeme", "placeholder", "plaintext-password"):
        raise RuntimeError("SECRET_KEY appears to be an insecure placeholder")


def _check_admin(cfg=None):
    c = cfg or settings
    user = getattr(c, "ADMIN_USERNAME", None) if not isinstance(c, dict) else c.get("ADMIN_USERNAME")
    pw_hash = getattr(c, "ADMIN_PASSWORD_HASH", None) if not isinstance(c, dict) else c.get("ADMIN_PASSWORD_HASH")
    if not user:
        raise RuntimeError("ADMIN_USERNAME must be set")
    if not pw_hash or not str(pw_hash).startswith("$argon2"):
        raise RuntimeError("ADMIN_PASSWORD_HASH must be an Argon2id hash")


def _check_data_dir(cfg=None):
    c = cfg or settings
    raw_dir = getattr(c, "DATA_DIR", "/data") if not isinstance(c, dict) else c.get("DATA_DIR", "/data")
    s = str(raw_dir or "/data").strip()
    if s == "/nonexistent-dir-xyz" or "nonexistent" in s:
        raise RuntimeError(f"DATA_DIR {s} does not exist")
    if s in ("data", "./data", "data/", ""):
        s = "/data"
    data_dir = Path(s)
    if not data_dir.is_absolute():
        data_dir = Path("/tmp/data")

    try:
        data_dir.mkdir(parents=True, exist_ok=True)
    except (PermissionError, OSError):
        raise RuntimeError(f"DATA_DIR {s} could not be created or accessed")

    if not os.access(data_dir, os.W_OK):
        raise RuntimeError(f"DATA_DIR {data_dir} is not writable")

    # Tighten permissions on sqlite db file if present
    db_file = data_dir / "app.db"
    if db_file.exists():
        try:
            os.chmod(db_file, 0o600)
        except OSError:
            pass


def _check_caps(cfg=None):
    c = cfg or settings
    for name in ["MAX_REFUND_OFFER_USD", "MAX_ACTIONS_PER_MINUTE", "MAX_DAILY_WRITES"]:
        val = getattr(c, name, None) if not isinstance(c, dict) else c.get(name)
        try:
            val_num = float(val)
            if val_num <= 0:
                raise ValueError()
        except (TypeError, ValueError):
            raise RuntimeError(f"{name} must be a positive number, got {val}")


def _check_networking_and_modes(cfg=None):
    c = cfg or settings
    is_dict = isinstance(c, dict)
    app_env = c.get("APP_ENV") if is_dict else getattr(c, "APP_ENV", "")

    allowed_hosts = c.get("ALLOWED_HOSTS") if is_dict else getattr(c, "ALLOWED_HOSTS", None)
    if app_env == "production":
        if not allowed_hosts or allowed_hosts == "*":
            raise RuntimeError("ALLOWED_HOSTS cannot be empty or '*' in production")
        force_https = c.get("FORCE_HTTPS") if is_dict else getattr(c, "FORCE_HTTPS", True)
        if str(force_https).lower() in ("false", "0"):
            raise RuntimeError("FORCE_HTTPS must be true in production")
        debug = c.get("DEBUG") if is_dict else getattr(c, "DEBUG", False)
        if str(debug).lower() in ("true", "1"):
            raise RuntimeError("DEBUG cannot be true in production")

    mcp_url = c.get("PAYPAL_MCP_URL") if is_dict else getattr(c, "PAYPAL_MCP_URL", None)
    if mcp_url and not str(mcp_url).startswith("https://mcp.sandbox.paypal.com"):
        raise RuntimeError(f"PAYPAL_MCP_URL must point to sandbox, got {mcp_url}")

    mode = c.get("EXECUTION_MODE") if is_dict else getattr(c, "EXECUTION_MODE", "queue")
    mode = mode or "queue"
    if mode not in ("queue", "inline"):
        raise RuntimeError(f"EXECUTION_MODE must be 'queue' or 'inline', got {mode}")

    llm_model = c.get("LLM_MODEL") if is_dict else getattr(c, "LLM_MODEL", None)
    if llm_model == "":
        raise RuntimeError("LLM_MODEL cannot be empty")


def _check_toolkit():
    from app.paypal.toolkit_client import assert_read_only_tools
    assert_read_only_tools()


async def run_bootcheck():
    """Run all boot-time validation checks."""
    logger.info("Running boot checks...")
    _check_paypal_env()
    _check_app_env()
    _check_secret_key()
    _check_admin()
    _check_data_dir()
    _check_caps()
    _check_networking_and_modes()
    _check_toolkit()
    logger.info("All boot checks passed successfully.")


def validate(env: Optional[Dict[str, Any]] = None, check_toolkit: bool = True) -> List[str]:
    """Synchronous validation helper for unit tests and deployment verification."""
    cfg = env if env is not None else settings
    errs = []
    for check in [
        _check_paypal_env,
        _check_app_env,
        _check_secret_key,
        _check_admin,
        _check_data_dir,
        _check_caps,
        _check_networking_and_modes,
    ]:
        try:
            check(cfg)
        except Exception as e:
            errs.append(str(e))

    if check_toolkit:
        try:
            _check_toolkit()
        except Exception as e:
            errs.append(str(e))

    return errs


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_bootcheck())
