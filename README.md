# Khata-to-Credit — AICON'26 Build With AI

**Domain: Financial Operations** · Team: Uswa & Mutahar

Turn a shopkeeper's handwritten *khata* (credit ledger) into an explainable
credit-readiness score a microfinance officer can trust — from a phone photo.

**Photo → Gemini vision extraction → cash-flow features → transparent ML score
→ loan size + integrity flags → English/Urdu explanation.**
Full brief: [`docs/PROJECT.md`](docs/PROJECT.md) · API: [`docs/API.md`](docs/API.md)
· Design: [`ADR-0002`](docs/decisions/0002-stack-and-ai-design.md)

| Part | Where | Status |
|------|-------|--------|
| Backend / AI (FastAPI) | [`apps/api`](apps/api) | working, tested |
| Frontend (Next.js) | `apps/web` | to build (T-7…T-12) |
| Deploy | Render (API) + Vercel (web) | to do |

Data: synthetic and fictional only — no real personal or financial data.

This repo is built collaboratively by a human team lead and two AI agents:
**Claude** (Claude Code) and **ChatGPT** (ChatGPT / Codex). Everything happens in
the cloud, through this repository — no local-only state.

## Start here

| If you are…  | Read first |
|--------------|-----------|
| An AI agent  | [`AGENTS.md`](AGENTS.md) — the shared rules for every agent |
| Claude       | [`CLAUDE.md`](CLAUDE.md) → then `AGENTS.md` |
| ChatGPT      | [`AGENTS.md`](AGENTS.md) and [`docs/coordination/WELCOME_CHATGPT.md`](docs/coordination/WELCOME_CHATGPT.md) |
| A human      | This README, then [`docs/COLLABORATION.md`](docs/COLLABORATION.md) |

## Repository layout

```
.
├── AGENTS.md                 # Shared rules for all AI agents (source of truth)
├── CLAUDE.md                 # Claude-specific pointer to AGENTS.md
├── apps/api/                 # FastAPI backend + ML model (Claude)
├── apps/web/                 # Next.js frontend (ChatGPT) — to build
├── packages/                 # Shared code (unused so far)
├── render.yaml               # Render deploy blueprint for the API
├── scripts/                  # Dev/CI helper scripts
├── docs/
│   ├── PROJECT.md            # What we're building (idea, scope, stack, demo)
│   ├── API.md                # Frontend ↔ backend contract
│   ├── COLLABORATION.md      # How Claude + ChatGPT + humans work together
│   ├── decisions/            # Architecture Decision Records (ADRs)
│   └── coordination/
│       ├── BOARD.md          # Task board: who is doing what
│       ├── MESSAGES.md       # Async message log between agents
│       └── WELCOME_CHATGPT.md# Intro message from Claude to ChatGPT
└── .github/                  # Issue/PR templates and CI
```

## Workflow in one paragraph

Pick (or get assigned) a task on [`BOARD.md`](docs/coordination/BOARD.md), claim it,
work on your own branch (`claude/...` or `chatgpt/...`), open a PR into `main`,
and leave a note in [`MESSAGES.md`](docs/coordination/MESSAGES.md) or the PR when
the other agent needs to know something. The human lead merges.
