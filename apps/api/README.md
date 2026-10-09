# apps/api — Khata-to-Credit backend (FastAPI)

Owner: Claude. Endpoint contract: [`docs/API.md`](../../docs/API.md).

## Run locally

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export GEMINI_API_KEY=...        # optional; without it photos are disabled, samples/CSV still work
uvicorn app.main:app --reload --port 8000
# http://localhost:8000/docs  -> interactive API docs
python -m pytest -q             # tests (never call Gemini)
```

## How it works

```
photo(s) ─► services/extraction.py ─► ledger entries ─► services/features.py ─► profile
             (Gemini vision, JSON schema)                 (cash-flow features)       │
                                                                                     ▼
explanations ◄─ services/explain.py ◄─ score + loan ◄─ services/scoring.py (logistic model, ml/model.json)
(Gemini, grounded; template fallback)                   services/flags.py (integrity checks)
```

| Path | What |
|------|------|
| `app/main.py` | FastAPI routes |
| `app/schemas.py` | Request/response models (mirror of docs/API.md) |
| `app/services/extraction.py` | Gemini vision prompt + schema; CSV import |
| `app/services/features.py` | Ledger → profile + 8 model features (shared by training and inference) |
| `app/services/scoring.py` | Score, band, exact per-factor contributions, loan sizing |
| `app/services/flags.py` | Page-total mismatch, outliers, duplicates, low-confidence reads, short history |
| `app/services/explain.py` | English/Urdu explanation (Gemini or deterministic template) |
| `app/ml/synthetic.py` | Synthetic shop + khata generator, documented risk assumptions |
| `app/ml/train.py` | Trains the model → `app/ml/model.json` |
| `app/data/samples/` | 3 fictional demo ledgers (`python -m scripts.make_samples`) |

## Retrain / regenerate

```bash
python -m app.ml.train            # ~15 s, rewrites app/ml/model.json
python -m scripts.make_samples    # rewrites app/data/samples/*.json
```

Current model: logistic regression on 3,000 synthetic shops, test AUC 0.76.
Demo samples: Rahim General Store → 96 (ready), Nadia Home Tailoring → 65
(building), Bilal Mobile Accessories → 13 (not yet; also has a wrong page total
and a mis-written amount for the integrity-check demo).

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | — | Enables photo extraction and Gemini-written explanations |
| `GEMINI_MODEL` | `gemini-3.8-flash` | Any current Gemini vision model |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated web origins (`*.vercel.app` is always allowed) |
| `MAX_UPLOAD_MB` / `MAX_PAGES` | `8` / `6` | Upload limits |

## Deploy (Render)
`render.yaml` at the repo root defines the service. On Render: New → Blueprint →
pick this repo, then set `GEMINI_API_KEY` in the dashboard.
