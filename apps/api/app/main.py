"""Khata-to-Credit API. Contract: docs/API.md."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.schemas import AnalyzeRequest, AnalyzeResponse, ExtractResponse, Ledger, SampleSummary
from app.services import llm
from app.services.explain import explain
from app.services.extraction import extract_from_csv, extract_from_images
from app.services.features import compute_profile, to_txns
from app.services.flags import check_ledger
from app.services.scoring import model_info, score_profile, suggest_loan

SAMPLES_DIR = Path(__file__).parent / "data" / "samples"
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}

app = FastAPI(title="Khata-to-Credit API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "llm_enabled": config.llm_enabled(), "llm_model": config.GEMINI_MODEL,
            "model": model_info()}


def _load_sample(sample_id: str) -> dict:
    path = SAMPLES_DIR / f"{sample_id}.json"
    if not sample_id.isalnum() or not path.exists():
        raise HTTPException(404, f"Unknown sample '{sample_id}'.")
    return json.loads(path.read_text())


@app.get("/api/samples", response_model=list[SampleSummary])
def list_samples():
    out = []
    for path in sorted(SAMPLES_DIR.glob("*.json")):
        s = json.loads(path.read_text())
        dates = [e["date"] for e in s["entries"]]
        months = (date.fromisoformat(max(dates)) - date.fromisoformat(min(dates))).days / 30.44
        out.append(SampleSummary(id=s["id"], business_name=s["business_name"], description=s["description"],
                                 months=round(months), entries=len(s["entries"])))
    return out


@app.get("/api/samples/{sample_id}", response_model=Ledger)
def get_sample(sample_id: str):
    s = _load_sample(sample_id)
    return Ledger(business_name=s["business_name"], entries=s["entries"], pages=s["pages"])


@app.post("/api/extract", response_model=ExtractResponse)
async def extract(files: list[UploadFile] = File(...), year: int | None = Form(None)):
    if not files:
        raise HTTPException(400, "Upload at least one photo or a CSV.")
    if len(files) > config.MAX_PAGES:
        raise HTTPException(400, f"At most {config.MAX_PAGES} pages per request.")

    blobs = []
    for f in files:
        data = await f.read()
        if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(413, f"{f.filename} is larger than {config.MAX_UPLOAD_MB:g} MB.")
        blobs.append((f, data))

    first, data = blobs[0]
    if len(blobs) == 1 and ((first.content_type or "") in {"text/csv", "application/vnd.ms-excel"}
                            or (first.filename or "").lower().endswith(".csv")):
        try:
            return extract_from_csv(data)
        except ValueError as exc:
            raise HTTPException(422, str(exc))

    images = []
    for f, data in blobs:
        if (f.content_type or "") not in IMAGE_TYPES:
            raise HTTPException(415, f"{f.filename}: send JPEG/PNG/WebP/HEIC photos, or a single CSV.")
        images.append((data, f.content_type))
    try:
        return extract_from_images(images, year or date.today().year)
    except llm.LLMUnavailable as exc:
        raise HTTPException(503, f"Photo reading is unavailable right now ({exc}). Use a sample or a CSV instead.")


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    if not req.entries:
        raise HTTPException(422, "The ledger has no entries.")
    profile = compute_profile(to_txns(req.entries))
    score = score_profile(profile)
    loan = suggest_loan(profile, score["band"])
    flags = check_ledger(req, profile["months_of_history"])
    explanations = explain(req.languages, req.business_name, score, profile, loan, flags) if req.explain else []
    return AnalyzeResponse(business_name=req.business_name, profile=profile, score=score, loan=loan,
                           flags=flags, explanations=explanations, model_info=model_info())
