"""Alembic environment configuration.

This file sets up an **async** SQLAlchemy engine using the same settings
module the application uses (`backend.app.settings`).  Alembic itself runs
synchronously, so we create a regular (sync) engine from the async URL with
`create_engine` and pass it to the migration context.

The script reads `DATABASE_URL` from `settings`; if it is not set we fall back
to the SQLite file in `settings.DATA_DIR` (matching the Docker default).  The
engine is attached to the migration context and the metadata from the ORM
models (`backend.app.models.Base`) is used for autogeneration.
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import our Settings singleton – this also loads env vars.
try:
    from app.settings import settings
except ImportError:
    from backend.app.settings import settings
try:
    from app.models import Base
except ImportError:
    from backend.app.models import Base

# ---------------------------------------------------------------------------
# Alembic configuration
# ---------------------------------------------------------------------------
config = context.config

# Set the sqlalchemy.url dynamically based on the application's settings.
# Alembic's .ini placeholder is ignored; we override it here.
# Alembic executes schema migrations synchronously.
# If an async URL like sqlite+aiosqlite is provided, convert to standard sqlite.
raw_url = settings.get_database_url()
sync_url = raw_url.replace("sqlite+aiosqlite://", "sqlite://")
config.set_main_option("sqlalchemy.url", sync_url)

# ---------------------------------------------------------------------------
# Logging configuration – use the .ini definitions if present.
# ---------------------------------------------------------------------------
if config.config_file_name is not None:
    try:
        fileConfig(config.config_file_name)
    except Exception:
        pass

# ---------------------------------------------------------------------------
# Migration context helpers
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in *offline* mode.

    This generates SQL scripts without needing a live DB connection.  It is
    primarily useful for CI checks or when the container cannot access the DB
    during the build stage.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in *online* mode.

    We create a **synchronous** engine from the async URL because Alembic's
    migration context expects a regular SQLAlchemy engine.  The URL format
    (`sqlite+aiosqlite`) is accepted by `create_engine` – SQLAlchemy will use the
    sync driver under the hood.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

# ---------------------------------------------------------------------------
# Entry point selection
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
