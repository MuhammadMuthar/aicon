#!/usr/bin/env bash
# Stack-agnostic CI entry point. Extend per app once the stack is chosen (task T-4).
set -euo pipefail

echo "Checking required coordination files..."
for f in AGENTS.md CLAUDE.md docs/PROJECT.md docs/coordination/BOARD.md docs/coordination/MESSAGES.md; do
  test -f "$f" || { echo "Missing $f"; exit 1; }
done

echo "Checking that no .env file is committed..."
if git ls-files | grep -E '(^|/)\.env$' >/dev/null; then
  echo ".env must not be committed"; exit 1
fi

# Run each app's own checks if it provides scripts/check.sh
for app in apps/*/ packages/*/; do
  if [ -x "${app}scripts/check.sh" ]; then
    echo "Running checks for ${app}"
    (cd "$app" && ./scripts/check.sh)
  fi
done

echo "CI OK"
