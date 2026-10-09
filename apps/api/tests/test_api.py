import io

import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def no_llm(monkeypatch):
    """Tests never call Gemini; the template path must work on its own."""
    monkeypatch.setattr(config, "GEMINI_API_KEY", "")
    from app.services import llm
    llm._client.cache_clear()


def analyze_sample(sample_id: str) -> dict:
    ledger = client.get(f"/api/samples/{sample_id}").json()
    r = client.post("/api/analyze", json={**ledger, "languages": ["en", "ur"]})
    assert r.status_code == 200, r.text
    return r.json()


def test_health():
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["model"]["metrics"]["test_auc"] > 0.65


def test_samples_listed():
    ids = {s["id"] for s in client.get("/api/samples").json()}
    assert {"rahim", "nadia", "bilal"} <= ids


def test_unknown_sample_404():
    assert client.get("/api/samples/../../etc").status_code == 404
    assert client.get("/api/samples/nope").status_code == 404


def test_bands_differ_across_samples():
    bands = {k: analyze_sample(k)["score"]["band"] for k in ("rahim", "nadia", "bilal")}
    assert bands == {"rahim": "ready", "nadia": "building", "bilal": "not_yet"}


def test_factor_impacts_explain_the_score():
    import math
    out = analyze_sample("nadia")
    s = out["score"]
    logit = math.log(s["repay_probability"] / (1 - s["repay_probability"]))
    from app.services.scoring import load_model
    total = load_model()["intercept"] + sum(f["impact"] for f in s["factors"])
    assert abs(logit - total) < 0.02  # contributions add up exactly (up to rounding)


def test_loan_only_when_eligible():
    assert analyze_sample("rahim")["loan"]["eligible"] is True
    bilal = analyze_sample("bilal")["loan"]
    assert bilal["eligible"] is False and bilal["principal"] == 0


def test_bilal_flags_catch_planted_mistakes():
    kinds = [f["kind"] for f in analyze_sample("bilal")["flags"]]
    assert "page_total_mismatch" in kinds
    assert "outlier" in kinds


def test_template_explanations_both_languages():
    exps = analyze_sample("rahim")["explanations"]
    assert [e["language"] for e in exps] == ["en", "ur"]
    assert all(e["source"] == "template" and len(e["next_steps"]) == 3 for e in exps)
    assert any("؀" <= ch <= "ۿ" for ch in exps[1]["summary"])  # Urdu script


def test_csv_extract_and_analyze():
    csv = "date,type,amount,description\n" + "\n".join(
        f"2026-0{m}-{d:02d},sale,{5000 + d * 10},bikri" for m in (6, 7, 8) for d in range(1, 29)
    ) + "\n2026-06-02,purchase,60000,maal\nbad,row,here,x\n"
    r = client.post("/api/extract", files={"files": ("k.csv", io.BytesIO(csv.encode()), "text/csv")})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["source"] == "csv" and len(body["entries"]) == 85 and body["warnings"]
    r = client.post("/api/analyze", json={"entries": body["entries"], "explain": False})
    assert r.status_code == 200 and r.json()["explanations"] == []


def test_photo_without_key_returns_503():
    r = client.post("/api/extract", files={"files": ("p.jpg", io.BytesIO(b"\xff\xd8fake"), "image/jpeg")})
    assert r.status_code == 503


def test_short_history_flag():
    entries = [{"date": f"2026-06-{d:02d}", "type": "sale", "amount": 3000} for d in range(1, 15)]
    flags = client.post("/api/analyze", json={"entries": entries, "explain": False}).json()["flags"]
    assert any(f["kind"] == "short_history" for f in flags)
