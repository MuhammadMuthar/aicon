# ADR-0002: Stack and AI design for Khata-to-Credit

- Status: accepted (stack chosen by the human lead)
- Date: 2026-10-09
- Author: Claude

## Context
AICON'26 Build With AI, Financial Operations domain. One build day, two AI
agents plus two humans, judged heavily on *AI Integration Depth* by a finance
domain judge. Must be deployed with a public link by Saturday midnight.

## Decision
- **Frontend:** Next.js (App Router, TypeScript, Tailwind) in `apps/web`, deployed on Vercel. Owner: ChatGPT.
- **Backend:** FastAPI in `apps/api`, deployed on Render (`render.yaml`). Owner: Claude.
- **Contract:** `docs/API.md`; stateless JSON API, no database for the MVP.
- **AI design — three separate roles:**
  1. *Perception* — Gemini vision with a JSON schema turns khata photos into entries.
  2. *Decision* — a logistic-regression model on engineered cash-flow features.
     Chosen over gradient boosting because per-factor contributions are exact and
     auditable, which is what a credit officer (and a finance judge) asks for.
  3. *Communication* — Gemini writes English/Urdu explanations from the computed
     numbers only; a deterministic template is the fallback.
- **Data:** synthetic shop population (`app/ml/synthetic.py`) with documented
  assumptions; fictional demo samples. No real personal or financial data.
- **Gemini** because it has a free tier, strong handwriting/Urdu vision and the
  event is co-organised with GDGoC. Model name is an env var.

## Consequences
- The score reflects our encoded underwriting assumptions, not real repayment
  history; we say so in the demo and show the model is retrainable.
- The demo works without Gemini (samples, CSV, template explanations).
- Two deploy targets; CORS allows `*.vercel.app` by default.
