#!/usr/bin/env bash
# Inventory modular overlay (no bulk trees).
set -euo pipefail
source "$(dirname "$0")/lib/env.sh"
PATCH="${OVERLAY_ROOT}/patches/datalens-ui"

echo "# YDL overlay inventory"
echo ""
for m in ydl-config layout-branding charts-engine-run charts-params ydl-routes us-corporate ydl-types client-branding client-features ydl-only; do
  [[ -d "$PATCH/$m" ]] || continue
  n="$(find "$PATCH/$m" -type f ! -name README.md | wc -l)"
  printf '  %-22s %4s\n' "$m/" "$n"
done
echo ""
bulk=0
for tree in overlay-client overlay-server overlay-shared; do
  [[ -d "$PATCH/$tree/src" ]] && bulk=$((bulk + $(find "$PATCH/$tree/src" -type f 2>/dev/null | wc -l)))
done
echo "overlay-client/server/shared src files: ${bulk} (must be 0)"
echo "Total patch src files: $(find "$PATCH" -type f ! -name README.md ! -name CORPORATE_PATCHES.md | wc -l)"
echo ""
echo "Doc: docs/dev/overlay-etalon-bulk.md"
