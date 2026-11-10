import os
import datetime
import random
from sqlalchemy.ext.asyncio import AsyncSession
try:
    from app.models import HazardEvent, RiskSnapshot, Order, Subscription
except ImportError:
    from backend.app.models import HazardEvent, RiskSnapshot, Order, Subscription

async def store_hazard(db: AsyncSession, payload: dict) -> int:
    """Store a hazard event from a forecast JSON payload.
    Expected keys: type, region, severity (1‑10), starts_at, ends_at, source.
    Returns the newly created HazardEvent ID.
    """
    event = HazardEvent(
        type=payload["type"],
        region=payload["region"],
        severity=int(payload["severity"]),
        starts_at=datetime.datetime.fromisoformat(payload["starts_at"]),
        ends_at=datetime.datetime.fromisoformat(payload["ends_at"]),
        source=payload.get("source", "manual"),
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event.id