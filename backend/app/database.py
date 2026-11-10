"""Database engine and session utilities (async SQLAlchemy 2.0)."""

import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.settings import settings

DATABASE_URL = settings.get_database_url()

# Ensure SQLite directory exists
if "sqlite" in DATABASE_URL:
    # Handle paths like sqlite+aiosqlite:///./data/app.db or sqlite+aiosqlite:////data/app.db
    db_path_str = DATABASE_URL.split("sqlite+aiosqlite:///", 1)[-1]
    if db_path_str:
        db_dir = os.path.dirname(os.path.abspath(db_path_str))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
