import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
# Override if Google renames models; see https://ai.google.dev/gemini-api/docs/models
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()
# Comma-separated list of allowed web origins for CORS.
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "8"))
MAX_PAGES = int(os.getenv("MAX_PAGES", "6"))


def llm_enabled() -> bool:
    return bool(GEMINI_API_KEY)
