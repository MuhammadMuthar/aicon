"""Integrity checks on a ledger: wrong page totals, outliers, duplicates, shaky reads."""

from __future__ import annotations

from collections import defaultdict

import numpy as np

from app.schemas import Ledger

TOTAL_TOLERANCE = 0.01   # 1% (handwriting rounding)
OUTLIER_Z = 4.0          # robust z-score threshold
OUTLIER_MIN_RATIO = 5.0  # ...and at least 5x the median, so normal big days aren't flagged
LOW_CONFIDENCE = 0.6


def check_ledger(ledger: Ledger, months_of_history: float) -> list[dict]:
    flags: list[dict] = []
    entries = ledger.entries

    # 1. Page totals written by the shopkeeper vs. sum of the entries we read.
    page_sums = defaultdict(float)
    for e in entries:
        if e.page is not None:
            page_sums[e.page] += e.amount
    for p in ledger.pages:
        if p.stated_total is None or p.page not in page_sums:
            continue
        computed = page_sums[p.page]
        if abs(computed - p.stated_total) > max(TOTAL_TOLERANCE * p.stated_total, 1):
            flags.append({
                "kind": "page_total_mismatch",
                "severity": "warning",
                "page": p.page,
                "message": (
                    f"Page {p.page}: written total is PKR {p.stated_total:,.0f} but the entries add up to "
                    f"PKR {computed:,.0f} (difference PKR {computed - p.stated_total:+,.0f})."
                ),
            })

    # 2. Amounts far outside what is normal for that entry type (median/MAD z-score).
    by_type = defaultdict(list)
    for i, e in enumerate(entries):
        by_type[e.type.value].append(i)
    for etype, idx in by_type.items():
        # repayments are lumpy by nature (a customer clears weeks of credit at once)
        if len(idx) < 8 or etype == "udhaar_recovered":
            continue
        amounts = np.array([entries[i].amount for i in idx])
        med = np.median(amounts)
        mad = np.median(np.abs(amounts - med)) or 1.0
        for i, a in zip(idx, amounts):
            z = 0.6745 * (a - med) / mad
            if z > OUTLIER_Z and a >= OUTLIER_MIN_RATIO * med:
                e = entries[i]
                flags.append({
                    "kind": "outlier",
                    "severity": "warning",
                    "entry_index": i,
                    "page": e.page,
                    "message": (
                        f"{e.date.isoformat()} {etype.replace('_', ' ')} of PKR {a:,.0f} is about "
                        f"{a / med:.0f}x the usual amount (PKR {med:,.0f}). Check it was read correctly."
                    ),
                })

    # 3. Exact duplicates (same day, type, amount, description).
    seen = {}
    for i, e in enumerate(entries):
        key = (e.date, e.type, e.amount, e.description.strip().lower())
        if key in seen:
            flags.append({
                "kind": "duplicate",
                "severity": "info",
                "entry_index": i,
                "page": e.page,
                "message": f"Entry {i + 1} looks identical to entry {seen[key] + 1} ({e.date.isoformat()}, PKR {e.amount:,.0f}).",
            })
        else:
            seen[key] = i

    # 4. Entries the extractor was unsure about.
    for i, e in enumerate(entries):
        if e.confidence is not None and e.confidence < LOW_CONFIDENCE:
            flags.append({
                "kind": "low_confidence",
                "severity": "info",
                "entry_index": i,
                "page": e.page,
                "message": f"Entry {i + 1} ({e.description or e.type.value}, PKR {e.amount:,.0f}) was hard to read - please confirm.",
            })

    # 5. Too little history for a reliable score.
    if months_of_history < 2:
        flags.append({
            "kind": "short_history",
            "severity": "warning",
            "message": f"Only {months_of_history:.1f} months of records. Scores are more reliable with 3+ months.",
        })
    return flags
