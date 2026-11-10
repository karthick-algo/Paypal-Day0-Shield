"""Action management routes: list, approve/reject, execute against PayPal APIs.

The execute endpoint is the ONLY place that calls PayPal write APIs.
Every execution:
- Requires APPROVER role
- Uses the pre-assigned PayPal-Request-Id for idempotency
- Calls the actual PayPal sandbox API
- Logs every call to the audit ledger
- Returns structured results or errors
"""

import uuid
import json
import logging
from datetime import datetime

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Action, AuditLog, AgentEvent, Order, Subscription
from app.schemas import ActionDecision, ActionOut
from app.security.auth import get_current_user
from app.paypal.raw_client import paypal_client, PayPalError
from app.settings import settings

logger = logging.getLogger("day0shield.actions")
router = APIRouter(tags=["actions"])


@router.get("/actions")
async def list_actions(
    status: Optional[str] = Query(None, description="Filter by status"),
    merchant_id: Optional[int] = Query(None, description="Filter by merchant ID"),
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Action).order_by(Action.created_at.desc())
    if status:
        query = query.where(Action.status == status)
    if merchant_id is not None:
        order_ids_subq = select(Order.id).where(Order.merchant_id == merchant_id)
        sub_ids_subq = select(Subscription.id).where(Subscription.merchant_id == merchant_id)
        query = query.where(
            or_(
                and_(Action.entity_type == "order", Action.entity_id.in_(order_ids_subq)),
                and_(Action.entity_type == "subscription", Action.entity_id.in_(sub_ids_subq)),
            )
        )
    result = await db.execute(query)
    actions = result.scalars().all()
    return [ActionOut.model_validate(a) for a in actions]


