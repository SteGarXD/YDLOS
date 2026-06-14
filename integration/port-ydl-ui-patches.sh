#!/usr/bin/env bash
# After rebase-ui --execute: copy YDL-only and listed legacy paths from snapshot back into overlay UI.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

UI_VER="$(jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json")"
LEGACY="${OVERLAY_COMPONENTS}/datalens-ui-pre-${UI_VER}-legacy"
OVERLAY_UI="${OVERLAY_COMPONENTS}/datalens-ui"
REPORT="$(ls -t "${OVERLAY_PLATFORM}/reports/ui-rebase-only-in-legacy-"*.txt 2>/dev/null | head -1)"
CANDIDATES="$(ls -t "${OVERLAY_PLATFORM}/reports/ui-rebase-ydl-patch-candidates-"*.txt 2>/dev/null | head -1)"
DIFF_PATHS="$(ls -t "${OVERLAY_PLATFORM}/reports/ui-rebase-content-diff-paths-"*.txt 2>/dev/null | head -1)"

if [[ ! -d "$LEGACY/src" ]]; then
  echo "Missing legacy snapshot: ${LEGACY}" >&2
  echo "Run: bash integration/rebase-ui-from-upstream.sh ${UI_VER} --execute" >&2
  exit 1
fi

log() { echo "[port-ydl] $*"; }

copy_path() {
  local rel="$1"
  rel="${rel#./}"
  local src="${LEGACY}/src/${rel}"
  local dst="${OVERLAY_UI}/src/${rel}"
  [[ -e "$src" ]] || return 0
  mkdir -p "$(dirname "$dst")"
  if [[ -d "$src" ]]; then
    rsync -a "$src/" "$dst/"
  else
    cp -a "$src" "$dst"
  fi
  log "ported ${rel}"
}

log "from ${LEGACY}"
[[ -f "$CANDIDATES" ]] && while read -r p; do [[ -n "$p" ]] && copy_path "$p"; done <"$CANDIDATES"
[[ -f "$REPORT" ]] && while read -r p; do [[ -n "$p" ]] && copy_path "$p"; done <"$REPORT"
if [[ -f "$DIFF_PATHS" ]]; then
  log "port modified vs upstream ($(wc -l <"$DIFF_PATHS") paths)..."
  while read -r p; do [[ -n "$p" ]] && copy_path "$p"; done <"$DIFF_PATHS"
fi

log "done — run: cd ${OVERLAY_UI} && npm ci && npm run build"
