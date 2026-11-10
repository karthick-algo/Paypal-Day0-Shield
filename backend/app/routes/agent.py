"""AI Agent routes - risk assessment and agent audit log."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.security.auth import get_current_user
from app.agents.risk_agent import run_risk_assessment, get_agent_audit_log, TOOL_SCHEMAS

logger = logging.getLogger("day0shield.agent_routes")
router = APIRouter(tags=["agent"])


class RiskAssessmentRequest(BaseModel):
    region: str = Field(..., description="Trade hub region (e.g., 'Singapore', 'Rotterdam')")
    hazard_type: str = Field(..., description="Hazard type (e.g., 'typhoon', 'flood', 'blizzard')")
    severity: int = Field(..., ge=1, le=5, description="Severity 1-5")
    exposed_orders: int = Field(0, ge=0)
    exposed_subscriptions: int = Field(0, ge=0)
    sample_amount: float = Field(500.0, gt=0)


@router.post("/agent/assess")
async def assess_risk(
    body: RiskAssessmentRequest,
    user: dict = Depends(get_current_user),
):
    """Run an AI-powered risk assessment for a hazard scenario.

    This calls the risk agent which uses read-only tools:
    - Weather risk assessment (CERI calculation)
    - Monte Carlo dispute probability
    - RAG policy retrieval
    - Defense brief generation
    - Optional LLM synthesis via Gemini

    All inputs are sanitized through the guardrails pipeline.
    No PII or secrets are sent to the LLM.
    """
    result = await run_risk_assessment(
        region=body.region,
        hazard_type=body.hazard_type,
        severity=body.severity,
        exposed_orders=body.exposed_orders,
        exposed_subscriptions=body.exposed_subscriptions,
        sample_amount=body.sample_amount,
    )
    return result


@router.get("/agent/audit-log")
async def agent_audit(
    limit: int = Query(50, ge=1, le=500),
    user: dict = Depends(get_current_user),
):
    """Return the agent's tool call audit log.

    Every tool call made by the agent is recorded with:
    - Timestamp, tool name, sanitized args, result summary, duration
    - Whether the tool was in the allowlist
    """
    log = get_agent_audit_log()
    return {"entries": log[-limit:], "total": len(log)}


@router.get("/agent/tools")
async def agent_tools(user: dict = Depends(get_current_user)):
    """Return the agent's tool allowlist and schemas."""
    return {"tools": TOOL_SCHEMAS}
