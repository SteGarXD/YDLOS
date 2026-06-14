#!/usr/bin/env bash
# Full datalens-ui overlay lint: prettier/eslint --fix on src (upstream parity target).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
UI="${OVERLAY_COMPONENTS}/datalens-ui"
FAIL=0

[[ -d "$UI" ]] || { echo "missing $UI"; exit 1; }

if [[ ! -d "$UI/node_modules" ]]; then
  (cd "$UI" && HUSKY=0 npm ci --ignore-scripts --no-audit --no-fund)
fi

echo "[ui-lint-full] eslint --fix src/"
(cd "$UI" && npx eslint -c src/ui/.ci-eslintrc "src/**/*.{ts,tsx}" --fix --quiet) || FAIL=1

echo "[ui-lint-full] typecheck server + client"
(cd "$UI" && npm run typecheck:server) || FAIL=1

[[ "$FAIL" -eq 0 ]] || { echo "[ui-lint-full] FAILED"; exit 1; }
echo "[ui-lint-full] OK"
