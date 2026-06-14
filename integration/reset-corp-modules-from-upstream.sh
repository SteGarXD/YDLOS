#!/usr/bin/env bash
# Reset curated corp module files from upstream tag (undo accidental bulk overwrite).
set -euo pipefail
source "$(dirname "$0")/lib/env.sh"
UI_VER="$(jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json")"
UP="${YDL_UI_WORKDIR:-${YDL_REPO_ROOT}/.cache/datalens-ui}/v${UI_VER}"
TAG="v${UI_VER}"
PATCH="${OVERLAY_ROOT}/patches/datalens-ui"
MANIFEST="${YDL_REPO_ROOT}/integration/lib/corporate-client-corp-manifest.txt"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] || [[ "$line" != *:* ]] && continue
  mod="${line%%:*}"
  rel="${line#*:}"
  [[ "$mod" == "legacy-bulk" ]] && continue
  src_path="src/${rel}"
  if git -C "$UP" cat-file -e "${TAG}:${src_path}" 2>/dev/null; then
    dst="${PATCH}/${mod}/${src_path}"
    mkdir -p "$(dirname "$dst")"
    if git -C "$UP" cat-file -t "${TAG}:${src_path}" | grep -q tree; then
      rm -rf "$dst"
      git -C "$UP" archive "${TAG}" "${src_path}" | tar -x -C "${PATCH}/${mod}" 2>/dev/null || true
    else
      git -C "$UP" show "${TAG}:${src_path}" >"$dst"
    fi
    echo "reset ${mod}:${rel}"
  fi
done <"$MANIFEST"

echo "Done. Re-apply ydl-only flight-groups files manually if needed."
