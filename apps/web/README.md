# Khata web — frontend T-7 through T-12

Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and locally bundled
Manrope / Noto Nastaliq Urdu fonts. No Google Fonts network request is required.

## Develop

Use Node 24 (minimum 20.9) and the existing checkout; cloud tasks are isolated,
so another Git worktree is unnecessary.

```bash
cd apps/web
npm ci
cp .env.example .env.local # skip if it already exists
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the FastAPI **origin**, without `/api` or a trailing
path (default `http://localhost:8000`). Start the API as documented in
[`../api/README.md`](../api/README.md). The live service supports samples,
CSV import, scoring edited records and bilingual explanations without Gemini.
Photos and the camera button become available only when `/health` reports
`llm_enabled: true`. Never put a Gemini key in frontend environment variables.

The interface contains overview / upload, a paginated editable ledger, credit
report, and a transparent pipeline / model card. Additional photos or CSVs
append to the active ledger with source pages renumbered. Edits invalidate the
previous report. Integrity findings highlight the original API entry indices
and page numbers; the “Needs review” filter surfaces them immediately.

## Demo fallback

If the API is unavailable, the three fictional samples are loaded from
`lib/demo-data.json`, with matching precomputed reports and English/Urdu
explanations. A banner labels these cached reports. Edited records **cannot**
use a cached score; they require the live API. CSVs and photos also require
the API. This is a fallback for the sample demo, not offline underwriting.

Refresh fixtures after backend sample or scoring changes with the API's
dependencies installed:

```bash
python apps/web/scripts/refresh-demo.py # from the repository root
```

Only the unchanged sample ledger (including business name, entries and page
totals) can match a snapshot. Fixtures use the backend's deterministic template
explanations, never credentials or private business records.

## Checks

```bash
cd apps/web
bash scripts/check.sh # lint, strict TypeScript, production build
npx playwright install --with-deps chromium # once, for browser tests
# Start FastAPI on localhost:8000 in another terminal before this command.
npm test # starts the production web server automatically
```

On a cloud machine with system Chromium, use
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test` instead of a
browser download. Browser checks exercise the real sample scores, edits,
CSV import / append, integrity flags, Urdu, mobile layouts, cached provenance
and stale-score prevention. The photo extraction test uses a contract fixture;
real Gemini handwriting accuracy remains Claude's T-13. Root CI installs both
apps, runs the checks and starts the API for the browser suite.

## Vercel

Import the GitHub repository and set **Root Directory** to `apps/web` and
framework preset to **Next.js**. Set `NEXT_PUBLIC_API_URL` to the public Render
API origin before building (changing it requires a rebuild). The default
`npm run build` / Next.js deployment settings work without a custom config.
The API already permits `https://*.vercel.app`; configure `CORS_ORIGINS` on the
API for a custom web domain. Keep all backend secrets on Render.

This is a synthetic-data prototype: scores are illustrative and loan amounts
are affordability suggestions, not offers. The report and model card disclose
this in the interface.
