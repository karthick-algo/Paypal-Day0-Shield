"""Write‑only PayPal Toolkit wrapper.
Only methods that perform mutating PayPal calls belong here. The client
uses the same sandbox base URL but a separate HTTPX instance. All writes
must include an idempotency key header (`PayPal-Request-Id`).
"""

import uuid
from typing import Any, Dict

import httpx
try:
    from app.settings import settings
except ImportError:
    from backend.app.settings import settings

BASE_URL = getattr(settings, "PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")

class WriteOnlyPayPalClient:
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            base_url=BASE_URL,
            auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_SECRET.get_secret_value()),
            timeout=30,
        )

    def _idempotency_headers(self) -> Dict[str, str]:
        return {"PayPal-Request-Id": str(uuid.uuid4())}

    # Example write‑only tool – capture order
    async def capture_order(self, order_id: str, **payload: Any) -> Dict[str, Any]:
        resp = await self.client.post(
            f"/v2/checkout/orders/{order_id}/capture",
            json=payload,
            headers=self._idempotency_headers(),
        )
        resp.raise_for_status()
        return resp.json()

    # TODO: add other write‑only methods (dispute evidence, subscription suspend, etc.)

write_only_client = WriteOnlyPayPalClient()