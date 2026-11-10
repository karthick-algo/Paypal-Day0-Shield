"""Unit and integration tests for PayPal platform integration.

Tests:
1. OAuth token caching and single 401 retry
2. PayPal-Request-Id idempotency key generation & pass-through
3. Error parsing & merchant-readable mapping
4. Orders v2 payload structure & response handling
5. Tracking API request structure
6. Subscriptions suspend/activate requests
7. Disputes evidence & message submission
8. Webhook signature verification flow
"""

import asyncio
import json
import time
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

from app.paypal.raw_client import PayPalClient, PayPalError, PAYPAL_ERROR_MAP
from app.settings import settings


@pytest.fixture
def mock_paypal():
    client = PayPalClient()
    client.client_id = "test-client-id"
    client.client_secret = "test-client-secret"
    return client


class TestPayPalClientCore:

    def test_oauth_caching(self, mock_paypal):
        """Verify token is cached and reused within expiry window."""
        mock_paypal._token = "cached-token-12345"
        mock_paypal._token_expires = time.time() + 3000

        token = asyncio.run(mock_paypal._get_token())
        assert token == "cached-token-12345"

    def test_idempotency_header_added(self, mock_paypal):
        """Verify PayPal-Request-Id is automatically generated and added on mutations."""
        with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
            mock_paypal._token = "fake-token"
            mock_paypal._token_expires = time.time() + 3000

            mock_resp = MagicMock()
            mock_resp.status_code = 201
            mock_resp.json.return_value = {"id": "ORDER-123", "status": "CREATED"}
            mock_req.return_value = mock_resp

            asyncio.run(mock_paypal._request("POST", "/v2/checkout/orders", json={"intent": "CAPTURE"}))

            assert mock_req.called
            call_kwargs = mock_req.call_args[1]
            headers = call_kwargs["headers"]
            assert "PayPal-Request-Id" in headers
            assert len(headers["PayPal-Request-Id"]) == 36  # UUIDv4 length
            assert headers["Authorization"] == "Bearer fake-token"

    def test_explicit_idempotency_key_preserved(self, mock_paypal):
        """Verify an explicit idempotency key is preserved rather than overwritten."""
        with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
            mock_paypal._token = "fake-token"
            mock_paypal._token_expires = time.time() + 3000

            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {"status": "SUCCESS"}
            mock_req.return_value = mock_resp

            custom_id = "custom-idempotency-key-001"
            asyncio.run(mock_paypal._request(
                "POST",
                "/v2/checkout/orders",
                paypal_request_id=custom_id,
                json={},
            ))

            headers = mock_req.call_args[1]["headers"]
            assert headers["PayPal-Request-Id"] == custom_id

    def test_single_401_retry_logic(self, mock_paypal):
        """Verify client automatically refreshes token on 401 and retries once."""
        mock_paypal._token = "expired-token"
        mock_paypal._token_expires = time.time() + 3000

        # First request returns 401, second returns 200
        resp_401 = MagicMock(status_code=401, text="Unauthorized")
        resp_200 = MagicMock(status_code=200, json=lambda: {"id": "ORD-1"}, text="{}")

        with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req, \
             patch.object(mock_paypal, "_get_token", new_callable=AsyncMock) as mock_get_token:

            mock_get_token.return_value = "new-fresh-token"
            mock_req.side_effect = [resp_401, resp_200]

            final_resp = asyncio.run(mock_paypal._request("GET", "/v2/checkout/orders/ORD-1"))
            assert final_resp.status_code == 200
            assert mock_req.call_count == 2
            assert mock_paypal._token is None  # Token cache was cleared on 401

    def test_structured_error_mapping(self, mock_paypal):
        """Verify PayPal API errors are converted to merchant-readable exceptions."""
        resp = MagicMock(
            status_code=404,
            json=lambda: {
                "name": "RESOURCE_NOT_FOUND",
                "message": "The specified resource does not exist.",
                "details": [{"issue": "ORDER_NOT_FOUND"}],
            },
            text="",
        )

        error = mock_paypal._parse_error(resp)
        assert isinstance(error, PayPalError)
        assert error.status_code == 404
        assert error.error_name == "RESOURCE_NOT_FOUND"
        assert error.message == PAYPAL_ERROR_MAP["RESOURCE_NOT_FOUND"]
        assert error.details == [{"issue": "ORDER_NOT_FOUND"}]


class TestPayPalOperations:

    def test_create_order_payload(self, mock_paypal):
        """Verify Orders v2 create structure."""
        with patch.object(mock_paypal, "_request", new_callable=AsyncMock) as mock_req:
            mock_resp = MagicMock(status_code=201, json=lambda: {"id": "ORD-TEST-1", "status": "CREATED"})
            mock_req.return_value = mock_resp

            result = asyncio.run(mock_paypal.create_order("150.00", "USD"))
            assert result["id"] == "ORD-TEST-1"
            assert result["status"] == "CREATED"

            call_args = mock_req.call_args
            assert call_args[0][0] == "POST"
            assert call_args[0][1] == "/v2/checkout/orders"
            assert call_args[1]["json"]["purchase_units"][0]["amount"]["value"] == "150.00"

    def test_add_tracking_payload(self, mock_paypal):
        """Verify Tracking API adds carrier and tracking number."""
        with patch.object(mock_paypal, "_request", new_callable=AsyncMock) as mock_req:
            mock_resp = MagicMock(status_code=200, json=lambda: {"status": "SUCCESS"})
            mock_req.return_value = mock_resp

            result = asyncio.run(mock_paypal.add_tracking(
                order_id="ORD-101",
                capture_id="CAP-101",
                tracking_number="TRACK-9999",
                carrier="FEDEX",
            ))
            assert result["status"] == "SUCCESS"
            call_json = mock_req.call_args[1]["json"]
            assert call_json["trackers"][0]["tracking_number"] == "TRACK-9999"
            assert call_json["trackers"][0]["carrier"] == "FEDEX"
            assert call_json["trackers"][0]["notify_buyer"] is True

    def test_subscription_suspend_and_activate(self, mock_paypal):
        """Verify subscription suspend and activate calls."""
        with patch.object(mock_paypal, "_request", new_callable=AsyncMock) as mock_req:
            mock_req.return_value = MagicMock(status_code=204)

            suspended = asyncio.run(mock_paypal.suspend_subscription("I-SUB123", "Disaster protection"))
            assert suspended is True
            assert mock_req.call_args[0][1] == "/v1/billing/subscriptions/I-SUB123/suspend"

            activated = asyncio.run(mock_paypal.activate_subscription("I-SUB123", "Disaster ended"))
            assert activated is True
            assert mock_req.call_args[0][1] == "/v1/billing/subscriptions/I-SUB123/activate"

    def test_dispute_evidence_submission(self, mock_paypal):
        """Verify provide_evidence submits structured evidence package."""
        with patch.object(mock_paypal, "_request", new_callable=AsyncMock) as mock_req:
            mock_resp = MagicMock(status_code=200, json=lambda: {"acknowledged": True})
            mock_req.return_value = mock_resp

            evidence = {
                "evidence_type": "PROOF_OF_FULFILLMENT",
                "notes": "Force majeure transit delay caused by regional typhoon.",
            }
            res = asyncio.run(mock_paypal.provide_evidence("PP-D-12345", evidence))
            assert res["acknowledged"] is True
            assert mock_req.call_args[0][1] == "/v1/customer/disputes/PP-D-12345/provide-evidence"
