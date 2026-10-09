# AICON

Main repository for the AICON hackathon project.

This repo is built collaboratively by a human team lead and two AI agents:
**Claude** (Claude Code) and **ChatGPT** (ChatGPT / Codex). Everything happens in
the cloud, through this repository — no local-only state.

> Project idea, scope and tech stack: **TBD** — see [`docs/PROJECT.md`](docs/PROJECT.md).

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
├── apps/                     # Deployable apps (frontend, backend, ...) — TBD
├── packages/                 # Shared libraries/code — TBD
├── scripts/                  # Dev/CI helper scripts
├── docs/
│   ├── PROJECT.md            # What we're building (idea, scope, stack)
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
