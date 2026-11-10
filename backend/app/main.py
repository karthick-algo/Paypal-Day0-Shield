"""FastAPI entry point for Day-0 Shield.

Serves:
- /healthz, /readyz — health probes
- /api/* — JSON API (auth required)
- /webhooks/paypal — signed webhook receiver
- / — React SPA (static files with fallback)
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse

from app.settings import settings
from app.database import async_engine, AsyncSessionLocal
from app.models import Base, User

logger = logging.getLogger("day0shield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Create tables (in dev mode or if no Alembic)
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def heal_columns(sync_conn):
            from sqlalchemy.engine.reflection import Inspector
            from sqlalchemy import text
            inspector = Inspector.from_engine(sync_conn)
            if "hazard_events" in inspector.get_table_names():
                cols = [col["name"] for col in inspector.get_columns("hazard_events")]
                if "created_at" not in cols:
                    sync_conn.execute(text("ALTER TABLE hazard_events ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
                    logger.info("Self-healed hazard_events table: added created_at column")

        await conn.run_sync(heal_columns)

    # Bootstrap admin user from env if not exists
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        admin = result.scalar_one_or_none()
        if admin is None:
            admin = User(
                username=settings.ADMIN_USERNAME,
                password_hash=settings.ADMIN_PASSWORD_HASH,
                role="approver",
            )
            session.add(admin)
            await session.commit()
            logger.info("Admin user created from environment")

    # Seed data if requested
    if settings.SEED_ON_BOOT:
        try:
            from app.seed import run_seed
            await run_seed()
            logger.info("Seed data loaded")
        except Exception as e:
            logger.warning(f"Seed failed: {e}")

    logger.info(f"Day-0 Shield started (APP_ENV={settings.APP_ENV}, PAYPAL_ENV={settings.PAYPAL_ENV})")
    yield
    # Shutdown
    await async_engine.dispose()
    logger.info("Day-0 Shield shutting down")


# Conditionally disable docs
docs_url = "/docs" if settings.APP_ENV == "development" else None
openapi_url = "/openapi.json" if settings.APP_ENV == "development" else None

app = FastAPI(
    title="Day-0 Shield",
    lifespan=lifespan,
    docs_url=docs_url,
    openapi_url=openapi_url,
    redoc_url=None,
)


# ---------------------------------------------------------------------------
# Middleware (order matters — outermost first)
# ---------------------------------------------------------------------------
from app.security.headers import SecurityHeadersMiddleware
from app.security.ratelimit import RateLimitMiddleware

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)


# ---------------------------------------------------------------------------
# Health probes
# ---------------------------------------------------------------------------
@app.get("/healthz", include_in_schema=False)
async def healthz():
    return JSONResponse({"status": "ok"})


@app.get("/readyz", include_in_schema=False)
async def readyz():
    try:
        async with async_engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        return JSONResponse({"status": "ready", "db": "ok", "migrations": "ok"})
    except Exception as e:
        return JSONResponse({"status": "not ready", "db": str(e)}, status_code=503)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------
from app.routes.auth import router as auth_router
from app.routes.hazard import router as hazard_router
from app.routes.actions import router as actions_router
from app.routes.dashboard import router as dashboard_router
from app.routes.disputes import router as disputes_router
from app.routes.webhooks import router as webhooks_router
from app.routes.audit import router as audit_router
from app.routes.config import router as config_router
from app.routes.langchain_monitor import router as langchain_router
from app.routes.rag import router as rag_router
from app.routes.agent import router as agent_router

app.include_router(auth_router, prefix="/api")
app.include_router(hazard_router, prefix="/api")
app.include_router(actions_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(disputes_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(config_router, prefix="/api")
app.include_router(langchain_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(agent_router, prefix="/api")

# Webhooks — no /api prefix, no session auth
app.include_router(webhooks_router)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )


# ---------------------------------------------------------------------------
# SPA static files — MUST be last (catch-all)
# ---------------------------------------------------------------------------
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
index_path = os.path.join(static_dir, "index.html")

if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets") if os.path.isdir(os.path.join(static_dir, "assets")) else None

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        """Serve static files or fall back to index.html for SPA routing."""
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            resp = FileResponse(file_path)
            if file_path.endswith(".html"):
                resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                resp.headers["Pragma"] = "no-cache"
                resp.headers["Expires"] = "0"
            return resp
        if os.path.isfile(index_path):
            resp = FileResponse(index_path)
            resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            resp.headers["Pragma"] = "no-cache"
            resp.headers["Expires"] = "0"
            return resp
        return JSONResponse({"error": "not found"}, status_code=404)
