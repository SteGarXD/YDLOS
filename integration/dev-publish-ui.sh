#!/usr/bin/env bash
# Fast dev → prod UI publish. See docs/dev/build-loops.md
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

TIER="${1:-corp}"
PROD_GATE=0
if [[ "${1:-}" == "--prod-gate" ]]; then
  PROD_GATE=1
  TIER="${2:-corp}"
fi

export YDL_UI_CLIENT_TIER="${TIER}"
# server/none: only tsc server (see publish-ui-overlay-dist.sh); corp: full client
unset YDL_UI_CLIENT_BUILD
export YDL_BUILD_NO_CACHE="${YDL_BUILD_NO_CACHE:-0}"

if [[ "$PROD_GATE" == "1" ]]; then
  export YDL_BUILD_NO_CACHE=1
  export YDL_SKIP_CLIENT_BUILD=0
fi

echo "=== dev-publish-ui tier=${TIER} no_cache=${YDL_BUILD_NO_CACHE} prod_gate=${PROD_GATE} ==="
bash "$(dirname "$0")/publish-ui-overlay-dist.sh"

if [[ "$PROD_GATE" == "1" ]]; then
  UI_VER="$(jq -r '.uiVersion' "${VENDOR_DATALENS}/versions-config.json")"
  UI_DIR="$(bash "$(dirname "$0")/lib/ui-worktree.sh" ensure_official_ui_worktree "$UI_VER")"
  bash "$(dirname "$0")/verify-corp-client-bundle.sh" "${UI_DIR}"
  IMG="$(grep '^YDL_UI_IMAGE=' "${OVERLAY_PLATFORM}/.ydl-built-images.env" | cut -d= -f2-)"
  CID="$(docker create "$IMG")"
  docker start "$CID" >/dev/null
  for f in \
    /opt/app/dist/server/controllers/flight-groups-editor.js \
    /opt/app/dist/server/modes/opensource/routes.js \
    /opt/app/dist/server/configs/opensource/common.js; do
    docker exec "$CID" test -f "$f" || {
      echo "prod-gate FAIL: missing $f in $IMG" >&2
      docker rm -f "$CID" >/dev/null
      exit 1
    }
  done
  docker exec "$CID" grep -q 'Language.Ru' /opt/app/dist/server/configs/opensource/common.js
  docker exec "$CID" grep -q 'getYdlExtraRoutes' /opt/app/dist/server/modes/opensource/routes.js
  docker stop "$CID" >/dev/null
  docker rm "$CID" >/dev/null
  echo "prod-gate OK: $IMG"
fi

grep '^YDL_UI_IMAGE=' "${OVERLAY_PLATFORM}/.ydl-built-images.env"
