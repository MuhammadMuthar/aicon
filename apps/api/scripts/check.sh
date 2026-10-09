#!/usr/bin/env bash
# CI checks for apps/api (called by the repo-level scripts/ci.sh).
set -euo pipefail
python -m pytest -q
