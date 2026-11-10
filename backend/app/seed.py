"""Synthetic data seeder for Day-0 Shield worldwide commercial corridors demo."""

import random
import logging
from datetime import datetime, timedelta

from sqlalchemy import select, delete

from app.database import AsyncSessionLocal
from app.models import Merchant, Order, Subscription, RiskSnapshot, Action, AgentEvent, AuditLog

logger = logging.getLogger("day0shield.seed")

MERCHANTS = [
    {"name": "New York Logistics Co.", "business_type": "apparel", "ship_from_region": "New York"},
    {"name": "London Luxury Goods Ltd.", "business_type": "luxury", "ship_from_region": "London"},
    {"name": "Singapore Precision Tech", "business_type": "electronics", "ship_from_region": "Singapore"},
    {"name": "Rotterdam Freight Hub", "business_type": "machinery", "ship_from_region": "Rotterdam"},
    {"name": "Tokyo Robotics & Audio", "business_type": "electronics", "ship_from_region": "Tokyo"},
    {"name": "Dubai Global Trade Emporium", "business_type": "wholesale", "ship_from_region": "Dubai"},
    {"name": "Chennai Electronics Hub", "business_type": "electronics", "ship_from_region": "Chennai"},
    {"name": "Mumbai Textile Traders", "business_type": "textiles", "ship_from_region": "Mumbai"},
]

REGIONS = [
    "New York", "Los Angeles", "Chicago",
    "London", "Rotterdam", "Frankfurt", "Dubai",
    "Singapore", "Tokyo", "Shanghai", "Sydney",
    "Chennai", "Mumbai", "Delhi"
]

CARRIERS = ["FedEx", "DHL Express", "UPS", "Maersk", "BlueDart", "SingPost", "Royal Mail"]
STATUSES = ["CREATED", "APPROVED", "CAPTURED", "SHIPPED", "DELIVERED"]
SUB_PLANS = ["PLAN-GLOBAL-BASIC", "PLAN-GLOBAL-PRO", "PLAN-GLOBAL-ENTERPRISE"]
CURRENCIES = ["USD", "EUR", "GBP", "SGD", "INR"]


async def run_seed(force: bool = False):
    """Seed the database with worldwide commercial merchants, orders, and subscriptions."""
    async with AsyncSessionLocal() as db:
        if force:
            logger.info("Force reseed enabled: resetting merchant entities...")
            await db.execute(delete(Action))
            await db.execute(delete(RiskSnapshot))
            await db.execute(delete(Order))
            await db.execute(delete(Subscription))
            await db.execute(delete(Merchant))
            await db.commit()
        else:
            existing = await db.execute(select(Merchant).limit(1))
            if existing.scalar_one_or_none():
                logger.info("Database already seeded, skipping")
                return

        rng = random.Random(42)
        now = datetime.utcnow()

        for m_data in MERCHANTS:
            merchant = Merchant(
                name=m_data["name"],
                business_type=m_data["business_type"],
                ship_from_region=m_data["ship_from_region"],
                sandbox_payer_id=f"SB-{rng.randint(100000, 999999)}",
            )
            db.add(merchant)
            await db.flush()

            # Create 20 orders per merchant across worldwide destinations
            for i in range(20):
                days_ago = rng.randint(0, 30)
                status = rng.choice(STATUSES)
                amount = round(rng.uniform(25, 1200), 2)
                buyer_region = rng.choice(REGIONS)
                currency = "USD" if "New York" in merchant.ship_from_region else ("GBP" if "London" in merchant.ship_from_region else ("EUR" if "Rotterdam" in merchant.ship_from_region else ("SGD" if "Singapore" in merchant.ship_from_region else "USD")))

                order = Order(
                    paypal_order_id=f"ORD-GLB-{merchant.id}-{i:03d}-{rng.randint(10000,99999)}",
                    merchant_id=merchant.id,
                    buyer_region=buyer_region,
                    amount=amount,
                    currency=currency,
                    status=status,
                    tracking_number=f"TRK{rng.randint(100000000, 999999999)}" if status in ("SHIPPED", "DELIVERED") else None,
                    carrier=rng.choice(CARRIERS) if status in ("SHIPPED", "DELIVERED") else None,
                    is_live_sandbox=False,
                    created_at=now - timedelta(days=days_ago, hours=rng.randint(0, 23)),
                )
                db.add(order)

            # Create 3 subscriptions per merchant
            for j in range(3):
                sub = Subscription(
                    paypal_subscription_id=f"SUB-GLB-{merchant.id}-{j:02d}-{rng.randint(10000,99999)}",
                    merchant_id=merchant.id,
                    plan_id=rng.choice(SUB_PLANS),
                    status="ACTIVE",
                    next_billing_date=now + timedelta(days=rng.randint(1, 30)),
                    is_live_sandbox=False,
                    created_at=now - timedelta(days=rng.randint(30, 180)),
                )
                db.add(sub)

        await db.commit()
        logger.info(f"Seeded {len(MERCHANTS)} worldwide merchants with cross-border orders and subscriptions")


# CLI support: python -m app.seed
if __name__ == "__main__":
    import sys
    import asyncio
    force_flag = "--force" in sys.argv
    asyncio.run(run_seed(force=force_flag))
