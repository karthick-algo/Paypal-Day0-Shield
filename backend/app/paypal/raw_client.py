"""PayPal REST client for direct API calls (httpx + OAuth2 token caching).

Features:
- OAuth2 client credentials with token caching and single 401 retry
- PayPal-Request-Id idempotency on all mutations
- Structured error mapping for merchant-readable messages
- Webhook signature verification via PayPal API
"""

import time
import uuid
import logging
from typing import Optional, Dict, Any

import httpx

from app.settings import settings

logger = logging.getLogger("day0shield.paypal")

# PayPal error code -> merchant-readable message
PAYPAL_ERROR_MAP = {
    "INVALID_RESOURCE_ID": "The specified PayPal resource was not found. Verify the ID is correct.",
    "RESOURCE_NOT_FOUND": "The PayPal resource does not exist or has been deleted.",
    "NOT_AUTHORIZED": "You are not authorized to perform this action on the PayPal resource.",
    "PERMISSION_DENIED": "Permission denied. Check your sandbox app permissions.",
    "DUPLICATE_TRANSACTION": "This transaction has already been processed (idempotency protection).",
    "UNPROCESSABLE_ENTITY": "PayPal could not process this request. Check the input data.",
    "INTERNAL_SERVER_ERROR": "PayPal is experiencing issues. Please retry later.",
    "VALIDATION_ERROR": "The request data failed PayPal validation. Check required fields.",
    "ORDER_NOT_APPROVED": "The order has not been approved by the buyer yet.",
    "ORDER_ALREADY_CAPTURED": "This order has already been captured.",
    "SUBSCRIPTION_STATUS_INVALID": "Cannot perform this action on a subscription in its current state.",
}


class PayPalError(Exception):
    """Structured PayPal API error with merchant-readable message."""

    def __init__(self, status_code: int, error_name: str, message: str, details: Any = None):
        self.status_code = status_code
        self.error_name = error_name
        self.message = message
        self.details = details
        super().__init__(f"PayPal {status_code} {error_name}: {message}")


