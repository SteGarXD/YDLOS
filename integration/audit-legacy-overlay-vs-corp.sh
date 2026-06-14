#!/usr/bin/env bash
# Compare legacy monolithic overlay (ydl-os-future) with modular corp overlay.
# Use to find files worth porting into overlay/patches/datalens-ui/*.
set -euo pipefail

LEGACY_ROOT="${LEGACY_ROOT:-$HOME/ydl-os-future/overlay/components/datalens-ui/src}"
CORP_PATCH="${CORP_PATCH:-$(cd "$(dirname "$0")/../overlay/patches/datalens-ui" && pwd)}"
OUT="${OUT:-$(dirname "$0")/reports/legacy-vs-corp-$(date +%Y%m%d-%H%M%S).txt}"

if [[ ! -d "$LEGACY_ROOT" ]]; then
  echo "Legacy tree not found: $LEGACY_ROOT" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"

{
  echo "# Legacy overlay vs corp modules"
  echo "# legacy=$LEGACY_ROOT"
  echo "# corp=$CORP_PATCH"
  echo ""
  echo "## Not in any corp module (candidate to port)"
  while IFS= read -r f; do
    rel="${f#"$LEGACY_ROOT"/}"
    found=0
    for m in "$CORP_PATCH"/*/src; do
      [[ -f "${m}/${rel}" ]] && found=1 && break
    done
    [[ $found -eq 0 ]] && echo "$rel"
  done < <(find "$LEGACY_ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.scss' \) ! -path '*/node_modules/*' | sort)

  echo ""
  echo "## Already in corp modules"
  while IFS= read -r f; do
    rel="${f#"$LEGACY_ROOT"/}"
    for m in "$CORP_PATCH"/*/src; do
      if [[ -f "${m}/${rel}" ]]; then
        echo "$rel -> $(basename "$(dirname "$(dirname "$m")")")"
        break
      fi
    done
  done < <(find "$LEGACY_ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.scss' \) ! -path '*/node_modules/*' | sort)
} | tee "$OUT"

echo "Report: $OUT"
