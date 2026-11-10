"""Application configuration loader.

All imports within the backend use `app.*` paths (not `backend.app.*`)
because the Docker image copies backend/app → /app/app and sets WORKDIR=/app.
For local development, set PYTHONPATH to include the backend/ directory.
"""

import os
from pathlib import Path
from typing import Optional, Any

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, SecretStr


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Core environment
    APP_ENV: str = Field("development", description="production or development")
    PAYPAL_ENV: str = Field("sandbox", description="must be 'sandbox'")
    PORT: int = Field(8080, ge=1, le=65535)
    DATA_DIR: str = Field("/data", description="directory for SQLite DB and backups")

    # Secrets
    SECRET_KEY: str = Field("x" * 48, description=">=32 bytes for signing")
    ADMIN_USERNAME: str = Field("admin")
    ADMIN_PASSWORD_HASH: str = Field(
        "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$aGFzaGhhc2hoYXNoaGFzaA"
    )
    PAYPAL_CLIENT_ID: str = Field("sb-client-id")
    PAYPAL_SECRET: str = Field("sb-secret")
    PAYPAL_WEBHOOK_ID: str = Field("webhook-id")
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: Optional[str] = Field("gemini-2.0-flash")
    LLM_PROVIDER: Optional[str] = Field("google")

    # Database
    DATABASE_URL: Optional[str] = None

    # Network / hosting
    ALLOWED_HOSTS: Optional[str] = None
    TRUSTED_PROXY_IPS: Optional[str] = "127.0.0.1"
    FORCE_HTTPS: bool = False
    DEBUG: bool = False

    # PayPal URLs (always sandbox)
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"

    # Budget / rate caps
    MAX_REFUND_OFFER_USD: float = 500.0
    MAX_ACTIONS_PER_MINUTE: int = 30
    MAX_DAILY_WRITES: int = 200
    MAX_LLM_CALLS_PER_HOUR: int = 100

    # Execution
    EXECUTION_MODE: str = "queue"  # queue | inline
    SEED_ON_BOOT: bool = False
    PAYPAL_TOOL_TRANSPORT: str = "toolkit"  # toolkit | mcp

    # License keys (served at runtime, never baked into image)
    AG_STUDIO_LICENSE_KEY: Optional[str] = None
    BRYNTUM_LICENSE_KEY: Optional[str] = None

    @field_validator("DATA_DIR", mode="before")
    @classmethod
    def normalize_data_dir(cls, v: Any) -> str:
        if not v:
            return "/data"
        s = str(v).strip()
        if s in ("data", "./data", "data/"):
            return "/data"
        return s

    @field_validator("PAYPAL_ENV")
    @classmethod
    def must_be_sandbox(cls, v: str) -> str:
        if v != "sandbox":
            raise ValueError("PAYPAL_ENV must be 'sandbox'")
        return v

    @field_validator("APP_ENV")
    @classmethod
    def must_be_valid_env(cls, v: str) -> str:
        if v not in {"production", "development"}:
            raise ValueError("APP_ENV must be 'production' or 'development'")
        return v

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"sqlite+aiosqlite:///{self.DATA_DIR}/app.db"


# Singleton
settings = Settings()
