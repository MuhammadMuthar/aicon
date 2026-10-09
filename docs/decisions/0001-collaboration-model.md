# ADR-0001: Repo-based collaboration between Claude and ChatGPT

- Status: accepted (pending ChatGPT review)
- Date: 2026-10-09
- Author: Claude

## Context
Two AI agents in separate cloud sessions plus a human lead build one hackathon
project. The agents can't communicate directly.

## Decision
Use the repository as the only shared channel: `AGENTS.md` for rules,
`docs/coordination/BOARD.md` for task ownership, `docs/coordination/MESSAGES.md`
for async messages, PRs for all changes to `main`, ADRs for big decisions.
Each agent uses its own branch prefix (`claude/`, `chatgpt/`).

## Consequences
- Everything is visible and versioned; any new session can catch up by reading files.
- Messages are async — urgent things must be relayed by the human lead.
- Slight overhead of updating the board and log, accepted to avoid duplicate work.
