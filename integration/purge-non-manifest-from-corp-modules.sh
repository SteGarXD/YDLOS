#!/usr/bin/env bash
# Remove files in curated corp modules that are not listed in corporate-client-corp-manifest.txt
set -euo pipefail
source "$(dirname "$0")/lib/env.sh"
PATCH="${OVERLAY_ROOT}/patches/datalens-ui"
MANIFEST="${YDL_REPO_ROOT}/integration/lib/corporate-client-corp-manifest.txt"

declare -A KEEP=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] || [[ "$line" != *:* ]] && continue
  mod="${line%%:*}"
  rel="${line#*:}"
  [[ "$mod" == "legacy-bulk" ]] && continue
  base="${PATCH}/${mod}/src/${rel}"
  if [[ -d "$base" ]]; then
    while IFS= read -r f; do
      KEEP["$f"]=1
    done < <(find "$base" -type f)
  elif [[ -f "$base" ]]; then
    KEEP["$base"]=1
  fi
done <"$MANIFEST"

MODULES=(client-branding client-features client-date-controls client-viz-settings ydl-only)
removed=0
for mod in "${MODULES[@]}"; do
  root="${PATCH}/${mod}/src"
  [[ -d "$root" ]] || continue
  while IFS= read -r f; do
  if [[ -z "${KEEP[$f]:-}" ]]; then
    rm -f "$f"
    removed=$((removed + 1))
    echo "rm ${f#${PATCH}/}"
  fi
  done < <(find "$root" -type f)
done
find "${PATCH}" -type d -empty -delete 2>/dev/null || true
echo "Removed $removed files not in corp manifest."
