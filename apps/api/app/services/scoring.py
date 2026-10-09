"""Score a cash-flow profile with the trained logistic model and explain it.

Logistic regression is used on purpose: the log-odds is a sum of per-feature
terms, so each factor's contribution is exact (no approximation like SHAP
needed). impact_i = coef_i * standardised_value_i, i.e. how far this shop's
feature pushes the log-odds compared with an average shop in the training set.
"""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path

import numpy as np

from app.services.features import FEATURE_LABELS, FEATURES, display_value, feature_vector

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "model.json"

READY_AT = 75
BUILDING_AT = 55
TENURE_MONTHS = 12
INSTALMENT_SHARE = {"ready": 0.35, "building": 0.25, "not_yet": 0.0}
# Policy rule applied before the scorecard: the model was trained on 2-12 months of
# records, and monthly averages from a few days are extrapolation, not cash flow.
MIN_LOAN_MONTHS = 2.0


@lru_cache
def load_model() -> dict:
    model = json.loads(MODEL_PATH.read_text())
    assert model["features"] == FEATURES, "model.json is out of date - rerun python -m app.ml.train"
    return model


def score_profile(profile: dict) -> dict:
    m = load_model()
    x = feature_vector(profile)
    z = (x - np.array(m["mean"])) / np.array(m["std"])
    terms = np.array(m["coef"]) * z
    logit = m["intercept"] + float(terms.sum())
    p = 1 / (1 + math.exp(-logit))
    score = int(round(100 * p))
    band = "ready" if score >= READY_AT else "building" if score >= BUILDING_AT else "not_yet"

    factors = [
        {
            "feature": f,
            "label": FEATURE_LABELS[f],
            "value": float(x[i]),
            "display_value": display_value(f, profile),
            "impact": round(float(terms[i]), 3),
            "direction": "up" if terms[i] >= 0 else "down",
        }
        for i, f in enumerate(FEATURES)
    ]
    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)
    return {"score": score, "band": band, "repay_probability": round(p, 3), "factors": factors}


def _not_eligible(note: str) -> dict:
    return {"eligible": False, "monthly_instalment": 0, "tenure_months": TENURE_MONTHS, "principal": 0, "note": note}


def suggest_loan(profile: dict, band: str) -> dict:
    if profile["months_of_history"] < MIN_LOAN_MONTHS:
        return _not_eligible(
            f"Not recommended yet: at least {MIN_LOAN_MONTHS:g} months of records are needed to size an "
            f"instalment safely (this ledger covers {profile['months_of_history']:.1f})."
        )
    surplus = max(profile["avg_monthly_surplus"], 0.0)
    share = INSTALMENT_SHARE[band]
    instalment = math.floor(surplus * share / 500) * 500
    principal = instalment * TENURE_MONTHS
    if band == "not_yet" or instalment <= 0:
        return _not_eligible(
            "Not recommended yet: monthly surplus is too thin or too uncertain to carry an instalment safely."
        )
    return {
        "eligible": True,
        "monthly_instalment": instalment,
        "tenure_months": TENURE_MONTHS,
        "principal": principal,
        "note": (
            f"Instalment capped at {share:.0%} of the average monthly surplus. "
            "Principal shown before the lender's markup/profit; the lender sets final terms."
        ),
    }


def model_info() -> dict:
    m = load_model()
    return {k: m[k] for k in ("name", "version", "trained_at", "training_data", "metrics")}
