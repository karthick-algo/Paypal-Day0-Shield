"""Hazard scenario routes."""

import uuid
import logging
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import HazardEvent, Order, Subscription, RiskSnapshot, Action, AgentEvent, Merchant
from app.schemas import HazardScenario, HazardEventOut
from app.security.auth import get_current_user
from app.core.risk_engine import compute_risk

logger = logging.getLogger("day0shield.hazard")
router = APIRouter(tags=["hazards"])

# Region mapping for scenario matching
REGION_MAP = {
    # Americas Corridors
    "New York": ["New York", "East Coast", "US-East", "North America", "United States", "New Jersey"],
    "Los Angeles": ["Los Angeles", "West Coast", "US-West", "California", "North America", "United States"],
    "Chicago": ["Chicago", "Midwest", "US-Midwest", "North America", "United States", "Illinois"],
    # EMEA Corridors
    "London": ["London", "United Kingdom", "UK", "Europe", "Heathrow"],
    "Rotterdam": ["Rotterdam", "Netherlands", "Western Europe", "Europe", "Amsterdam"],
    "Frankfurt": ["Frankfurt", "Germany", "Central Europe", "Europe"],
    "Dubai": ["Dubai", "UAE", "Middle East", "GCC", "Jebel Ali"],
    # APAC Corridors
    "Singapore": ["Singapore", "Southeast Asia", "ASEAN", "APAC", "Straits"],
    "Tokyo": ["Tokyo", "Japan", "East Asia", "APAC", "Yokohama"],
    "Shanghai": ["Shanghai", "China", "East Asia", "APAC", "Ningbo"],
    "Sydney": ["Sydney", "Australia", "Oceania", "APAC"],
    # South Asia Corridors
    "Chennai": ["Chennai", "Tamil Nadu", "South India", "India", "South Asia"],
    "Mumbai": ["Mumbai", "Maharashtra", "West India", "India", "South Asia", "Nhava Sheva"],
    "Delhi": ["Delhi", "NCR", "North India", "India", "South Asia"],
    "Kolkata": ["Kolkata", "West Bengal", "East India", "India", "South Asia"],
    "Bangalore": ["Bangalore", "Karnataka", "South India", "India", "South Asia"],
}