class PayPalClient:
    """Raw PayPal REST API client with OAuth2 token caching and 401 retry."""

    def __init__(self):
        self.base_url = settings.PAYPAL_BASE_URL
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_SECRET
        self._token: Optional[str] = None
        self._token_expires: float = 0

    async def _get_token(self, force_refresh: bool = False) -> str:
        """Get OAuth2 access token, using cache if valid.

        Args:
            force_refresh: If True, ignore cache and fetch a new token.
        """
        if not force_refresh and self._token and time.time() < self._token_expires:
            return self._token

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{self.base_url}/v1/oauth2/token",
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"},
                headers={
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                },
            )
            response.raise_for_status()
            data = response.json()
            self._token = data["access_token"]
            # Cache with 60s safety margin before expiry
            self._token_expires = time.time() + data.get("expires_in", 3600) - 60
            logger.info("PayPal OAuth2 token refreshed (expires in %ds)", data.get("expires_in", 3600))
            return self._token

    def _parse_error(self, response: httpx.Response) -> PayPalError:
        """Parse a PayPal error response into a structured PayPalError."""
        try:
            body = response.json()
        except Exception:
            body = {}

        error_name = body.get("name", body.get("error", "UNKNOWN_ERROR"))
        raw_message = body.get("message", body.get("error_description", response.text[:200]))
        details = body.get("details", [])

        # Map to merchant-readable message
        merchant_msg = PAYPAL_ERROR_MAP.get(error_name, raw_message)

        return PayPalError(
            status_code=response.status_code,
            error_name=error_name,
            message=merchant_msg,
            details=details,
        )

    async def _request(
        self,
        method: str,
        path: str,
        paypal_request_id: Optional[str] = None,
        _retried: bool = False,
        **kwargs,
    ) -> httpx.Response:
        """Make an authenticated request to PayPal with single 401 retry.

        Args:
            method: HTTP method (GET, POST, PUT, PATCH, DELETE)
            path: API path (e.g., /v2/checkout/orders)
            paypal_request_id: Explicit idempotency key; auto-generated if None for mutations
            _retried: Internal flag to prevent infinite retry loops
        """
        token = await self._get_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        headers["Content-Type"] = "application/json"

        # Add PayPal-Request-Id for idempotency on mutations
        if method.upper() in ("POST", "PUT", "PATCH"):
            req_id = paypal_request_id or str(uuid.uuid4())
            headers["PayPal-Request-Id"] = req_id

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                **kwargs,
            )

        # Single 401 retry: refresh token once, then retry
        if response.status_code == 401 and not _retried:
            logger.warning("PayPal 401 - refreshing OAuth token and retrying")
            self._token = None
            self._token_expires = 0
            return await self._request(
                method, path, paypal_request_id=paypal_request_id, _retried=True, **kwargs
            )

        return response

    def _check_response(self, response: httpx.Response, operation: str) -> dict:
        """Check response and raise PayPalError on failure. Return JSON body."""
        if response.status_code >= 400:
            error = self._parse_error(response)
            logger.error("PayPal %s failed: %s", operation, error)
            raise error

        if response.status_code == 204:
            return {}

        try:
            return response.json()
        except Exception:
            return {}

    # --- Orders v2 ---
    async def create_order(
        self, amount: str, currency: str = "USD", paypal_request_id: Optional[str] = None
    ) -> dict:
        """Create an order using Orders v2 API."""
        resp = await self._request(
            "POST",
            "/v2/checkout/orders",
            paypal_request_id=paypal_request_id,
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {"currency_code": currency, "value": amount}
                }],
            },
        )
        return self._check_response(resp, "create_order")

    async def get_order(self, order_id: str) -> dict:
        """Get order details."""
        resp = await self._request("GET", f"/v2/checkout/orders/{order_id}")
        return self._check_response(resp, "get_order")

    async def capture_order(self, order_id: str, paypal_request_id: Optional[str] = None) -> dict:
        """Capture an approved order."""
        resp = await self._request(
            "POST",
            f"/v2/checkout/orders/{order_id}/capture",
            paypal_request_id=paypal_request_id,
        )
        return self._check_response(resp, "capture_order")

    # --- Tracking ---
    async def add_tracking(
        self, order_id: str, capture_id: str, tracking_number: str, carrier: str,
        paypal_request_id: Optional[str] = None,
    ) -> dict:
        """Add tracking info to an order via POST /v2/checkout/orders/{id}/track.

        Args:
            order_id: The PayPal order ID
            capture_id: The capture ID from the order
            tracking_number: Carrier tracking number
            carrier: Carrier enum value (e.g., FEDEX, DHL, UPS)
        """
        resp = await self._request(
            "POST",
            f"/v2/checkout/orders/{order_id}/track",
            paypal_request_id=paypal_request_id,
            json={
                "trackers": [{
                    "capture_id": capture_id,
                    "tracking_number": tracking_number,
                    "carrier": carrier,
                    "notify_buyer": True,
                }],
            },
        )
        return self._check_response(resp, "add_tracking")

    # --- Subscriptions ---
    async def get_subscription(self, subscription_id: str) -> dict:
        """Get subscription details."""
        resp = await self._request("GET", f"/v1/billing/subscriptions/{subscription_id}")
        return self._check_response(resp, "get_subscription")

    async def suspend_subscription(
        self, subscription_id: str, reason: str = "Hazard protection",
        paypal_request_id: Optional[str] = None,
    ) -> bool:
        """Suspend a subscription to prevent billing failures during disruptions."""
        resp = await self._request(
            "POST",
            f"/v1/billing/subscriptions/{subscription_id}/suspend",
            paypal_request_id=paypal_request_id,
            json={"reason": reason},
        )
        if resp.status_code == 204:
            return True
        if resp.status_code >= 400:
            error = self._parse_error(resp)
            logger.error("PayPal suspend_subscription failed: %s", error)
            raise error
        return True

    async def activate_subscription(
        self, subscription_id: str, reason: str = "Hazard resolved",
        paypal_request_id: Optional[str] = None,
    ) -> bool:
        """Reactivate a suspended subscription."""
        resp = await self._request(
            "POST",
            f"/v1/billing/subscriptions/{subscription_id}/activate",
            paypal_request_id=paypal_request_id,
            json={"reason": reason},
        )
        if resp.status_code == 204:
            return True
        if resp.status_code >= 400:
            error = self._parse_error(resp)
            logger.error("PayPal activate_subscription failed: %s", error)
            raise error
        return True

    # --- Disputes ---
    async def list_disputes(self) -> dict:
        """List open disputes."""
        resp = await self._request("GET", "/v1/customer/disputes")
        return self._check_response(resp, "list_disputes")

    async def get_dispute(self, dispute_id: str) -> dict:
        """Get dispute details."""
        resp = await self._request("GET", f"/v1/customer/disputes/{dispute_id}")
        return self._check_response(resp, "get_dispute")

    async def provide_evidence(
        self, dispute_id: str, evidence: dict,
        paypal_request_id: Optional[str] = None,
    ) -> dict:
        """Submit evidence for a dispute defense."""
        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/provide-evidence",
            paypal_request_id=paypal_request_id,
            json=evidence,
        )
        return self._check_response(resp, "provide_evidence")

    async def send_dispute_message(
        self, dispute_id: str, message: str,
        paypal_request_id: Optional[str] = None,
    ) -> dict:
        """Send a message in a dispute case."""
        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/send-message",
            paypal_request_id=paypal_request_id,
            json={"message": message},
        )
        return self._check_response(resp, "send_dispute_message")

    async def adjudicate_dispute(self, dispute_id: str, outcome: str = "BUYER_FAVOR") -> dict:
        """Sandbox-only: settle a dispute."""
        resp = await self._request(
            "POST",
            f"/v1/customer/disputes/{dispute_id}/adjudicate",
            json={"adjudication_outcome": outcome},
        )
        return self._check_response(resp, "adjudicate_dispute")

    # --- Webhook Verification ---
    async def verify_webhook_signature(self, headers: dict, body: bytes) -> bool:
        """Verify webhook signature via PayPal's verification API.

        This always calls PayPal's verification endpoint regardless of APP_ENV,
        ensuring webhook authenticity in both development and production.
        """
        webhook_event = body.decode("utf-8") if isinstance(body, bytes) else body
        try:
            import json
            webhook_event = json.loads(webhook_event)
        except (json.JSONDecodeError, TypeError):
            pass

        resp = await self._request(
            "POST",
            "/v1/notifications/verify-webhook-signature",
            json={
                "auth_algo": headers.get("paypal-auth-algo", ""),
                "cert_url": headers.get("paypal-cert-url", ""),
                "transmission_id": headers.get("paypal-transmission-id", ""),
                "transmission_sig": headers.get("paypal-transmission-sig", ""),
                "transmission_time": headers.get("paypal-transmission-time", ""),
                "webhook_id": settings.PAYPAL_WEBHOOK_ID,
                "webhook_event": webhook_event,
            },
        )
        try:
            data = resp.json()
            verified = data.get("verification_status") == "SUCCESS"
            if not verified:
                logger.warning("Webhook signature verification failed: %s", data)
            return verified
        except Exception as e:
            logger.error("Webhook verification response parse error: %s", e)
            return False

    # --- Health Check ---
    async def health_check(self) -> Dict[str, Any]:
        """Test sandbox connectivity by fetching a fresh OAuth token."""
        try:
            token = await self._get_token(force_refresh=True)
            return {
                "status": "connected",
                "sandbox": True,
                "base_url": self.base_url,
                "token_cached": bool(token),
            }
        except Exception as e:
            return {
                "status": "error",
                "sandbox": True,
                "base_url": self.base_url,
                "error": str(e),
            }


# Singleton
paypal_client = PayPalClient()
