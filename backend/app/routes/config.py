"""Config route — serves non-secret runtime config to the frontend."""

from fastapi import APIRouter, Depends
from app.security.auth import get_current_user
from app.settings import settings
from app.paypal.raw_client import paypal_client

router = APIRouter(tags=["config"])


@router.get("/config")
async def get_config(user: dict = Depends(get_current_user)):
    return {
        "app_env": settings.APP_ENV,
        "paypal_env": settings.PAYPAL_ENV,
        "ag_studio_license_key": settings.AG_STUDIO_LICENSE_KEY or "",
        "bryntum_license_key": settings.BRYNTUM_LICENSE_KEY or "",
        "max_daily_writes": settings.MAX_DAILY_WRITES,
        "max_actions_per_minute": settings.MAX_ACTIONS_PER_MINUTE,
        "max_refund_offer_usd": settings.MAX_REFUND_OFFER_USD,
        "paypal_base_url": settings.PAYPAL_BASE_URL,
    }


@router.get("/paypal/status")
async def get_paypal_status(user: dict = Depends(get_current_user)):
    """Check PayPal Sandbox connectivity and OAuth token health."""
    health = await paypal_client.health_check()
    return health
