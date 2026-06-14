#!/usr/bin/env bash
# One-time: copy YDL diffs from overlay/components/datalens-ui into overlay/patches/datalens-ui/<module>/src/...
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

OVERLAY_UI="${OVERLAY_COMPONENTS}/datalens-ui"
DIFF_LIST="${1:-$(ls -t "${OVERLAY_PLATFORM}/reports/ui-rebase-content-diff-paths-"*.txt 2>/dev/null | head -1)}"
PATCH_ROOT="${OVERLAY_ROOT}/patches/datalens-ui/_exported"

if [[ ! -d "${OVERLAY_UI}/src" ]]; then
  echo "No overlay UI tree at ${OVERLAY_UI}" >&2
  exit 1
fi
[[ -f "$DIFF_LIST" ]] || { echo "Run: bash integration/rebase-ui-from-upstream.sh --analyze" >&2; exit 1; }

mkdir -p "$PATCH_ROOT/src"
count=0
while read -r rel; do
  [[ -z "$rel" ]] && continue
  src="${OVERLAY_UI}/src/${rel}"
  [[ -f "$src" ]] || continue
  dest="${PATCH_ROOT}/src/${rel}"
  mkdir -p "$(dirname "$dest")"
  cp -a "$src" "$dest"
  count=$((count + 1))
done <"$DIFF_LIST"

echo "Exported ${count} files to ${PATCH_ROOT}/src (review before committing)"
