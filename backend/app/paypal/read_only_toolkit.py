"""Read‑only PayPal Toolkit wrapper.
All tool names must start with ``list_``, ``get_`` or ``show_``.
The wrapper is deliberately minimal – it only provides the HTTP client
configured for the sandbox and a helper to build URLs.
Real SDK calls should be added where ``# TODO`` comments appear.
"""

import os
from typing import Any, Dict

import httpx
try:
    from app.settings import settings
except ImportError:
    from backend.app.settings import settings

# Base URL – enforced to sandbox by settings validation
BASE_URL = getattr(settings, "PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")

class ReadOnlyPayPalClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            base_url=BASE_URL,
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_SECRET.get_secret_value()),
            timeout=30,
        )

    # Example read‑only tool – list orders
    async def list_orders(self, **params: Any) -> Dict[str, Any]:
        # The real SDK exposes a richer method; here we use raw HTTP for brevity.
        resp = await self.client.get("/v2/checkout/orders", params=params)
        resp.raise_for_status()
        return resp.json()

    # Additional read‑only helpers (list_customers, get_subscription, etc.)
    # TODO: implement other read‑only endpoints used by the LLM planner.

# Export a singleton used throughout the codebase
read_only_client = ReadOnlyPayPalClient()