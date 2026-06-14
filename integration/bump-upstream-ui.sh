#!/usr/bin/env bash
# Bump datalens-tech/datalens vendor + rebuild YDL UI overlay on official ghcr base.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

REF="${1:-main}"
CLIENT_TIER="${YDL_UI_CLIENT_TIER:-branding}"
SKIP_DEPLOY="${SKIP_DEPLOY:-1}"

echo "=== YDL upstream UI bump ==="
echo "vendor ref: ${REF}"
echo "client tier: ${CLIENT_TIER}"
echo ""

bash "$(dirname "$0")/update-vendor.sh" "$REF"
bash "$(dirname "$0")/sync-official-image-pins.sh"
bash "$(dirname "$0")/check-version-alignment.sh"

UI_VER="$(jq -r '.uiVersion' "${VENDOR_DATALENS}/versions-config.json")"
echo ""
echo "uiVersion=${UI_VER} — validate patches on clean worktree..."
UI_DIR="$(bash "$(dirname "$0")/ensure-official-ui-worktree.sh" "$UI_VER")"
# shellcheck source=integration/lib/ui-worktree.sh
source "$(dirname "$0")/lib/ui-worktree.sh"
apply_ui_patches "$UI_DIR"
echo "patch apply OK"

echo ""
echo "overlay health..."
bash "$(dirname "$0")/verify-overlay-health.sh"

echo ""
echo "build UI image..."
YDL_UI_CLIENT_TIER="$CLIENT_TIER" bash "$(dirname "$0")/publish-ui-overlay-dist.sh"

echo ""
echo "smoke official stack (local)..."
bash "$(dirname "$0")/smoke-official-stack.sh" 2>/dev/null || echo "WARN: smoke skipped/failed — check manually"

if [[ "$SKIP_DEPLOY" == "0" ]]; then
  echo ""
  echo "deploy..."
  BUILD_ON_DEPLOY=0 YDL_PROFILE="${YDL_PROFILE:-portal}" \
    bash "${OVERLAY_PLATFORM}/scripts/ydl-os/deploy.sh"
fi

echo ""
echo "=== Done ==="
echo "Next: commit vendor bump + overlay changes if any"
echo "  git add vendor/datalens overlay/platform/.ydl-built-images.env"
echo "Prod deploy: BUILD_ON_DEPLOY=0 bash overlay/platform/scripts/ydl-os/deploy.sh"
