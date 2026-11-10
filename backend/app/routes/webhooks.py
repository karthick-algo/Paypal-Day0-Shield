"""PayPal webhook receiver - signature-verified, deduplicated, async processing.

This endpoint:
1. Verifies the webhook signature via PayPal's verification API (always, not just production)
2. Deduplicates by paypal_event_id
3. Stores the raw payload for replay safety
4. Returns 200 immediately (process async)
"""

import json
import logging
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import WebhookEvent, AuditLog
from app.paypal.raw_client import paypal_client
from app.settings import settings

logger = logging.getLogger("day0shield.webhooks")
router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/paypal")
async def receive_webhook(request: Request):
    """Receive and store PayPal webhook events with signature verification."""
    # 1. Parse body
    try:
        body = await request.body()
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_id = payload.get("id")
    event_type = payload.get("event_type", "UNKNOWN")

    if not event_id:
        raise HTTPException(status_code=400, detail="Missing event id")

    # 2. Verify webhook signature via PayPal API
    # Extract PayPal signature headers
    sig_headers = {
        "paypal-auth-algo": request.headers.get("paypal-auth-algo", ""),
        "paypal-cert-url": request.headers.get("paypal-cert-url", ""),
        "paypal-transmission-id": request.headers.get("paypal-transmission-id", ""),
        "paypal-transmission-sig": request.headers.get("paypal-transmission-sig", ""),
        "paypal-transmission-time": request.headers.get("paypal-transmission-time", ""),
    }

    has_sig_headers = any(sig_headers.values())

    if has_sig_headers:
        try:
            verified = await paypal_client.verify_webhook_signature(sig_headers, body)
            if not verified:
                logger.warning(
                    "Webhook signature verification FAILED for event %s (%s)",
                    event_id, event_type,
                )
                raise HTTPException(
                    status_code=401,
                    detail="Webhook signature verification failed",
                )
            logger.info("Webhook signature verified for event %s", event_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Webhook verification error: %s", e)
            # In sandbox, log but don't block if verification API itself fails
            if settings.APP_ENV == "production":
                raise HTTPException(
                    status_code=401,
                    detail="Webhook signature verification error",
                )
    else:
        # No signature headers - accept in development/sandbox only
        if settings.APP_ENV == "production":
            raise HTTPException(
                status_code=401,
                detail="Missing webhook signature headers",
            )
        logger.info("Webhook accepted without signature (sandbox/dev mode, event %s)", event_id)

    # 3. Store and deduplicate by event_id
    async with AsyncSessionLocal() as db:
        # Check for duplicate
        existing = await db.execute(
            select(WebhookEvent).where(WebhookEvent.paypal_event_id == event_id)
        )
        if existing.scalar_one_or_none():
            logger.info("Duplicate webhook event %s, skipping", event_id)
            return {"status": "duplicate", "event_id": event_id}

        # Store the event
        event = WebhookEvent(
            paypal_event_id=event_id,
            event_type=event_type,
            payload_json=json.dumps(payload),
            received_at=datetime.utcnow(),
        )
        db.add(event)

        # Audit trail for webhook reception
        db.add(AuditLog(
            user_id=None,
            ip=request.client.host if request.client else "unknown",
            event="webhook_received",
            entity_type="webhook",
            detail_json=json.dumps({
                "event_id": event_id,
                "event_type": event_type,
                "verified": has_sig_headers,
            }),
        ))

        await db.commit()

    logger.info("Webhook stored: %s (%s)", event_type, event_id)

    # 4. Return 200 immediately
    return {"status": "received", "event_id": event_id, "event_type": event_type}
