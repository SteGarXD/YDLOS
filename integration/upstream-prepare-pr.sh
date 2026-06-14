#!/usr/bin/env bash
# Export minimal patch sets from overlay for datalens-tech PRs (run from YDLOS root).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

OUT="${1:-${OVERLAY_PLATFORM}/upstream-export}"
VC="${VENDOR_DATALENS}/versions-config.json"
UI_TAG="$(jq -r .uiVersion "$VC")"
BE_TAG="$(jq -r .backendVersion "$VC")"

mkdir -p "$OUT"/{ui-auth-oss,backend-mssql}

echo "=== Upstream PR export -> $OUT ==="

# 1) OSS auth page behavior (ui)
if [[ -f "${OVERLAY_COMPONENTS}/datalens-ui/src/ui/datalens/index.tsx" ]]; then
  grep -n "YDL-OS\|opensource\|CustomAuth" \
    "${OVERLAY_COMPONENTS}/datalens-ui/src/ui/datalens/index.tsx" \
    >"$OUT/ui-auth-oss/grep-hints.txt" || true
  cp "${OVERLAY_COMPONENTS}/datalens-ui/src/ui/datalens/index.tsx" \
    "$OUT/ui-auth-oss/index.tsx.reference"
fi

# 2) MSSQL connector tree (backend)
if [[ -d "${OVERLAY_COMPONENTS}/datalens-backend/lib/dl_connector_mssql" ]]; then
  rsync -a "${OVERLAY_COMPONENTS}/datalens-backend/lib/dl_connector_mssql" \
    "$OUT/backend-mssql/"
  rsync -a "${OVERLAY_COMPONENTS}/datalens-backend/lib/dl_sqlalchemy_mssql" \
    "$OUT/backend-mssql/" 2>/dev/null || true
fi

cat >"$OUT/README.md" <<EOF
# Upstream PR export (generated)

Target upstream tags from vendor/datalens:
- datalens-ui: ${UI_TAG}
- datalens-backend: ${BE_TAG}

## Suggested PRs

1. **datalens-backend**: MSSQL connector (\`lib/dl_connector_mssql\`, \`lib/dl_sqlalchemy_mssql\`)
2. **datalens-ui**: opensource auth page — see \`ui-auth-oss/index.tsx.reference\` (minimize diff before PR)

Clone upstream at tag, copy/adapt, run tests, open PR to datalens-tech.

See overlay/platform/docs/UPSTREAM_PR_MATRIX.md
EOF

echo "Wrote $OUT/README.md"
