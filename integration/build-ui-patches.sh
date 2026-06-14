#!/usr/bin/env bash
# Build UI: official datalens-ui tag + overlay/patches (no fat tree in git).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
source "$(dirname "$0")/lib/ui-worktree.sh"

UI_VER="$(ui_official_tag)"
UI_WORK="${YDL_UI_BUILD_DIR:-$(ui_worktree_dir "$UI_VER")}"

log() { echo "[build-ui-patches] $*"; }

if [[ ! -d "${UI_WORK}/.git" ]]; then
  UI_WORK="$(ensure_official_ui_worktree "$UI_VER")"
fi

log "workdir=$UI_WORK tag=v${UI_VER}"
apply_ui_patches "$UI_WORK"

(
  cd "$UI_WORK"
  npm ci
  npm run build
  npx tsc -p src/server/tsconfig.json
)

log "OK dist at ${UI_WORK}/dist"
log "Publish: YDL_UI_BUILD_DIR=${UI_WORK} bash integration/publish-ui-overlay-dist.sh"
