"""Dashboard routes: stats, risk chart, agent log."""

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    RiskSnapshot, Action, HazardEvent, AgentEvent, Order, Subscription, Merchant,
)
from app.schemas import DashboardStats, RiskChartPoint, AgentEventOut
from app.security.auth import get_current_user
from app.settings import settings

logger = logging.getLogger("day0shield.dashboard")
router = APIRouter(tags=["dashboard"])


@router.get("/merchants")
async def list_merchants(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List real merchants in the portfolio from the database."""
    result = await db.execute(select(Merchant).order_by(Merchant.id.asc()))
    merchants = result.scalars().all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "business_type": m.business_type,
            "ship_from_region": m.ship_from_region,
            "sandbox_payer_id": m.sandbox_payer_id,
        }
        for m in merchants
    ]


@router.get("/dashboard/stats")
async def get_stats(
    merchant_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if merchant_id is not None:
        order_risk = await db.execute(
            select(func.count(func.distinct(RiskSnapshot.entity_id)))
            .join(Order, and_(RiskSnapshot.entity_type == "order", RiskSnapshot.entity_id == Order.id))
            .where(Order.merchant_id == merchant_id)
        )
        at_risk_orders = order_risk.scalar() or 0

        sub_risk = await db.execute(
            select(func.count(func.distinct(RiskSnapshot.entity_id)))
            .join(Subscription, and_(RiskSnapshot.entity_type == "subscription", RiskSnapshot.entity_id == Subscription.id))
            .where(Subscription.merchant_id == merchant_id)
        )
        at_risk_subs = sub_risk.scalar() or 0

        order_exp = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
            .join(Order, and_(RiskSnapshot.entity_type == "order", RiskSnapshot.entity_id == Order.id))
            .where(Order.merchant_id == merchant_id)
        )
        sub_exp = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
            .join(Subscription, and_(RiskSnapshot.entity_type == "subscription", RiskSnapshot.entity_id == Subscription.id))
            .where(Subscription.merchant_id == merchant_id)
        )
        total_exposure = (order_exp.scalar() or 0.0) + (sub_exp.scalar() or 0.0)

        order_ids_subq = select(Order.id).where(Order.merchant_id == merchant_id)
        sub_ids_subq = select(Subscription.id).where(Subscription.merchant_id == merchant_id)
        pending = await db.execute(
            select(func.count(Action.id)).where(
                and_(
                    Action.status == "pending_approval",
                    or_(
                        and_(Action.entity_type == "order", Action.entity_id.in_(order_ids_subq)),
                        and_(Action.entity_type == "subscription", Action.entity_id.in_(sub_ids_subq)),
                    )
                )
            )
        )
        pending_actions = pending.scalar() or 0
    else:
        order_risk = await db.execute(
            select(func.count(func.distinct(RiskSnapshot.entity_id))).where(
                RiskSnapshot.entity_type == "order"
            )
        )
        at_risk_orders = order_risk.scalar() or 0

        sub_risk = await db.execute(
            select(func.count(func.distinct(RiskSnapshot.entity_id))).where(
                RiskSnapshot.entity_type == "subscription"
            )
        )
        at_risk_subs = sub_risk.scalar() or 0

        exposure = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
        )
        total_exposure = exposure.scalar() or 0.0

        pending = await db.execute(
            select(func.count(Action.id)).where(Action.status == "pending_approval")
        )
        pending_actions = pending.scalar() or 0

    now = datetime.utcnow()
    active = await db.execute(
        select(func.count(HazardEvent.id)).where(
            and_(HazardEvent.starts_at <= now, HazardEvent.ends_at >= now)
        )
    )
    active_hazards = active.scalar() or 0

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    writes = await db.execute(
        select(func.count(Action.id)).where(
            and_(
                Action.status.in_(["approved", "executed"]),
                Action.decided_at >= today_start,
            )
        )
    )
    writes_today = writes.scalar() or 0

    return DashboardStats(
        at_risk_orders=at_risk_orders,
        at_risk_subscriptions=at_risk_subs,
        total_exposure_usd=round(total_exposure, 2),
        active_hazards=active_hazards,
        pending_actions=pending_actions,
        writes_today=writes_today,
        max_daily_writes=settings.MAX_DAILY_WRITES,
    )


@router.get("/dashboard/risk-chart")
async def get_risk_chart(
    merchant_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate 60-day risk fan chart data (modeled)."""
    import numpy as np

    if merchant_id is not None:
        order_exp = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
            .join(Order, and_(RiskSnapshot.entity_type == "order", RiskSnapshot.entity_id == Order.id))
            .where(Order.merchant_id == merchant_id)
        )
        sub_exp = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
            .join(Subscription, and_(RiskSnapshot.entity_type == "subscription", RiskSnapshot.entity_id == Subscription.id))
            .where(Subscription.merchant_id == merchant_id)
        )
        base_exposure = (order_exp.scalar() or 0.0) + (sub_exp.scalar() or 0.0) or 250.0
    else:
        exposure_result = await db.execute(
            select(func.sum(RiskSnapshot.expected_impact_usd))
        )
        base_exposure = exposure_result.scalar() or 1000.0

    avg_risk = await db.execute(select(func.avg(RiskSnapshot.p_dispute)))
    base_p = avg_risk.scalar() or 0.15

    rng = np.random.default_rng(42 if merchant_id is None else 42 + merchant_id)
    points = []
    for day in range(61):
        decay = max(0.1, 1.0 - day / 60)
        noise_scale = 0.02 + day * 0.005

        samples = rng.normal(base_p * decay, noise_scale, 200)
        samples = np.clip(samples, 0, 1)

        points.append(RiskChartPoint(
            day=day,
            p5=round(float(np.percentile(samples, 5)) * base_exposure, 2),
            p25=round(float(np.percentile(samples, 25)) * base_exposure, 2),
            p50=round(float(np.percentile(samples, 50)) * base_exposure, 2),
            p75=round(float(np.percentile(samples, 75)) * base_exposure, 2),
            p95=round(float(np.percentile(samples, 95)) * base_exposure, 2),
        ))

    return points


@router.get("/dashboard/agent-log")
async def get_agent_log(
    limit: int = 50,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentEvent).order_by(AgentEvent.created_at.desc()).limit(limit)
    )
    events = result.scalars().all()
    return [AgentEventOut.model_validate(e) for e in events]
