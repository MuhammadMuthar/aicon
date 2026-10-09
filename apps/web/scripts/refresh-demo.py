"""Refresh offline demo fixtures from the unchanged backend's samples and model."""
import json
import os
import sys
from pathlib import Path

# Fixtures are deliberately generated with deterministic, keyless explanations.
os.environ["GEMINI_API_KEY"] = ""
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "api"))

from app.main import analyze, get_sample, list_samples  # noqa: E402
from app.schemas import AnalyzeRequest  # noqa: E402

samples = []
for summary in list_samples():
    ledger = get_sample(summary.id)
    response = analyze(AnalyzeRequest(**ledger.model_dump(), languages=["en", "ur"]))
    samples.append({"summary": summary.model_dump(), "ledger": ledger.model_dump(mode="json"),
                    "analysis": response.model_dump(mode="json")})

target = Path(__file__).resolve().parents[1] / "lib" / "demo-data.json"
target.write_text(json.dumps(samples, ensure_ascii=False, separators=(",", ":")) + "\n")
print(f"Refreshed {len(samples)} fictional demo snapshots in {target.name}")
