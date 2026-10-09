# Task board

Claim a task by moving it to **In progress** with your name + branch, then push.
Format: `- [ ] T-<n> <title> — owner: <Claude|ChatGPT|@human> — branch: <name> — PR: <link>`

Deadlines: build Sat 10 Oct · **submit Sat 10 Oct 11:59 PM** · present Sun 11 Oct 09:28 (SEECS CR-01).

## Backlog

### Frontend — ChatGPT (`apps/web`, contract in `docs/API.md`)
- [ ] T-7 Scaffold Next.js + TS + Tailwind in `apps/web`; `scripts/check.sh` (lint + build); Vercel-ready — owner: ChatGPT
- [ ] T-8 Upload screen: photo upload (multi-page, camera on mobile), CSV upload, "Try a sample" cards from `GET /api/samples` — owner: ChatGPT
- [ ] T-9 Editable ledger table (edit/delete rows, add more pages to the same ledger), flagged rows highlighted — owner: ChatGPT
- [ ] T-10 Results dashboard: score gauge + band, loan card, factor bar chart (up/down), monthly inflow/outflow chart, flags list — owner: ChatGPT
- [ ] T-11 Explanation panel with EN / اردو toggle (RTL, Noto Nastaliq Urdu) — owner: ChatGPT
- [ ] T-12 "How it works" section/page: pipeline diagram + model card (from `model_info`) + data disclaimer — owner: ChatGPT

### Backend / AI — Claude (`apps/api`)
- [ ] T-13 Test Gemini extraction on real handwritten khata photos and tune the prompt — owner: Claude (needs photos + key from @human)
- [ ] T-14 What-if endpoint: re-score with changed udhaar/recovery/margin (stretch) — owner: Claude
- [ ] T-15 One-page credit report PDF (stretch) — owner: Claude

### Human lead — Mutahar & Uswa
- [ ] T-16 Get a Gemini API key (aistudio.google.com) and set it on Render — owner: @human
- [ ] T-17 Write 2–3 khata pages by hand (fictional names/amounts; one page with a wrong total) and photograph them — owner: @human
- [ ] T-18 Deploy: API on Render (Blueprint from `render.yaml`), web on Vercel with `NEXT_PUBLIC_API_URL` — owner: @human
- [ ] T-19 Demo PPTX (Problem → Data → AI → Solution → Impact) with sourced stats — owner: @human (agents can draft)
- [ ] T-20 Rehearse the 5-minute demo on the team laptop, offline fallback via samples — owner: @human

## In progress
_(nothing)_

## Review
- [ ] T-1 Repository & collaboration setup — owner: Claude — branch: `claude/inspiring-dijkstra-igx5gj`
- [ ] T-6 Financial Operations brief, ADR-0002, API contract, backend MVP (`apps/api`) — owner: Claude — branch: `claude/finops-khata-credit`

## Done
- [x] T-2 Fill in `docs/PROJECT.md` — done in T-6 (idea: Khata-to-Credit)
- [x] T-3 Choose tech stack — ADR-0002 (Next.js + FastAPI)
- [x] T-5 Work split — ChatGPT: frontend; Claude: backend/AI
- [x] T-4 Scaffold apps + CI — API done in T-6; web is T-7
