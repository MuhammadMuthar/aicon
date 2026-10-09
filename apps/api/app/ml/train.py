"""Train the credit-readiness model on synthetic shops and save it as JSON.

Run from apps/api:   python -m app.ml.train  [--shops 3000] [--seed 7]

Output: app/ml/model.json (standardisation stats, coefficients, metrics).
JSON instead of pickle: tiny, readable in a PR, and judges can inspect the weights.
"""

from __future__ import annotations

import argparse
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

from app.ml.synthetic import generate_shop, true_repay_logit
from app.services.features import FEATURES, compute_profile, feature_vector

MODEL_PATH = Path(__file__).with_name("model.json")


def build_dataset(n_shops: int, seed: int):
    rng = np.random.default_rng(seed)
    X, y = [], []
    for _ in range(n_shops):
        txns, _traits = generate_shop(rng)
        profile = compute_profile(txns)
        X.append(feature_vector(profile))
        p = 1 / (1 + math.exp(-true_repay_logit(profile, rng)))
        y.append(int(rng.random() < p))
    return np.array(X), np.array(y)


def train(n_shops: int = 3000, seed: int = 7) -> dict:
    X, y = build_dataset(n_shops, seed)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=seed, stratify=y)

    mean, std = X_tr.mean(axis=0), X_tr.std(axis=0)
    std[std == 0] = 1.0
    clf = LogisticRegression(C=1.0, max_iter=1000)
    clf.fit((X_tr - mean) / std, y_tr)

    p_te = clf.predict_proba((X_te - mean) / std)[:, 1]
    model = {
        "name": "khata-credit-logreg",
        "version": 1,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "training_data": f"{n_shops} synthetic shops (seed {seed}); see app/ml/synthetic.py",
        "features": FEATURES,
        "mean": mean.round(6).tolist(),
        "std": std.round(6).tolist(),
        "coef": clf.coef_[0].round(6).tolist(),
        "intercept": round(float(clf.intercept_[0]), 6),
        "metrics": {
            "test_auc": round(float(roc_auc_score(y_te, p_te)), 3),
            "test_brier": round(float(brier_score_loss(y_te, p_te)), 3),
            "repay_rate": round(float(y.mean()), 3),
            "n_train": int(len(y_tr)),
            "n_test": int(len(y_te)),
        },
    }
    return model


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shops", type=int, default=3000)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    model = train(args.shops, args.seed)
    MODEL_PATH.write_text(json.dumps(model, indent=2) + "\n")
    print(json.dumps({k: model[k] for k in ("metrics", "coef", "intercept")}, indent=2))
    print(f"saved {MODEL_PATH}")


if __name__ == "__main__":
    main()
