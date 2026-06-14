#!/usr/bin/env bash
# Classify overlay UI diff vs vendor tag (phase 1.1).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

UI="${OVERLAY_COMPONENTS}/datalens-ui"
OUT="${YDL_REPO_ROOT}/docs/dev/overlay-ui-path-inventory.md"
UI_VER="$(jq -r '.uiVersion' "${VENDOR_DATALENS}/versions-config.json")"

log() { echo "[ui-inventory] $*"; }

if [[ ! -d "$UI/src" ]]; then
  log "ERROR: $UI not found"
  exit 1
fi

{
  echo "# Overlay UI path inventory"
  echo ""
  echo "UI vendor tag: \`${UI_VER}\` — generated \`$(date -u +%Y-%m-%d)\`"
  echo ""
  echo "| Class | Count |"
  echo "|-------|------:|"

  total=$(find "$UI/src" \( -name '*.ts' -o -name '*.tsx' \) | wc -l)
  echo "| TS/TSX total in overlay tree | ${total} |"

  for pat in legacy-rbac akrasnov CustomSignin OidcAutoRedirect FlightGroups DialogShare run.ts; do
    n=$(grep -rl "$pat" "$UI/src" 2>/dev/null | wc -l || echo 0)
    echo "| paths mentioning \`${pat}\` | ${n} |"
  done

  echo ""
  echo "## Patches migrated"
  find "${OVERLAY_ROOT}/patches" -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | while read -r f; do
    echo "- \`${f#${YDL_REPO_ROOT}/}\`"
  done

  echo ""
  echo "Regenerate: \`bash integration/overlay-ui-path-inventory.sh\`"
} >"$OUT"

log "wrote $OUT"
