#!/usr/bin/env bash
# Full overlay quality: Python + YDL UI/auth paths + server typecheck.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
export PATH="/home/g.stepanov/.local/bin:$PATH"
FAIL=0

log() { echo "[lint-full] $*"; }

bash "$(dirname "$0")/lint-overlay.sh" || FAIL=1

log "Python unittest (overlay/platform/tests)"
python3 -m unittest discover -s "${OVERLAY_PLATFORM}/tests" -p 'test_*.py' -q || FAIL=1

UI="${OVERLAY_COMPONENTS}/datalens-ui"
YDL_UI_PATHS=(
  src/ui/units/auth
  src/server/components/auth
  src/server/modes/charts/plugins/datalens/preparers/pie
)

if [[ ! -d "$UI/node_modules" ]]; then
  log "npm ci (ignore scripts) for datalens-ui"
  (cd "$UI" && npm ci --ignore-scripts --no-audit --no-fund) || FAIL=1
fi

if [[ -d "$UI/node_modules" ]]; then
  mapfile -t FILES < <(
    find "${YDL_UI_PATHS[@]/#/$UI/}" -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | sort
  )
  if [[ ${#FILES[@]} -gt 0 ]]; then
    log "eslint ${#FILES[@]} YDL UI/auth files"
    (cd "$UI" && npx eslint -c src/ui/.ci-eslintrc "${FILES[@]#$UI/}" --quiet) || FAIL=1
  fi
  log "i18n:prepare (keysets for server typecheck)"
  (cd "$UI" && npm run i18n:prepare) || FAIL=1
  log "typecheck:server"
  (cd "$UI" && npm run typecheck:server) || FAIL=1
fi

AUTH="${OVERLAY_COMPONENTS}/datalens-auth"
if [[ -d "$AUTH/app" ]]; then
  log "auth routes syntax"
  node --check "$AUTH/app/routes/datalens-auth.js" || FAIL=1
fi

[[ "$FAIL" -eq 0 ]] || { echo "[lint-full] FAILED"; exit 1; }
echo "[lint-full] OK"
