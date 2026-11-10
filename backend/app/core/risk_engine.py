"""Monte Carlo risk engine (modeled, labeled as such)."""

import numpy as np


def compute_risk(
    entity_type: str,
    amount: float,
    severity: int,
    distance_factor: float = 1.0,
    n_simulations: int = 1000,
) -> dict:
    """Compute risk metrics using Monte Carlo simulation.

    NOTE: These are MODELED probabilities from Monte Carlo simulation,
    not trained ML predictions. They are labeled as 'modeled' in the UI.

    Args:
        entity_type: 'order' or 'subscription'
        amount: dollar amount at risk
        severity: hazard severity (1-5)
        distance_factor: proximity factor (0-1, 1 = directly in hazard zone)
        n_simulations: number of Monte Carlo iterations

    Returns:
        dict with p_dispute, p_payment_failure, expected_impact_usd
    """
    rng = np.random.default_rng()

    # Base probabilities scale with severity
    base_dispute_rate = 0.05 * severity * distance_factor
    base_payment_fail_rate = 0.03 * severity * distance_factor

    if entity_type == "subscription":
        base_dispute_rate *= 0.5  # subscriptions less likely to dispute
        base_payment_fail_rate *= 1.5  # but more likely to fail payments

    # Monte Carlo: simulate outcomes
    dispute_draws = rng.random(n_simulations) < base_dispute_rate
    payment_draws = rng.random(n_simulations) < base_payment_fail_rate

    p_dispute = float(dispute_draws.mean())
    p_payment_failure = float(payment_draws.mean())

    # Expected impact
    expected_impact = amount * (p_dispute * 1.0 + p_payment_failure * 0.3)

    # Action cost estimate
    action_cost = 2.0 if entity_type == "order" else 5.0  # cost of taking action

    return {
        "p_dispute": round(p_dispute, 4),
        "p_payment_failure": round(p_payment_failure, 4),
        "expected_impact_usd": round(expected_impact, 2),
        "action_cost": action_cost,
    }
