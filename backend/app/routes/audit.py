"""Audit log and system metrics routes."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AuditLog, Job, WebhookEvent, Action
from app.schemas import AuditLogOut, SystemMetrics
from app.security.auth import get_current_user
from app.settings import settings

router = APIRouter(tags=["audit"])


@router.get("/audit")
async def list_audit_log(
    limit: int = 100,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.ts.desc()).limit(limit)
    )
    entries = result.scalars().all()
    return [AuditLogOut.model_validate(e) for e in entries]


@router.get("/admin/metrics")
async def get_metrics(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Queue depth
    queue_q = await db.execute(
        select(func.count(Job.id)).where(Job.status == "queued")
    )
    queue_depth = queue_q.scalar() or 0

    # Failed jobs
    failed_q = await db.execute(
        select(func.count(Job.id)).where(Job.status == "failed")
    )
    failed_jobs = failed_q.scalar() or 0

    # Webhook backlog
    wh_q = await db.execute(
        select(func.count(WebhookEvent.id)).where(WebhookEvent.processed_at == None)
    )
    webhook_backlog = wh_q.scalar() or 0

    # Writes today
    writes_q = await db.execute(
        select(func.count(Action.id)).where(
            and_(
                Action.status.in_(["approved", "executed"]),
                Action.decided_at >= today_start,
            )
        )
    )
    writes_today = writes_q.scalar() or 0

    return SystemMetrics(
        queue_depth=queue_depth,
        failed_jobs=failed_jobs,
        webhook_backlog=webhook_backlog,
        writes_today=writes_today,
        max_daily_writes=settings.MAX_DAILY_WRITES,
    )
