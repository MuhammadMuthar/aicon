"""Turn a list of ledger entries into a cash-flow profile and model features.

The same function is used to build the synthetic training set and to score a
real ledger, so training and inference always see identical feature definitions.
"""

from __future__ import annotations

import math
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable

import numpy as np

INFLOW_TYPES = {"sale", "udhaar_recovered"}
OUTFLOW_TYPES = {"purchase", "expense"}
DAYS_PER_MONTH = 30.44

# Order matters: it is the column order of the model.
FEATURES = [
    "log_monthly_inflow",
    "inflow_volatility",
    "net_margin",
    "active_day_ratio",
    "udhaar_ratio",
    "recovery_rate",
    "inflow_trend",
    "months_of_history",
]

FEATURE_LABELS = {
    "log_monthly_inflow": "Monthly cash coming in",
    "inflow_volatility": "Week-to-week swings in income",
    "net_margin": "Profit margin",
    "active_day_ratio": "Days the shop was open",
    "udhaar_ratio": "Share of sales given on credit (udhaar)",
    "recovery_rate": "Udhaar recovered from customers",
    "inflow_trend": "Income trend (monthly growth)",
    "months_of_history": "Months of records",
}


@dataclass(frozen=True)
class Txn:
    date: date
    type: str
    amount: float


def to_txns(entries: Iterable) -> list[Txn]:
    out = []
    for e in entries:
        t = e.type.value if hasattr(e.type, "value") else str(e.type)
        out.append(Txn(e.date, t, float(e.amount)))
    return out


def _weekly_inflow(txns: list[Txn], start: date, end: date) -> np.ndarray:
    """Inflow per 7-day block, dropping a trailing partial block."""
    n_days = (end - start).days + 1
    n_weeks = n_days // 7
    if n_weeks == 0:
        return np.array([])
    weeks = np.zeros(n_weeks)
    for t in txns:
        if t.type in INFLOW_TYPES:
            w = (t.date - start).days // 7
            if w < n_weeks:
                weeks[w] += t.amount
    return weeks


def compute_profile(txns: list[Txn]) -> dict:
    if not txns:
        raise ValueError("The ledger has no entries.")

    start = min(t.date for t in txns)
    end = max(t.date for t in txns)
    n_days = (end - start).days + 1
    months = max(n_days / DAYS_PER_MONTH, 1 / DAYS_PER_MONTH)

    totals = defaultdict(float)
    sale_days = set()
    monthly = defaultdict(lambda: defaultdict(float))
    for t in txns:
        totals[t.type] += t.amount
        if t.type == "sale":
            sale_days.add(t.date)
        key = t.date.strftime("%Y-%m")
        if t.type in INFLOW_TYPES:
            monthly[key]["inflow"] += t.amount
        if t.type in OUTFLOW_TYPES:
            monthly[key]["outflow"] += t.amount
        if t.type.startswith("udhaar"):
            monthly[key][t.type] += t.amount

    inflow = totals["sale"] + totals["udhaar_recovered"]
    outflow = totals["purchase"] + totals["expense"]
    given, recovered = totals["udhaar_given"], totals["udhaar_recovered"]

    weekly = _weekly_inflow(txns, start, end)
    if len(weekly) >= 3 and weekly.mean() > 0:
        volatility = float(weekly.std(ddof=0) / weekly.mean())
        x = np.arange(len(weekly))
        slope = np.polyfit(x, weekly, 1)[0]
        trend = float(np.clip(slope / weekly.mean() * (DAYS_PER_MONTH / 7), -0.5, 0.5))
    else:  # not enough history to judge: assume average-ish
        volatility, trend = 0.35, 0.0

    avg_in = inflow / months
    avg_out = outflow / months
    return {
        "months_of_history": round(months, 2),
        "avg_monthly_inflow": round(avg_in, 0),
        "avg_monthly_outflow": round(avg_out, 0),
        "avg_monthly_surplus": round(avg_in - avg_out, 0),
        "inflow_volatility": round(volatility, 3),
        "net_margin": round((inflow - outflow) / inflow, 3) if inflow > 0 else -1.0,
        "active_day_ratio": round(len(sale_days) / n_days, 3),
        "udhaar_ratio": round(given / (totals["sale"] + given), 3) if (totals["sale"] + given) > 0 else 0.0,
        "recovery_rate": round(min(recovered / given, 1.0), 3) if given > 0 else 1.0,
        "inflow_trend": round(trend, 3),
        "udhaar_outstanding": round(max(given - recovered, 0.0), 0),
        "monthly": [
            {
                "month": m,
                "inflow": round(v["inflow"], 0),
                "outflow": round(v["outflow"], 0),
                "udhaar_given": round(v["udhaar_given"], 0),
                "udhaar_recovered": round(v["udhaar_recovered"], 0),
            }
            for m, v in sorted(monthly.items())
        ],
    }


def feature_vector(profile: dict) -> np.ndarray:
    return np.array(
        [
            math.log10(max(profile["avg_monthly_inflow"], 1000.0)),
            min(profile["inflow_volatility"], 2.0),
            max(min(profile["net_margin"], 0.6), -0.5),
            profile["active_day_ratio"],
            profile["udhaar_ratio"],
            profile["recovery_rate"],
            profile["inflow_trend"],
            min(profile["months_of_history"], 12.0),
        ],
        dtype=float,
    )


def display_value(feature: str, profile: dict) -> str:
    p = profile
    return {
        "log_monthly_inflow": f"PKR {p['avg_monthly_inflow']:,.0f}/month",
        "inflow_volatility": f"{p['inflow_volatility']:.0%} variation",
        "net_margin": f"{p['net_margin']:.0%}",
        "active_day_ratio": f"{p['active_day_ratio']:.0%} of days",
        "udhaar_ratio": f"{p['udhaar_ratio']:.0%} of sales",
        "recovery_rate": f"{p['recovery_rate']:.0%} recovered",
        "inflow_trend": f"{p['inflow_trend']:+.0%} per month",
        "months_of_history": f"{p['months_of_history']:.1f} months",
    }[feature]


def daterange(start: date, days: int):
    for i in range(days):
        yield start + timedelta(days=i)
