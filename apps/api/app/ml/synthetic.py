"""Synthetic khata generator used to train the credit-readiness model.

No real borrower data exists for this hackathon (and the rulebook forbids
private financial data), so we simulate a population of small shops. Each shop
gets hidden business traits; we write its daily khata from those traits, then
draw whether it repaid a 12-month loan from a risk rule that encodes standard
microfinance underwriting intuition:

  * more and steadier cash inflow  -> lower risk
  * thin or negative margin        -> higher risk
  * lots of udhaar, poorly recovered -> higher risk (cash is stuck with customers)
  * shop open most days, growing, long record -> lower risk

The model never sees the hidden traits or the rule. It only sees the features
computed from the generated ledger (exactly as for a real photo), so it has to
learn the relationship from noisy bookkeeping data. A lender would replace
this simulator with its own historical repayment outcomes and retrain.

Amounts are PKR and loosely scaled to small Pakistani retail (kiryana stores,
vendors, home businesses). They are illustrative, not survey statistics.
"""

from __future__ import annotations

import math
from datetime import date, timedelta

import numpy as np

from app.services.features import Txn

CUSTOMERS = [
    "Aslam", "Bushra", "Farhan", "Ghazala", "Hamid", "Iqra", "Javed", "Kiran",
    "Latif", "Maryam", "Naveed", "Owais", "Parveen", "Qasim", "Rubina", "Sajid",
]


def generate_shop(rng: np.random.Generator, start: date = date(2026, 1, 1), overrides: dict | None = None):
    traits = {
        "daily_sales": float(rng.lognormal(mean=math.log(9000), sigma=0.7)),
        "volatility": float(rng.uniform(0.1, 0.8)),
        "margin": float(rng.normal(0.14, 0.08)),
        "open_prob": float(rng.beta(8, 1.5)),
        "udhaar_share": float(rng.beta(2, 6)),
        "recovery": float(rng.beta(6, 2)),
        "growth": float(rng.normal(0.0, 0.05)),  # per month
        "months": int(rng.integers(2, 13)),
        "fixed_costs": 0.0,
    }
    traits["fixed_costs"] = traits["daily_sales"] * 30 * float(rng.uniform(0.04, 0.12))
    traits.update(overrides or {})

    days = int(traits["months"] * 30.44)
    txns: list[Txn] = []
    week_purchase = 0.0
    outstanding: dict[str, float] = {}

    for i in range(days):
        d = start + timedelta(days=i)
        level = traits["daily_sales"] * (1 + traits["growth"]) ** (i / 30.44)
        if rng.random() < traits["open_prob"]:
            gross = level * float(rng.lognormal(0, traits["volatility"] * 0.6))
            credit = gross * traits["udhaar_share"] * float(rng.uniform(0.5, 1.5))
            credit = min(credit, gross * 0.9)
            txns.append(Txn(d, "sale", round(gross - credit, -1)))
            if credit >= 50:
                who = CUSTOMERS[int(rng.integers(len(CUSTOMERS)))]
                txns.append(Txn(d, "udhaar_given", round(credit, -1)))
                outstanding[who] = outstanding.get(who, 0.0) + credit
            week_purchase += gross * (1 - traits["margin"]) * float(rng.uniform(0.85, 1.15))

            # customers repay some of what they owe
            for who in list(outstanding):
                if rng.random() < 0.06:
                    pay = outstanding[who] * traits["recovery"] * float(rng.uniform(0.6, 1.0))
                    if pay >= 50:
                        txns.append(Txn(d, "udhaar_recovered", round(pay, -1)))
                        outstanding[who] -= pay

        if d.weekday() == 0 and week_purchase > 0:  # restock on Mondays
            txns.append(Txn(d, "purchase", round(week_purchase, -1)))
            week_purchase = 0.0
        if d.day == 1:  # rent, electricity, helper wages
            txns.append(Txn(d, "expense", round(traits["fixed_costs"] * float(rng.uniform(0.9, 1.1)), -1)))

    return txns, traits


def true_repay_logit(profile: dict, rng: np.random.Generator) -> float:
    """Ground-truth risk rule (hidden from the model). Unobserved luck adds noise."""
    p = profile
    z = (
        1.3
        + 1.1 * math.log10(max(p["avg_monthly_inflow"], 1000) / 250_000)
        - 1.8 * (min(p["inflow_volatility"], 2.0) - 0.35)
        + 5.0 * (max(min(p["net_margin"], 0.6), -0.5) - 0.08)
        + 2.5 * (p["active_day_ratio"] - 0.8)
        - 3.0 * (p["udhaar_ratio"] - 0.2)
        + 2.5 * (p["recovery_rate"] - 0.7)
        + 3.0 * p["inflow_trend"]
        + 0.12 * (min(p["months_of_history"], 12) - 6)
    )
    return z + float(rng.normal(0, 0.6))
