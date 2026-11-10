"""Dispute routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Dispute, Order
from app.schemas import DisputeOut
from app.security.auth import get_current_user

router = APIRouter(tags=["disputes"])


@router.get("/disputes")
async def list_disputes(
    merchant_id: Optional[int] = Query(None),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Dispute).order_by(Dispute.created_at.desc())
    if merchant_id is not None:
        query = query.join(Order, Dispute.order_id == Order.id).where(Order.merchant_id == merchant_id)
    result = await db.execute(query)
    disputes = result.scalars().all()
    return [DisputeOut.model_validate(d) for d in disputes]


@router.get("/disputes/{dispute_id}")
async def get_dispute(
    dispute_id: int,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Dispute).where(Dispute.id == dispute_id))
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return DisputeOut.model_validate(dispute)
