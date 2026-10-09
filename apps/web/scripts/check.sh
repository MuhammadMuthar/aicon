#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm run lint -- --max-warnings=0
npm run typecheck
NEXT_TELEMETRY_DISABLED=1 npm run build
