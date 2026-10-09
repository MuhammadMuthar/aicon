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

## Suggested split (adjust once the idea is known)
Splitting by area keeps merge conflicts low, e.g. one agent owns the frontend
(`apps/web`), the other the backend/AI (`apps/api`), with the API contract
agreed first in an ADR.

## Tips for the human lead
- When you start a session with either agent, say: *"Read AGENTS.md and the
  coordination files, then continue."*
- Relay urgent things yourself — agents only see messages when they next run.
