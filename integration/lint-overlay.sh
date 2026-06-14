#!/usr/bin/env bash
# Lint overlay: Python scripts + files changed vs origin/main (not whole UI tree).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
export PATH="/home/g.stepanov/.local/bin:$PATH"
FAIL=0

log() { echo "[lint] $*"; }

log "Python compile (ydl-os scripts)"
while IFS= read -r -d '' f; do
  python3 -m py_compile "$f" || FAIL=1
done < <(find "${YDL_SCRIPTS}" -name '*.py' -print0)

mapfile -t CHANGED < <(git -C "${YDL_REPO_ROOT}" diff --name-only origin/main HEAD 2>/dev/null \
  | grep -E '^overlay/components/datalens-ui/.*\.(ts|tsx)$' || true)

UI="${OVERLAY_COMPONENTS}/datalens-ui"
if [[ ${#CHANGED[@]} -gt 0 && -d "$UI/node_modules" ]]; then
  log "datalens-ui eslint on ${#CHANGED[@]} changed file(s)"
  (cd "$UI" && npx eslint -c src/ui/.ci-eslintrc "${CHANGED[@]#overlay/components/datalens-ui/}" --quiet) || FAIL=1
  log "datalens-ui typecheck:server"
  (cd "$UI" && npm run typecheck:server) || FAIL=1
elif [[ ! -d "$UI/node_modules" ]]; then
  log "SKIP UI (npm ci --ignore-scripts in overlay/components/datalens-ui)"
else
  log "No UI file changes vs origin/main"
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "[lint] FAILED"
  exit 1
fi
echo "[lint] OK"
