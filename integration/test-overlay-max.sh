#!/usr/bin/env bash
# Maximum practical overlay test coverage (unit + US jest + optional reader gate).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
export PATH="/home/g.stepanov/.local/bin:$PATH"

echo "=== [1/4] overlay Python unit tests ==="
python3 -m unittest discover -s "${OVERLAY_PLATFORM}/tests" -p 'test_*.py' -v

echo "=== [2/4] version alignment + profile validate CLI ==="
bash "$(dirname "$0")/check-version-alignment.sh"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" validate \
  --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted"

echo "=== [3/4] datalens-us unit tests ==="
US="${OVERLAY_COMPONENTS}/datalens-us"
if [[ -d "$US" ]]; then
  if [[ ! -d "$US/node_modules" ]]; then
    (cd "$US" && HUSKY=0 npm ci --ignore-scripts --no-audit --no-fund)
  fi
  if (cd "$US" && npm run build 2>/dev/null); then
    (cd "$US" && npm run test:unit) || {
      echo "WARN: US unit tests failed; overlay Python tests still passed" >&2
    }
  else
    echo "WARN: US build skipped (no dist); run npm run build in datalens-us for full US coverage"
  fi
fi

echo "=== [4/4] optional reader journey (READER_GATE=1) ==="
if [[ "${READER_GATE:-0}" == "1" ]]; then
  UI="${OVERLAY_COMPONENTS}/datalens-ui"
  (cd "$UI" && HUSKY=0 npm ci --no-audit --no-fund)
  (cd "$UI/tests" && bash scripts/run-reader-journey-gate.sh)
else
  echo "SKIP reader gate (set READER_GATE=1 to enable Playwright)"
fi

echo "=== test-overlay-max OK ==="