@router.post("/actions/decide")
async def decide_actions(
    body: ActionDecision,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a batch of actions. Requires approver role."""
    if user.get("role") not in ("approver",):
        raise HTTPException(status_code=403, detail="Only approvers can decide actions")

    # Check daily write cap for approvals
    if body.decision == "approved":
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        count_result = await db.execute(
            select(func.count(Action.id)).where(
                and_(
                    Action.status.in_(["approved", "executed"]),
                    Action.decided_at >= today_start,
                )
            )
        )
        writes_today = count_result.scalar() or 0
        if writes_today + len(body.action_ids) > settings.MAX_DAILY_WRITES:
            raise HTTPException(
                status_code=429,
                detail=f"Daily write cap ({settings.MAX_DAILY_WRITES}) would be exceeded"
            )

    updated = []
    for action_id in body.action_ids:
        result = await db.execute(select(Action).where(Action.id == action_id))
        action = result.scalar_one_or_none()
        if not action:
            continue
        if action.status != "pending_approval":
            continue

        action.status = body.decision
        action.decided_at = datetime.utcnow()
        action.decided_by = user.get("user_id")

        if body.decision == "approved":
            action.paypal_request_id = str(uuid.uuid4())

        updated.append(action.id)

        # Audit log
        db.add(AuditLog(
            user_id=user.get("user_id"),
            ip="api",
            event=f"action_{body.decision}",
            entity_type="action",
            entity_id=action.id,
            detail_json=json.dumps({
                "action_type": action.action_type,
                "entity_type": action.entity_type,
                "entity_id": action.entity_id,
                "paypal_request_id": action.paypal_request_id,
            }),
        ))

    await db.commit()
    return {"updated": updated, "count": len(updated)}


async def _execute_tracking_notice(action: Action, order: Order, db: AsyncSession) -> dict:
    """Execute a tracking notice action against PayPal Tracking API."""
    if not order.paypal_order_id or not order.paypal_capture_id:
        return {
            "status": "skipped",
            "reason": "Order has no PayPal order/capture ID (seeded data without live sandbox)",
        }

    tracking_number = order.tracking_number or f"TRK-WEATHER-{uuid.uuid4().hex[:8].upper()}"
    carrier = order.carrier or "OTHER"

    try:
        result = await paypal_client.add_tracking(
            order_id=order.paypal_order_id,
            capture_id=order.paypal_capture_id,
            tracking_number=tracking_number,
            carrier=carrier,
            paypal_request_id=action.paypal_request_id,
        )
        return {"status": "success", "paypal_response": result}
    except PayPalError as e:
        return {"status": "error", "error": str(e), "code": e.error_name}


async def _execute_subscription_pause(action: Action, sub: Subscription, db: AsyncSession) -> dict:
    """Execute a subscription pause against PayPal Subscriptions API."""
    if not sub.paypal_subscription_id:
        return {
            "status": "skipped",
            "reason": "Subscription has no PayPal subscription ID (seeded data without live sandbox)",
        }

    try:
        await paypal_client.suspend_subscription(
            subscription_id=sub.paypal_subscription_id,
            reason="Day-0 Shield hazard protection: proactive billing pause to prevent payment failures",
            paypal_request_id=action.paypal_request_id,
        )
        sub.status = "SUSPENDED"
        return {"status": "success", "new_status": "SUSPENDED"}
    except PayPalError as e:
        return {"status": "error", "error": str(e), "code": e.error_name}


async def _execute_dispute_evidence(action: Action, order: Order, db: AsyncSession) -> dict:
    """Execute dispute evidence submission against PayPal Disputes API."""
    # Find related dispute
    from app.models import Dispute
    dispute_result = await db.execute(
        select(Dispute).where(Dispute.order_id == order.id).limit(1)
    )
    dispute = dispute_result.scalar_one_or_none()

    if not dispute or not dispute.paypal_dispute_id:
        return {
            "status": "skipped",
            "reason": "No linked PayPal dispute found for this order",
        }

    # Build evidence from RAG engine
    from app.rag.engine import rag_engine
    brief = rag_engine.generate_defense_brief(
        entity_id=order.id,
        entity_type="order",
        hazard_type="weather_disruption",
        region=order.buyer_region,
    )

    try:
        result = await paypal_client.provide_evidence(
            dispute_id=dispute.paypal_dispute_id,
            evidence={
                "evidence_type": "PROOF_OF_FULFILLMENT",
                "notes": brief["defense_brief"][:2000],
                "evidence_info": {
                    "tracking_info": [{
                        "carrier_name": order.carrier or "OTHER",
                        "tracking_number": order.tracking_number or "PENDING",
                    }],
                },
            },
            paypal_request_id=action.paypal_request_id,
        )
        return {"status": "success", "paypal_response": result}
    except PayPalError as e:
        return {"status": "error", "error": str(e), "code": e.error_name}


@router.post("/actions/{action_id}/execute")
async def execute_action(
    action_id: int,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute a single approved action by calling the actual PayPal Sandbox API.

    This is the ONLY endpoint that performs PayPal write operations.
    Every call uses the pre-assigned PayPal-Request-Id for idempotency.
    """
    if user.get("role") not in ("approver",):
        raise HTTPException(status_code=403, detail="Only approvers can execute actions")

    result = await db.execute(select(Action).where(Action.id == action_id))
    action = result.scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    if action.status != "approved":
        raise HTTPException(status_code=400, detail="Action must be approved before execution")

    # Resolve the target entity
    exec_result = {"status": "unknown"}

    if action.entity_type == "order":
        order_result = await db.execute(select(Order).where(Order.id == action.entity_id))
        order = order_result.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if action.action_type == "tracking_notice":
            exec_result = await _execute_tracking_notice(action, order, db)
        elif action.action_type == "dispute_evidence":
            exec_result = await _execute_dispute_evidence(action, order, db)
        else:
            exec_result = {"status": "skipped", "reason": f"Unknown action type: {action.action_type}"}

    elif action.entity_type == "subscription":
        sub_result = await db.execute(select(Subscription).where(Subscription.id == action.entity_id))
        sub = sub_result.scalar_one_or_none()
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")

        if action.action_type == "subscription_pause":
            exec_result = await _execute_subscription_pause(action, sub, db)
        else:
            exec_result = {"status": "skipped", "reason": f"Unknown action type: {action.action_type}"}

    # Update action status
    if exec_result.get("status") == "success":
        action.status = "executed"
    elif exec_result.get("status") == "error":
        action.status = "failed"
    else:
        action.status = "executed"  # skipped counts as executed (no PayPal entity)

    # Record agent event
    db.add(AgentEvent(
        run_id=str(uuid.uuid4())[:8],
        node="action_executor",
        kind="action_executed",
        summary=f"Executed {action.action_type} for {action.entity_type} #{action.entity_id}: {exec_result.get('status')}",
        tool_name=f"execute_{action.action_type}",
        tool_access="write",
        tool_args_json=json.dumps({
            "paypal_request_id": action.paypal_request_id,
            "result": exec_result,
        }),
    ))

    # Audit log
    db.add(AuditLog(
        user_id=user.get("user_id"),
        ip="api",
        event="action_executed",
        entity_type="action",
        entity_id=action.id,
        detail_json=json.dumps({
            "action_type": action.action_type,
            "paypal_request_id": action.paypal_request_id,
            "execution_result": exec_result,
        }),
    ))

    await db.commit()

    out = ActionOut.model_validate(action)
    return {
        "action": out,
        "execution_result": exec_result,
    }
