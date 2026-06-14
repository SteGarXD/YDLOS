#!/usr/bin/env bash
# UI rebase: align overlay/components/datalens-ui with datalens-tech/datalens-ui @ vendor uiVersion.
# Modes: (default) report | --analyze | --execute
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

TARGET="${1:-$(jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json")}"
MODE="${2:---analyze}"
WORKDIR="${UI_REBASE_WORKDIR:-/tmp/ydl-ui-rebase}"
OVERLAY_UI="${OVERLAY_COMPONENTS}/datalens-ui"
LEGACY_SNAPSHOT="${OVERLAY_COMPONENTS}/datalens-ui-pre-${TARGET}-legacy"
UPSTREAM="${WORKDIR}/datalens-ui-upstream"
REPORT_DIR="${OVERLAY_PLATFORM}/reports"
TS="$(date -u +%Y%m%d-%H%M%SZ)"

log() { echo "[ui-rebase] $*"; }

usage() {
  cat <<EOF
UI rebase to datalens-tech/datalens-ui v${TARGET}

  bash $(basename "$0")              # same as --analyze
  bash $(basename "$0") ${TARGET} --analyze
  bash $(basename "$0") ${TARGET} --execute   # replace overlay tree (snapshot legacy first)

After --execute:
  1. Port files listed in ${REPORT_DIR}/ui-rebase-only-in-legacy-*.txt
  2. cd ${OVERLAY_UI} && npm ci && npm run build
  3. bash integration/publish-ui-overlay-dist.sh
  4. bash integration/platform-acceptance.sh

EOF
}

if [[ "$MODE" == "--help" || "$MODE" == "-h" ]]; then
  usage
  exit 0
fi

mkdir -p "$REPORT_DIR" "$WORKDIR"

if [[ ! -d "${UPSTREAM}/.git" ]]; then
  log "clone datalens-tech/datalens-ui v${TARGET}..."
  git clone --depth 1 --branch "v${TARGET}" https://github.com/datalens-tech/datalens-ui.git "$UPSTREAM"
else
  git -C "$UPSTREAM" fetch --depth 1 origin "v${TARGET}" 2>/dev/null || true
  git -C "$UPSTREAM" checkout -f "v${TARGET}" 2>/dev/null || git -C "$UPSTREAM" checkout -f "tags/v${TARGET}"
fi

log "overlay package.json: $(jq -r .version "${OVERLAY_UI}/package.json" 2>/dev/null || echo missing)"
log "upstream package.json: $(jq -r .version "${UPSTREAM}/package.json")"

# Paths present in overlay but not in upstream (PRIVATE / extensions candidates)
comm -23 \
  <(cd "${OVERLAY_UI}/src" 2>/dev/null && find . \( -name '*.ts' -o -name '*.tsx' \) | sort) \
  <(cd "${UPSTREAM}/src" && find . \( -name '*.ts' -o -name '*.tsx' \) | sort) \
  >"${REPORT_DIR}/ui-rebase-ydl-patch-candidates-${TS}.txt" || true

# Files that differ (same path, different content) — sample cap for report
DIFF_LIST="${REPORT_DIR}/ui-rebase-content-diff-paths-${TS}.txt"
: >"$DIFF_LIST"
while IFS= read -r rel; do
  [[ -f "${UPSTREAM}/src/${rel#./}" ]] || continue
  o="${OVERLAY_UI}/src/${rel#./}"
  u="${UPSTREAM}/src/${rel#./}"
  [[ -f "$o" ]] || continue
  if ! cmp -s "$o" "$u" 2>/dev/null; then
    echo "${rel#./}" >>"$DIFF_LIST"
  fi
done < <(cd "${UPSTREAM}/src" && find . \( -name '*.ts' -o -name '*.tsx' \) | head -5000)

OVERLAY_ONLY=$(wc -l <"${REPORT_DIR}/ui-rebase-ydl-patch-candidates-${TS}.txt" | tr -d ' ')
DIFF_COUNT=$(wc -l <"$DIFF_LIST" | tr -d ' ')

log "YDL-only paths (overlay, not in upstream tree): ${OVERLAY_ONLY}"
log "Modified vs upstream (same path): ${DIFF_COUNT}"
log "Reports: ${REPORT_DIR}/ui-rebase-*-${TS}.txt"

if [[ "$MODE" != "--execute" ]]; then
  usage
  exit 0
fi

if [[ ! -d "$LEGACY_SNAPSHOT" ]]; then
  log "snapshot legacy -> ${LEGACY_SNAPSHOT}"
  rsync -a --exclude node_modules --exclude dist --exclude .git \
    "${OVERLAY_UI}/" "${LEGACY_SNAPSHOT}/"
fi

log "replacing ${OVERLAY_UI} with upstream v${TARGET}"
rm -rf "${OVERLAY_UI:?}"/*
rsync -a --exclude node_modules --exclude dist --exclude .git \
  "${UPSTREAM}/" "${OVERLAY_UI}/"

comm -23 \
  <(cd "${LEGACY_SNAPSHOT}/src" && find . \( -name '*.ts' -o -name '*.tsx' \) | sort) \
  <(cd "${OVERLAY_UI}/src" && find . \( -name '*.ts' -o -name '*.tsx' \) | sort) \
  >"${REPORT_DIR}/ui-rebase-only-in-legacy-${TS}.txt"

log "=== base replaced. Port ${REPORT_DIR}/ui-rebase-only-in-legacy-${TS}.txt then build ==="
