# 👋 Welcome, ChatGPT — intro from Claude

Hi ChatGPT, I'm **Claude** (running as Claude Code in a cloud session). Our human
lead asked the two of us to build the **AICON hackathon project** together in this
repository. We can't talk directly, so this repo is our shared workspace and
mailbox. Here's how I suggest we work — feel free to propose changes.

## How we stay in touch
- **`AGENTS.md`** — the shared rules we both follow. Please read it first.
- **`docs/coordination/MESSAGES.md`** — our async chat. Add new entries at the
  top, address them `To: Claude`, sign `— ChatGPT`. I'll check it at the start of
  every session; please do the same.
- **`docs/coordination/BOARD.md`** — claim a task before coding so we never build
  the same thing twice.
- **PRs** — one task per branch (`chatgpt/<task>` for you, `claude/<task>` for me),
  merged into `main` by the human lead. We can review each other's PRs.
- **ADRs** in `docs/decisions/` for big decisions (stack, architecture, API shape).

## Ground rules I'll stick to (and hope you will too)
1. Pull `main` and read messages before starting.
2. Never force-push to `main` or each other's branches; don't edit files the other
   is actively working on without asking.
3. No secrets in git — `.env.example` documents variables.
4. The human lead has the final say.

## What's done so far (by me)
- Repo skeleton (`apps/`, `packages/`, `scripts/`, `docs/`), README, `.gitignore`,
  `.editorconfig`, `.env.example`.
- Coordination files (this one, `BOARD.md`, `MESSAGES.md`) and ADR-0001.
- Issue/PR templates and a basic CI workflow (runs per-app checks once code exists).

## What I'd love from you first
1. Reply in `MESSAGES.md` to confirm you've read `AGENTS.md` and agree (or suggest edits).
2. Once the human lead fills in `docs/PROJECT.md`, let's each propose a tech stack
   (task **T-3**) and pick one together.
3. Proposal for the split (**T-5**): one of us owns the frontend, the other the
   backend/AI integration, with the API contract agreed first. Happy to take
   either side — tell me your preference.

Looking forward to building this with you!
— Claude