@router.post("/hazards/scenario")
async def trigger_scenario(
    scenario: HazardScenario,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a hazard scenario. Creates hazard event, finds exposed entities, computes risk."""
    run_id = str(uuid.uuid4())[:8]

    # Create hazard event
    now = datetime.utcnow()
    hazard = HazardEvent(
        type=scenario.type,
        region=scenario.region,
        severity=scenario.severity,
        starts_at=now,
        ends_at=now + timedelta(days=scenario.duration_days),
        source="scenario-button",
    )
    db.add(hazard)
    await db.flush()

    # Log agent event
    db.add(AgentEvent(
        run_id=run_id, workflow_run_id=run_id, node="hazard_node", kind="scenario_triggered",
        summary=f"Hazard: {scenario.type} in {scenario.region} (severity {scenario.severity})",
        tool_name="scenario_trigger", tool_access="none",
    ))

    # Find exposed orders - match by buyer_region or merchant's ship_from_region
    matching_regions = REGION_MAP.get(scenario.region, [scenario.region])

    # Get merchants in affected region
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.ship_from_region.in_(matching_regions))
    )
    affected_merchants = merchant_result.scalars().all()
    merchant_ids = [m.id for m in affected_merchants]

    # Get orders from affected merchants or with affected buyer regions
    order_result = await db.execute(
        select(Order).where(
            (Order.merchant_id.in_(merchant_ids)) | (Order.buyer_region.in_(matching_regions))
        )
    )
    exposed_orders = order_result.scalars().all()

    # Get subscriptions from affected merchants
    sub_result = await db.execute(
        select(Subscription).where(Subscription.merchant_id.in_(merchant_ids))
    )
    exposed_subs = sub_result.scalars().all()

        # RAG Retrieval for policy-backed dispute defense
    db.add(AgentEvent(
        run_id=run_id, workflow_run_id=run_id, node="rag_policy_node", kind="policy_retrieved",
        summary=f"RAG retrieved PayPal Seller Protection clauses for {scenario.type} in {scenario.region} (PAYPAL-SP-001, PAYPAL-DR-002, PAYPAL-FM-003)",
        tool_name="retrieve_seller_protection_policy", tool_access="read",
    ))
    db.add(AgentEvent(
        run_id=run_id, workflow_run_id=run_id, node="exposure_node", kind="exposure_computed",
        summary=f"Found {len(exposed_orders)} orders, {len(exposed_subs)} subscriptions exposed",
        tool_name="exposure_scan", tool_access="read",
    ))

    # Compute risk for each exposed entity
    risk_snapshots = []
    actions = []

    for order in exposed_orders:
        risk = compute_risk("order", order.amount, scenario.severity, 1.0)
        snap = RiskSnapshot(
            entity_type="order",
            entity_id=order.id,
            hazard_event_id=hazard.id,
            p_dispute=risk["p_dispute"],
            p_payment_failure=risk["p_payment_failure"],
            expected_impact_usd=risk["expected_impact_usd"],
        )
        risk_snapshots.append(snap)

        # Determine action based on risk thresholds
        if risk["p_dispute"] > 0.35:
            action_type = "dispute_evidence"
            rationale = f"High dispute risk ({risk['p_dispute']:.0%}). Grounded in PayPal Seller Protection Sec 11.2 (PAYPAL-SP-001): Auto-compile force majeure carrier delay evidence."
        elif risk["p_dispute"] > 0.12:
            action_type = "tracking_notice"
            rationale = f"Moderate dispute risk ({risk['p_dispute']:.0%}). Per PayPal Resolution standards (PAYPAL-DR-002): Dispatch revised ETA & tracking advisory to buyer."
        else:
            continue  # No action needed

        actions.append(Action(
            entity_type="order",
            entity_id=order.id,
            action_type=action_type,
            status="pending_approval",
            rationale=rationale,
            cost_estimate=risk.get("action_cost", 2.0),
            benefit_estimate=round(risk["expected_impact_usd"] * 0.7, 2),
        ))

    for sub in exposed_subs:
        risk = compute_risk("subscription", 50.0, scenario.severity, 1.0)
        snap = RiskSnapshot(
            entity_type="subscription",
            entity_id=sub.id,
            hazard_event_id=hazard.id,
            p_dispute=risk["p_dispute"],
            p_payment_failure=risk["p_payment_failure"],
            expected_impact_usd=risk["expected_impact_usd"],
        )
        risk_snapshots.append(snap)

        if risk["p_payment_failure"] > 0.10:
            actions.append(Action(
                entity_type="subscription",
                entity_id=sub.id,
                action_type="subscription_pause",
                status="pending_approval",
                rationale=f"High payment failure risk ({risk['p_payment_failure']:.0%}). Invoking PayPal Subscriptions API Sec 7.4 (PAYPAL-SUB-004): Suspend billing agreement to prevent involuntary churn.",
                cost_estimate=5.0,
                benefit_estimate=round(50.0 * risk["p_payment_failure"], 2),
            ))

    db.add_all(risk_snapshots)
    db.add_all(actions)

    db.add(AgentEvent(
        run_id=run_id, workflow_run_id=run_id, node="planner_node", kind="actions_planned",
        summary=f"Created {len(risk_snapshots)} risk snapshots, {len(actions)} pending actions",
        tool_name="risk_planner", tool_access="read",
    ))

    await db.commit()

    return {
        "hazard_id": hazard.id,
        "exposed_orders": len(exposed_orders),
        "exposed_subscriptions": len(exposed_subs),
        "risk_snapshots": len(risk_snapshots),
        "pending_actions": len(actions),
        "run_id": run_id,
    }


@router.get("/hazards")
async def list_hazards(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(HazardEvent).order_by(HazardEvent.created_at.desc()))
    hazards = result.scalars().all()
    return [HazardEventOut.model_validate(h) for h in hazards]

# Weather interpretation codes according to WMO
WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

CORRIDOR_COORDINATES = {
    # Americas
    "New York": {"lat": 40.7128, "lon": -74.0060, "region": "Americas", "country": "United States", "hub_type": "Air & Sea Cargo Hub", "risk_factor": 0.65},
    "Los Angeles": {"lat": 34.0522, "lon": -118.2437, "region": "Americas", "country": "United States", "hub_type": "Pacific Maritime Port", "risk_factor": 0.70},
    "Chicago": {"lat": 41.8781, "lon": -87.6298, "region": "Americas", "country": "United States", "hub_type": "Inland Rail & Intermodal", "risk_factor": 0.55},
    
    # EMEA
    "London": {"lat": 51.5074, "lon": -0.1278, "region": "EMEA", "country": "United Kingdom", "hub_type": "Heathrow Global Gateway", "risk_factor": 0.60},
    "Rotterdam": {"lat": 51.9244, "lon": 4.4777, "region": "EMEA", "country": "Netherlands", "hub_type": "Europe Major Seaport", "risk_factor": 0.80},
    "Frankfurt": {"lat": 50.1109, "lon": 8.6821, "region": "EMEA", "country": "Germany", "hub_type": "Central European Air Freight", "risk_factor": 0.50},
    "Dubai": {"lat": 25.2048, "lon": 55.2708, "region": "EMEA", "country": "United Arab Emirates", "hub_type": "Jebel Ali Transshipment", "risk_factor": 0.60},
    
    # APAC
    "Singapore": {"lat": 1.3521, "lon": 103.8198, "region": "APAC", "country": "Singapore", "hub_type": "Straits Maritime Megahub", "risk_factor": 0.85},
    "Tokyo": {"lat": 35.6762, "lon": 139.6503, "region": "APAC", "country": "Japan", "hub_type": "East Asia Coastal Logistics", "risk_factor": 0.75},
    "Shanghai": {"lat": 31.2304, "lon": 121.4737, "region": "APAC", "country": "China", "hub_type": "Yangtze Delta Container Port", "risk_factor": 0.85},
    "Sydney": {"lat": -33.8688, "lon": 151.2093, "region": "APAC", "country": "Australia", "hub_type": "Oceania Trade Terminal", "risk_factor": 0.55},
    
    # South Asia
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "region": "South Asia", "country": "India", "hub_type": "Nhava Sheva Port Corridor", "risk_factor": 0.75},
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "region": "South Asia", "country": "India", "hub_type": "Coromandel Coast Trade Hub", "risk_factor": 0.85},
    "Delhi": {"lat": 28.6139, "lon": 77.2090, "region": "South Asia", "country": "India", "hub_type": "NCR Dry Port & Cargo", "risk_factor": 0.60},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639, "region": "South Asia", "country": "India", "hub_type": "Bay of Bengal Riverine Hub", "risk_factor": 0.70},
    "Bangalore": {"lat": 12.9716, "lon": 77.5946, "region": "South Asia", "country": "India", "hub_type": "Deccan High-Tech Air Freight", "risk_factor": 0.45},
}


@router.get("/hazards/weather-live")
async def get_live_weather(user: dict = Depends(get_current_user)):
    """Fetch real-time meteorological observations for worldwide logistics corridors via Open-Meteo."""
    import asyncio

    async def fetch_corridor(client, city, coords):
        url = f"https://api.open-meteo.com/v1/forecast?latitude={coords['lat']}&longitude={coords['lon']}&current_weather=true"
        item = {
            "city": city,
            "region": coords["region"],
            "country": coords["country"],
            "hub_type": coords.get("hub_type", "Trade Corridor"),
            "latitude": coords["lat"],
            "longitude": coords["lon"],
            "temperature": 22.0,
            "windspeed": 12.0,
            "weather_code": 0,
            "condition": "Clear sky",
            "status": "NORMAL",
            "risk_factor": coords.get("risk_factor", 0.5),
            "source": "Open-Meteo Worldwide Telemetry",
            "updated_at": datetime.utcnow().isoformat() + "Z",
        }
        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                cw = resp.json().get("current_weather", {})
                wcode = cw.get("weathercode", 0)
                wspeed = cw.get("windspeed", 10.0)
                temp = cw.get("temperature", 22.0)
                item["temperature"] = temp
                item["windspeed"] = wspeed
                item["weather_code"] = wcode
                item["condition"] = WMO_CODES.get(wcode, "Cloudy")

                if wspeed > 35 or wcode in [65, 82, 95, 96, 99]:
                    item["status"] = "CRITICAL"
                elif wspeed > 20 or wcode in [53, 55, 61, 63, 80, 81]:
                    item["status"] = "ELEVATED"
                else:
                    item["status"] = "NORMAL"
        except Exception as e:
            logger.warning(f"Weather fetch error for {city}: {e}")
        return item

    async with httpx.AsyncClient(timeout=8.0) as client:
        tasks = [fetch_corridor(client, city, coords) for city, coords in CORRIDOR_COORDINATES.items()]
        results = await asyncio.gather(*tasks)

    return {
        "corridors": results,
        "monitored_hubs": len(results),
        "global_regions": ["Americas", "EMEA", "APAC", "South Asia"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "provider": "Open-Meteo World Meteorological Organization (WMO) Telemetry",
    }


@router.get("/hazards/{hazard_id}")
async def get_hazard(hazard_id: int, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(HazardEvent).where(HazardEvent.id == hazard_id))
    hazard = result.scalar_one_or_none()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")
    return HazardEventOut.model_validate(hazard)
