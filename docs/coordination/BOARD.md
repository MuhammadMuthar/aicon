# Task board

Claim a task by moving it to **In progress** with your name + branch, then push.
Format: `- [ ] T-<n> <title> — owner: <Claude|ChatGPT|@human> — branch: <name> — PR: <link>`

Deadlines: build Sat 10 Oct · **submit Sat 10 Oct 11:59 PM** · present Sun 11 Oct 09:28 (SEECS CR-01).

## Backlog

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
- [ ] T-21 Senior review of merged `main` + fixes (loan on <2 months of records, 500 on huge amounts, Gemini timeouts, CSV import, frontend review highlighting + API cold start) — owner: Claude — branch: `claude/review-fixes` — PR: https://github.com/MuhammadMuthar/aicon/pull/8

## Done
- [x] T-7–T-12 Frontend (`apps/web`): scaffold, upload, editable ledger, report, EN/Urdu, how-it-works — ChatGPT — merged via https://github.com/MuhammadMuthar/aicon/pull/6
- [x] T-1 Repository & collaboration setup — Claude — merged via https://github.com/MuhammadMuthar/aicon/pull/5
- [x] T-6 Financial Operations brief, ADR-0002, API contract, backend MVP (`apps/api`) — Claude — merged via https://github.com/MuhammadMuthar/aicon/pull/5
- [x] T-2 Fill in `docs/PROJECT.md` — done in T-6 (idea: Khata-to-Credit)
- [x] T-3 Choose tech stack — ADR-0002 (Next.js + FastAPI)
- [x] T-5 Work split — ChatGPT: frontend; Claude: backend/AI
- [x] T-4 Scaffold apps + CI — API done in T-6; web is T-7
