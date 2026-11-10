"""SQLAlchemy ORM models for Day-0 Shield.

All models use portable types (no Postgres-specific types) so they work
with both SQLite (aiosqlite) and PostgreSQL (asyncpg).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, Text,
    ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Core business entities
# ---------------------------------------------------------------------------

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    business_type = Column(String(100), nullable=False)
    ship_from_region = Column(String(100), nullable=False)
    sandbox_payer_id = Column(String(100), nullable=True)

    orders = relationship("Order", back_populates="merchant")
    subscriptions = relationship("Subscription", back_populates="merchant")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    paypal_order_id = Column(String(100), unique=True, nullable=True)
    paypal_capture_id = Column(String(100), unique=True, nullable=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    buyer_region = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default="CREATED")
    tracking_number = Column(String(200), nullable=True)
    carrier = Column(String(100), nullable=True)
    is_live_sandbox = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="orders")
    disputes = relationship("Dispute", back_populates="order")


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    paypal_subscription_id = Column(String(100), unique=True, nullable=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    plan_id = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    next_billing_date = Column(DateTime, nullable=True)
    is_live_sandbox = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="subscriptions")


class HazardEvent(Base):
    __tablename__ = "hazard_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False)  # flood, storm, heatwave
    region = Column(String(100), nullable=False)
    severity = Column(Integer, nullable=False)  # 1-5
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    source = Column(String(50), nullable=False)  # open-meteo | scenario-button
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(20), nullable=False)  # order | subscription
    entity_id = Column(Integer, nullable=False)
    hazard_event_id = Column(Integer, ForeignKey("hazard_events.id"), nullable=False)
    p_dispute = Column(Float, nullable=False)
    p_payment_failure = Column(Float, nullable=False)
    expected_impact_usd = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_risk_snapshots_entity", "entity_type", "entity_id"),
    )


class Action(Base):
    __tablename__ = "actions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(20), nullable=False)
    entity_id = Column(Integer, nullable=False)
    action_type = Column(String(50), nullable=False)  # tracking_notice | subscription_pause | dispute_evidence | none
    status = Column(String(30), nullable=False, default="pending_approval")
    rationale = Column(Text, nullable=False, default="")
    cost_estimate = Column(Float, nullable=True)
    benefit_estimate = Column(Float, nullable=True)
    paypal_request_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    decided_user = relationship("User", foreign_keys=[decided_by])


class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    paypal_dispute_id = Column(String(100), unique=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    status = Column(String(50), nullable=False)
    reason = Column(String(200), nullable=False, default="")
    evidence_draft = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="disputes")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    paypal_event_id = Column(String(100), unique=True, nullable=False)
    event_type = Column(String(100), nullable=False)
    payload_json = Column(Text, nullable=False)  # stored as JSON string for portability
    received_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)


class AgentEvent(Base):
    __tablename__ = "agent_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(100), nullable=False)
    workflow_run_id = Column(String(100), nullable=True)
    node = Column(String(100), nullable=False)
    kind = Column(String(50), nullable=False)
    summary = Column(Text, nullable=False, default="")
    tool_name = Column(String(100), nullable=True)
    tool_access = Column(String(10), nullable=True)  # read | write | none
    tool_args_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(500), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")  # viewer | approver
    failed_logins = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ts = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip = Column(String(50), nullable=True)
    event = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    detail_json = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_audit_log_ts", "ts"),
    )


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False)
    payload_json = Column(Text, nullable=False, default="{}")
    status = Column(String(20), nullable=False, default="queued")
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)
    run_after = Column(DateTime, nullable=True)
    locked_by = Column(String(100), nullable=True)
    locked_until = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_jobs_status_run_after", "status", "run_after"),
    )
