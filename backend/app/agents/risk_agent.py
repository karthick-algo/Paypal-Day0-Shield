"""AI Risk Assessment Agent for Day-0 Shield.

This agent uses Google Gemini to analyze hazard scenarios and produce
risk assessments grounded in:
- Live weather data from the 15 global trade hubs
- PayPal Seller Protection policies via the RAG engine
- Monte Carlo risk modeling
- Read-only PayPal sandbox data

Key safety properties:
- The agent ONLY has read-only tools; all write operations go through
  the human-in-the-loop approval gate
- No PII or card data is ever sent to the model
- All inputs are sanitized through the 5-layer guardrails pipeline
- Prompt injection patterns in untrusted text (e.g., dispute messages)
  are intercepted before reaching the model
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional

from app.rag.engine import rag_engine
from app.security.guardrails import guardrails
from app.settings import settings

logger = logging.getLogger("day0shield.agent")

# Tool allowlist - ONLY these tools can be called by the agent
AGENT_TOOL_ALLOWLIST = {
    "retrieve_seller_protection_policy",
    "assess_weather_risk",
    "compute_dispute_probability",
    "list_exposed_entities",
    "generate_defense_brief",
}

# Audit log for all agent tool calls
_agent_audit_log: List[Dict[str, Any]] = []


def get_agent_audit_log() -> List[Dict[str, Any]]:
    """Return the in-memory agent audit log."""
    return list(_agent_audit_log)


def _log_tool_call(tool_name: str, args: Dict, result: Any, duration_ms: float):
    """Append to the agent audit log. No PII is stored."""
    entry = {
        "timestamp": time.time(),
        "tool_name": tool_name,
        "args_summary": {k: str(v)[:100] for k, v in args.items()},
        "result_summary": str(result)[:200] if result else "None",
        "duration_ms": round(duration_ms, 1),
        "allowed": tool_name in AGENT_TOOL_ALLOWLIST,
    }
    _agent_audit_log.append(entry)
    if len(_agent_audit_log) > 500:
        _agent_audit_log.pop(0)


# --- Agent Tools (read-only) ---

def tool_retrieve_seller_protection_policy(query: str) -> Dict[str, Any]:
    """Retrieve PayPal Seller Protection policies relevant to the query.

    Uses the RAG engine with TF-IDF + cosine similarity search.
    """
    start = time.time()
    # Sanitize the query through guardrails (prevent injection via dispute text)
    check = guardrails.inspect_input(query)
    if not check.is_safe:
        _log_tool_call("retrieve_seller_protection_policy", {"query": query},
                       {"blocked": True, "reason": check.violations}, 0)
        return {"error": "Input blocked by security guardrails", "violations": check.violations}

    results = rag_engine.retrieve(check.sanitized_text, top_k=3)
    duration = (time.time() - start) * 1000
    _log_tool_call("retrieve_seller_protection_policy", {"query": check.sanitized_text}, results, duration)
    return {"policies": results, "query": check.sanitized_text, "count": len(results)}


def tool_assess_weather_risk(region: str, severity: int) -> Dict[str, Any]:
    """Assess logistics disruption risk for a region based on weather severity.

    Returns CERI (Composite Environmental Risk Index) and recommended actions.
    """
    start = time.time()
    from app.core.risk_engine import compute_risk

    # Compute risk for a representative order
    risk = compute_risk("order", 500.0, severity, 1.0)
    sub_risk = compute_risk("subscription", 50.0, severity, 1.0)

    # CERI calculation
    w1, w2, w3 = 0.4, 0.35, 0.25
    s_disruption = min(severity / 5.0, 1.0)
    v_delay = risk["p_dispute"]
    c_criticality = risk["p_payment_failure"]
    ceri = w1 * s_disruption + w2 * v_delay + w3 * c_criticality

    result = {
        "region": region,
        "severity": severity,
        "ceri": round(ceri, 4),
        "ceri_rating": "CRITICAL" if ceri > 0.7 else ("HIGH" if ceri > 0.5 else ("MEDIUM" if ceri > 0.3 else "LOW")),
        "order_risk": risk,
        "subscription_risk": sub_risk,
        "recommended_actions": [],
    }

    if risk["p_dispute"] > 0.35:
        result["recommended_actions"].append("Submit dispute evidence with carrier delay proof")
    if risk["p_dispute"] > 0.12:
        result["recommended_actions"].append("Send proactive tracking notice to buyers")
    if sub_risk["p_payment_failure"] > 0.10:
        result["recommended_actions"].append("Pause subscriptions in affected region")

    duration = (time.time() - start) * 1000
    _log_tool_call("assess_weather_risk", {"region": region, "severity": severity}, result, duration)
    return result


def tool_compute_dispute_probability(
    amount: float,
    severity: int,
    entity_type: str = "order",
    distance_factor: float = 1.0,
) -> Dict[str, Any]:
    """Compute Monte Carlo dispute probability for a specific entity."""
    start = time.time()
    from app.core.risk_engine import compute_risk

    risk = compute_risk(entity_type, amount, severity, distance_factor)
    # Validate output bounds through guardrails
    risk = guardrails.validate_output_bounds(risk)

    duration = (time.time() - start) * 1000
    _log_tool_call("compute_dispute_probability", {
        "amount": amount, "severity": severity, "entity_type": entity_type,
    }, risk, duration)
    return risk


def tool_generate_defense_brief(
    entity_id: int,
    entity_type: str,
    hazard_type: str,
    region: str,
) -> Dict[str, Any]:
    """Generate a RAG-grounded evidentiary defense brief."""
    start = time.time()
    brief = rag_engine.generate_defense_brief(entity_id, entity_type, hazard_type, region)
    duration = (time.time() - start) * 1000
    _log_tool_call("generate_defense_brief", {
        "entity_id": entity_id, "entity_type": entity_type,
        "hazard_type": hazard_type, "region": region,
    }, brief, duration)
    return brief


# Tool registry
TOOLS = {
    "retrieve_seller_protection_policy": tool_retrieve_seller_protection_policy,
    "assess_weather_risk": tool_assess_weather_risk,
    "compute_dispute_probability": tool_compute_dispute_probability,
    "generate_defense_brief": tool_generate_defense_brief,
}

TOOL_SCHEMAS = [
    {
        "name": "retrieve_seller_protection_policy",
        "description": "Retrieve PayPal Seller Protection policies relevant to a dispute or hazard scenario. Input: query string about the scenario.",
        "parameters": {"query": {"type": "string", "description": "Search query about the dispute or hazard scenario"}},
    },
    {
        "name": "assess_weather_risk",
        "description": "Assess logistics disruption risk for a trade hub region. Returns CERI score and recommended actions.",
        "parameters": {
            "region": {"type": "string", "description": "Trade hub region name (e.g., 'Singapore', 'Rotterdam')"},
            "severity": {"type": "integer", "description": "Weather severity 1-5"},
        },
    },
    {
        "name": "compute_dispute_probability",
        "description": "Run Monte Carlo simulation to compute dispute probability for an order or subscription.",
        "parameters": {
            "amount": {"type": "number", "description": "Dollar amount at risk"},
            "severity": {"type": "integer", "description": "Hazard severity 1-5"},
            "entity_type": {"type": "string", "description": "'order' or 'subscription'"},
        },
    },
    {
        "name": "generate_defense_brief",
        "description": "Generate a RAG-grounded evidentiary defense brief for a dispute, citing PayPal Seller Protection policies.",
        "parameters": {
            "entity_id": {"type": "integer", "description": "Entity ID"},
            "entity_type": {"type": "string", "description": "'order' or 'subscription'"},
            "hazard_type": {"type": "string", "description": "Type of hazard (flood, storm, etc.)"},
            "region": {"type": "string", "description": "Affected region"},
        },
    },
]


async def run_risk_assessment(
    region: str,
    hazard_type: str,
    severity: int,
    exposed_orders: int = 0,
    exposed_subscriptions: int = 0,
    sample_amount: float = 500.0,
) -> Dict[str, Any]:
    """Run a complete risk assessment using the AI agent with tool calls.

    This function:
    1. Sanitizes all inputs through guardrails
    2. Calls the appropriate tools from the allowlist
    3. Optionally calls Gemini for natural language synthesis (if LLM_API_KEY is set)
    4. Returns a structured assessment

    If no LLM API key is configured, it runs in deterministic-only mode
    using the tools directly without LLM synthesis.
    """
    assessment_start = time.time()

    # Step 1: Sanitize inputs
    input_text = f"{region} {hazard_type} severity {severity}"
    check = guardrails.inspect_input(input_text)
    if not check.is_safe:
        return {
            "status": "blocked",
            "reason": "Input blocked by guardrails",
            "violations": check.violations,
        }

    # Step 2: Execute tool calls
    weather_risk = tool_assess_weather_risk(region, severity)
    dispute_prob = tool_compute_dispute_probability(sample_amount, severity, "order")
    sub_prob = tool_compute_dispute_probability(50.0, severity, "subscription")
    policies = tool_retrieve_seller_protection_policy(
        f"seller protection item not received force majeure {hazard_type} {region} carrier delay"
    )
    defense_brief = tool_generate_defense_brief(1, "order", hazard_type, region)

    # Step 3: Try LLM synthesis if available
    llm_summary = None
    if settings.LLM_API_KEY:
        try:
            llm_summary = await _call_llm_synthesis(
                region=region,
                hazard_type=hazard_type,
                severity=severity,
                weather_risk=weather_risk,
                dispute_prob=dispute_prob,
                policies=policies,
            )
        except Exception as e:
            logger.warning("LLM synthesis failed (falling back to deterministic): %s", e)

    # Step 4: Build structured assessment
    duration_ms = (time.time() - assessment_start) * 1000

    assessment = {
        "status": "complete",
        "region": region,
        "hazard_type": hazard_type,
        "severity": severity,
        "ceri": weather_risk["ceri"],
        "ceri_rating": weather_risk["ceri_rating"],
        "order_dispute_probability": dispute_prob["p_dispute"],
        "subscription_failure_probability": sub_prob["p_payment_failure"],
        "expected_impact_usd": dispute_prob["expected_impact_usd"],
        "recommended_actions": weather_risk["recommended_actions"],
        "policy_citations": [p["title"] for p in policies.get("policies", [])],
        "defense_brief_available": defense_brief.get("admissible", False),
        "llm_summary": llm_summary,
        "exposed_orders": exposed_orders,
        "exposed_subscriptions": exposed_subscriptions,
        "duration_ms": round(duration_ms, 1),
        "tools_called": len(_agent_audit_log),
        "mode": "llm_augmented" if llm_summary else "deterministic",
    }

    return assessment


async def _call_llm_synthesis(
    region: str,
    hazard_type: str,
    severity: int,
    weather_risk: Dict,
    dispute_prob: Dict,
    policies: Dict,
) -> Optional[str]:
    """Call Gemini to synthesize a natural language risk summary.

    SAFETY: No PII, card data, or secrets are included in the prompt.
    Only aggregated risk metrics and policy titles are sent.
    """
    if settings.LLM_PROVIDER == "google":
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.LLM_API_KEY)
            model = genai.GenerativeModel(settings.LLM_MODEL or "gemini-2.0-flash")

            # Build prompt with ONLY aggregated risk data - no PII
            prompt = (
                f"You are a logistics risk analyst for a PayPal merchant. "
                f"Summarize this risk assessment in 3-4 sentences for a merchant dashboard:\n\n"
                f"Region: {region}\n"
                f"Hazard: {hazard_type} (severity {severity}/5)\n"
                f"CERI Score: {weather_risk['ceri']} ({weather_risk['ceri_rating']})\n"
                f"Dispute Probability: {dispute_prob['p_dispute']:.1%}\n"
                f"Payment Failure Risk: {dispute_prob['p_payment_failure']:.1%}\n"
                f"Expected Financial Impact: ${dispute_prob['expected_impact_usd']:.2f}\n"
                f"Recommended Actions: {', '.join(weather_risk['recommended_actions']) or 'Monitor only'}\n"
                f"Applicable Policies: {', '.join(p['title'] for p in policies.get('policies', [])[:2])}\n\n"
                f"Be specific about the business impact and recommended steps. "
                f"Do not mention any personal information, card numbers, or account details."
            )

            response = model.generate_content(prompt)
            return response.text.strip()

        except ImportError:
            logger.info("google-generativeai not installed, skipping LLM synthesis")
            return None
    return None
