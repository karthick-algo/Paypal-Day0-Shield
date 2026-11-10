"""Pydantic v2 schemas for Day-0 Shield."""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict


# --- Auth ---
class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    password: str


class LoginResponse(BaseModel):
    username: str
    role: str
    csrf_token: str


# --- Hazard ---
class HazardScenario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    type: str = "flood"
    region: str = "Chennai"
    severity: int = 4
    duration_days: int = 3


# --- Actions ---
class ProposedAction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    entity_type: str
    entity_id: int
    action_type: Literal["tracking_notice", "subscription_pause", "dispute_evidence", "none"]
    rationale: str
    cost_estimate: Optional[float] = None
    benefit_estimate: Optional[float] = None


class ActionDecision(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action_ids: list[int]
    decision: Literal["approved", "rejected"]


# --- Read models (from_attributes=True for ORM) ---
class MerchantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    business_type: str
    ship_from_region: str
    sandbox_payer_id: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    merchant_id: int
    buyer_region: str
    amount: float
    currency: str
    status: str
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    is_live_sandbox: bool = False
    created_at: Optional[datetime] = None


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    paypal_subscription_id: Optional[str] = None
    merchant_id: int
    plan_id: str
    status: str
    next_billing_date: Optional[datetime] = None
    is_live_sandbox: bool = False
    created_at: Optional[datetime] = None


class HazardEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    region: str
    severity: int
    starts_at: datetime
    ends_at: datetime
    source: str
    created_at: Optional[datetime] = None


class RiskSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    hazard_event_id: int
    p_dispute: float
    p_payment_failure: float
    expected_impact_usd: float
    created_at: Optional[datetime] = None


class ActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: int
    action_type: str
    status: str
    rationale: str
    cost_estimate: Optional[float] = None
    benefit_estimate: Optional[float] = None
    paypal_request_id: Optional[str] = None
    created_at: Optional[datetime] = None
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None


class DisputeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    paypal_dispute_id: str
    order_id: Optional[int] = None
    status: str
    reason: str
    evidence_draft: Optional[str] = None
    created_at: Optional[datetime] = None


class WebhookEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    paypal_event_id: str
    event_type: str
    payload_json: str
    received_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None


class AgentEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    run_id: str
    workflow_run_id: Optional[str] = None
    node: str
    kind: str
    summary: str
    tool_name: Optional[str] = None
    tool_access: Optional[str] = None
    tool_args_json: Optional[str] = None
    created_at: Optional[datetime] = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ts: Optional[datetime] = None
    user_id: Optional[int] = None
    ip: Optional[str] = None
    event: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    detail_json: Optional[str] = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    payload_json: str
    status: str
    attempts: int
    max_attempts: int
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


# --- Dashboard ---
class DashboardStats(BaseModel):
    at_risk_orders: int = 0
    at_risk_subscriptions: int = 0
    total_exposure_usd: float = 0.0
    active_hazards: int = 0
    pending_actions: int = 0
    writes_today: int = 0
    max_daily_writes: int = 200


class RiskChartPoint(BaseModel):
    day: int
    p5: float
    p25: float
    p50: float
    p75: float
    p95: float


class SystemMetrics(BaseModel):
    queue_depth: int = 0
    failed_jobs: int = 0
    webhook_backlog: int = 0
    writes_today: int = 0
    max_daily_writes: int = 200
    last_paypal_error: Optional[str] = None
