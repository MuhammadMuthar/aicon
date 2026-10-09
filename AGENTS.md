# AGENTS.md — Shared rules for every AI agent in this repo

This file is the **single source of truth** for how AI agents work here.
Both **Claude** and **ChatGPT** follow it. If you change it, say so in
`docs/coordination/MESSAGES.md` so the other agent re-reads it.

## 1. Who's who

| Role | Identity | Branch prefix | Signs messages as |
|------|----------|---------------|-------------------|
| Team lead / final decision-maker | Human (repo owner) | — | `@human` |
| Agent | Claude (Claude Code) | `claude/` | `— Claude` |
| Agent | ChatGPT (ChatGPT / Codex) | `chatgpt/` | `— ChatGPT` |

The human lead has the final say on scope, stack and merges.

## 2. Before you start any work session

1. `git fetch origin` and pull `main`.
2. Read `docs/coordination/MESSAGES.md` (newest at the top) — anything addressed to you?
3. Read `docs/coordination/BOARD.md` — what's claimed, what's free?
4. Skim `docs/PROJECT.md` and `docs/decisions/` if anything changed since last time.

## 3. Claiming and doing work

- **Claim before you code.** Move the task to *In progress* on `BOARD.md` with
  your name and branch, commit, and push that change first. This prevents both
  agents building the same thing.
- **One task = one branch = one PR.** Branch from latest `main`:
  `claude/<short-task>` or `chatgpt/<short-task>`.
- **Stay in your lane.** Don't edit files another agent has an open task on
  unless you've agreed in `MESSAGES.md` or the PR thread.
- **Never force-push** to `main` or to the other agent's branches.
- **Never commit secrets.** Use `.env` (git-ignored) and document variables in `.env.example`.
- Keep PRs small and focused; the human lead (or the other agent, as reviewer) merges.

## 4. Communicating with the other agent

We can't talk in real time, so we talk through the repo:

| Need | Channel |
|------|---------|
| General note, heads-up, question | Add an entry at the **top** of `docs/coordination/MESSAGES.md` |
| Discussion about specific code | Comment on the PR |
| A bug / feature / proposal | Open a GitHub Issue (use the templates) |
| A decision that's hard to reverse (stack, DB, API shape) | Write an ADR in `docs/decisions/` |

Message format in `MESSAGES.md`:

```
### YYYY-MM-DD — From: Claude → To: ChatGPT — <subject>
<body>
Status: open | answered | done
— Claude
```

When you answer, add a new entry referencing the subject and set the old one to `answered`.

## 5. Definition of done

- Code builds and tests/lint pass locally and in CI.
- New behavior has at least a basic test where practical.
- README/docs updated if setup or usage changed.
- `BOARD.md` moved to *Review* / *Done*, and a `MESSAGES.md` note if the other agent is affected.

## 6. Conventions

- Commit messages: `type(scope): summary` — e.g. `feat(api): add login endpoint`.
  Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
- Code style: follow the formatter/linter configured for each app once the stack is chosen.
- Keep this file and `docs/COLLABORATION.md` in sync.
