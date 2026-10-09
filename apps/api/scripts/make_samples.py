"""Generate the demo sample ledgers in app/data/samples/ (fictional shops, synthetic numbers).

Run from apps/api:  python -m scripts.make_samples

Each sample is laid out like a real khata: ~20 lines per page with the
shopkeeper's page total at the bottom. Sample "bilal" has one page total
written wrong and one mis-written amount so the integrity checks have
something to catch in the demo.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import numpy as np

from app.ml.synthetic import CUSTOMERS, generate_shop

OUT = Path(__file__).resolve().parent.parent / "app" / "data" / "samples"
LINES_PER_PAGE = 20
SUPPLIERS = ["Hafeez Traders", "Madina Wholesale", "Al-Karim Store", "Rehman Brothers"]
EXPENSES = ["Kiraya (rent)", "Bijli bill", "Helper tankhwah", "Rickshaw kiraya"]

SAMPLES = {
    "rahim": dict(
        business_name="Rahim General Store",
        description="Busy kiryana store, steady sales, little udhaar - a strong applicant.",
        seed=11,
        traits=dict(daily_sales=14000, volatility=0.15, margin=0.2, open_prob=0.95,
                    udhaar_share=0.08, recovery=0.92, growth=0.03, months=5, fixed_costs=40000),
    ),
    "nadia": dict(
        business_name="Nadia Home Tailoring",
        description="Home-based tailoring business run by a woman, uneven weeks, short record.",
        seed=12,
        traits=dict(daily_sales=4500, volatility=0.6, margin=0.15, open_prob=0.7,
                    udhaar_share=0.2, recovery=0.6, growth=0.02, months=3, fixed_costs=6000),
    ),
    "bilal": dict(
        business_name="Bilal Mobile Accessories",
        description="Good sales but lots of udhaar that customers are slow to repay.",
        seed=13,
        traits=dict(daily_sales=11000, volatility=0.4, margin=0.08, open_prob=0.85,
                    udhaar_share=0.5, recovery=0.35, growth=-0.03, months=4, fixed_costs=40000),
    ),
}


def describe(t, rng) -> str:
    if t.type == "sale":
        return "Roz ki bikri (daily sale)"
    if t.type == "purchase":
        return f"Maal - {SUPPLIERS[int(rng.integers(len(SUPPLIERS)))]}"
    if t.type == "expense":
        return EXPENSES[0] if t.date.day == 1 else EXPENSES[int(rng.integers(1, len(EXPENSES)))]
    who = CUSTOMERS[int(rng.integers(len(CUSTOMERS)))]
    return f"Udhaar - {who}" if t.type == "udhaar_given" else f"Wasooli - {who}"


def build(key: str, spec: dict) -> dict:
    rng = np.random.default_rng(spec["seed"])
    txns, _ = generate_shop(rng, start=date(2026, 5, 1), overrides=spec["traits"])
    entries = []
    for i, t in enumerate(txns):
        entries.append({
            "date": t.date.isoformat(),
            "description": describe(t, rng),
            "type": t.type,
            "amount": t.amount,
            "page": i // LINES_PER_PAGE + 1,
        })

    if key == "bilal":  # deliberate mistakes for the integrity checks
        sales = [e for e in entries if e["type"] == "sale"]
        sales[30]["amount"] = round(sales[30]["amount"] * 10, -1)  # an extra zero written

    pages = []
    for p in range(1, entries[-1]["page"] + 1):
        total = sum(e["amount"] for e in entries if e["page"] == p)
        if key == "bilal" and p == 3:
            total -= 2000  # shopkeeper's addition is off
        pages.append({"page": p, "stated_total": round(total, 2)})

    return {"id": key, "business_name": spec["business_name"], "description": spec["description"],
            "entries": entries, "pages": pages}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for key, spec in SAMPLES.items():
        data = build(key, spec)
        (OUT / f"{key}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
        print(f"{key}: {len(data['entries'])} entries, {len(data['pages'])} pages")


if __name__ == "__main__":
    main()
