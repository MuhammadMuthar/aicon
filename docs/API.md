# API contract — Khata-to-Credit

Source of truth for `apps/web` ↔ `apps/api`. Pydantic models live in
`apps/api/app/schemas.py`; interactive docs at `<API_URL>/docs`.
Changing a field? Update this file in the same PR and post in `MESSAGES.md`.

Base URL: `NEXT_PUBLIC_API_URL` (local `http://localhost:8000`). JSON everywhere
except `/api/extract` (multipart). Errors: `{"detail": "<human-readable message>"}`
— safe to show to the user as-is.

## Shared types

```ts
type EntryType = "sale" | "purchase" | "expense" | "udhaar_given" | "udhaar_recovered";

interface LedgerEntry {
  date: string;            // YYYY-MM-DD
  description: string;
  type: EntryType;
  amount: number;          // PKR, > 0
  page?: number | null;    // source page, 1-based
  confidence?: number | null; // 0-1, only from photo extraction
}
interface PageInfo { page: number; stated_total?: number | null }
interface Ledger { business_name?: string | null; entries: LedgerEntry[]; pages: PageInfo[] }
```

UI labels for `EntryType`: Sale · Stock purchase · Expense · Udhaar given · Udhaar recovered.

## Endpoints

### `GET /health`
`{ status: "ok", llm_enabled: boolean, llm_model: string, model: ModelInfo }`
Use `llm_enabled` to show/hide the photo upload (show a "samples only" hint when false).

### `GET /api/samples`
`[{ id, business_name, description, months, entries }]` — three fictional shops:
`rahim` (ready), `nadia` (building), `bilal` (not yet; has planted mistakes).

### `GET /api/samples/{id}` → `Ledger`

### `POST /api/extract` (multipart/form-data)
- `files`: 1–6 photos (JPEG/PNG/WebP/HEIC, ≤ 8 MB each) **or** a single `.csv`
  (`date,type,amount[,description,page]`).
- `year` (optional): year to assume when pages don't show it.
- → `Ledger & { source: "gemini" | "csv", warnings: string[] }`
- `503` if photo reading is unavailable (no key / quota) — tell the user to use a sample or CSV.

Photo extraction takes ~5–20 s; show progress. Let the user **edit the table**
(fix amount/type, delete rows) before analysing, and allow **adding pages to the
current ledger** (append `entries`, renumber `page` so it doesn't collide, append `pages`).

### `POST /api/analyze`
Request: `Ledger & { explain?: boolean = true, languages?: ("en"|"ur")[] = ["en","ur"] }`

Response:
```ts
interface AnalyzeResponse {
  business_name: string | null;
  profile: {
    months_of_history: number; avg_monthly_inflow: number; avg_monthly_outflow: number;
    avg_monthly_surplus: number; inflow_volatility: number; net_margin: number;
    active_day_ratio: number; udhaar_ratio: number; recovery_rate: number;
    inflow_trend: number; udhaar_outstanding: number;
    monthly: { month: string; inflow: number; outflow: number; udhaar_given: number; udhaar_recovered: number }[];
  };
  score: {
    score: number;                       // 0-100
    band: "ready" | "building" | "not_yet";
    repay_probability: number;
    factors: {                           // sorted by |impact|, all 8 features
      feature: string; label: string; value: number; display_value: string;
      impact: number;                    // log-odds vs average shop; + helps, - hurts
      direction: "up" | "down";
    }[];
  };
  loan: { eligible: boolean; monthly_instalment: number; tenure_months: number; principal: number; note: string };
  flags: {
    kind: "page_total_mismatch" | "outlier" | "duplicate" | "low_confidence" | "short_history";
    severity: "info" | "warning"; message: string; entry_index?: number | null; page?: number | null;
  }[];
  explanations: {
    language: "en" | "ur"; summary: string; strengths: string[]; concerns: string[];
    next_steps: string[]; source: "gemini" | "template";
  }[];
  model_info: { name: string; version: number; trained_at: string; training_data: string; metrics: Record<string, number> };
}
```

`entry_index` points into the request's `entries` array → highlight that row.
Urdu text must render right-to-left (`dir="rtl"`, an Urdu-capable font such as Noto Nastaliq Urdu).

Bands: `ready` ≥ 75 · `building` 55–74 · `not_yet` < 55.

## Example (`nadia`, trimmed)

```json
{
  "business_name": "Nadia Home Tailoring",
  "profile": { "months_of_history": 2.99, "avg_monthly_inflow": 98251, "avg_monthly_surplus": 7122,
               "net_margin": 0.072, "inflow_volatility": 0.413, "udhaar_ratio": 0.194, "recovery_rate": 0.658, "...": "..." },
  "score": { "score": 65, "band": "building", "repay_probability": 0.654,
             "factors": [ { "feature": "inflow_trend", "label": "Income trend (monthly growth)",
                            "display_value": "+28% per month", "impact": 0.692, "direction": "up" },
                          { "feature": "inflow_volatility", "label": "Week-to-week swings in income",
                            "display_value": "41% variation", "impact": -0.561, "direction": "down" } ] },
  "loan": { "eligible": true, "monthly_instalment": 1500, "tenure_months": 12, "principal": 18000, "note": "..." },
  "flags": [],
  "explanations": [ { "language": "en", "summary": "Nadia Home Tailoring scores 65/100 - Building credit. ...",
                      "strengths": ["..."], "concerns": ["..."], "next_steps": ["...", "...", "..."], "source": "template" } ]
}
```
