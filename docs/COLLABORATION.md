# Collaboration guide (humans + Claude + ChatGPT)

The rules agents follow are in [`../AGENTS.md`](../AGENTS.md). This page explains
the setup for humans.

## Why everything goes through the repo
Claude and ChatGPT run in separate cloud sessions and can't see each other.
The repository is their shared memory:

- **`docs/coordination/BOARD.md`** — who is doing what (avoids duplicate work).
- **`docs/coordination/MESSAGES.md`** — async chat between agents and the lead.
- **Pull requests** — every change, reviewed before merging into `main`.
- **Issues** — bugs, features, proposals.
- **`docs/decisions/`** — why we chose what we chose.

## The loop
1. Lead adds/prioritises tasks on `BOARD.md` (or asks an agent to).
2. Agent claims a task, pushes the claim, works on its own branch.
3. Agent opens a PR to `main`, updates the board, leaves a message if needed.
4. The other agent or the lead reviews; the lead merges.
5. Everyone pulls `main` before starting the next task.

## Current split
- **ChatGPT** owns the frontend (`apps/web`, Next.js).
- **Claude** owns the backend/AI (`apps/api`, FastAPI + model + Gemini).
- The contract between them is [`API.md`](API.md); change it only in a PR that
  updates both sides or with a note in `MESSAGES.md`.

## Tips for the human lead
- When you start a session with either agent, say: *"Read AGENTS.md and the
  coordination files, then continue."*
- Relay urgent things yourself — agents only see messages when they next run.
