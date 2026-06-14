#!/usr/bin/env bash
# ghcr datalens-ui + tiered YDL overlay. Default: official client + server + minimal branding rebuild.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

source "${SCRIPT_DIR}/lib/env.sh"
source "${SCRIPT_DIR}/lib/ui-worktree.sh"

UI_VER="$(jq -r '.uiVersion' "${VENDOR_DATALENS}/versions-config.json")"
BASE_TAG="${UI_BASE_TAG:-ghcr.io/datalens-tech/datalens-ui:${UI_VER}}"
GIT_SHA="$(git -C "${YDL_REPO_ROOT}" rev-parse --short=12 HEAD 2>/dev/null || echo local)"
CLIENT_TIER="${YDL_UI_CLIENT_TIER:-corp}"
CLIENT_BUILD="${YDL_UI_CLIENT_BUILD:-$([[ "$CLIENT_TIER" == none || "$CLIENT_TIER" == 0 || "$CLIENT_TIER" == server ]] && echo 0 || echo 1)}"
BUILD_UTC_TAG="$(date -u +%Y%m%dT%H%M%S)"
OUT_TAG="${UI_TAG:-${YDL_IMAGE_PREFIX:-ydl}/datalens-ui:${UI_VER}-${CLIENT_TIER}-${GIT_SHA}-${BUILD_UTC_TAG}}"

log() { echo "[publish-ui-dist] $*"; }

copy_overlay() {
  local src="$1" dst="$2"
  [[ -e "$src" ]] || return 0
  docker cp "$src" "${CID}:${dst}"
}

patch_gravity_charts_legend() {
  local file
  for file in \
    "${UI_DIR}/node_modules/@gravity-ui/charts/dist/esm/hooks/useSeries/utils.js" \
    "${UI_DIR}/node_modules/@gravity-ui/charts/dist/cjs/hooks/useSeries/utils.js"; do
    [[ -f "$file" ]] || continue
    python3 - "$file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
old = """    return {
        shape: 'symbol',
        symbolType: symbolType || SymbolType.Circle,
        width: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.width) || DEFAULT_LEGEND_SYMBOL_SIZE,
        padding: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.padding) || DEFAULT_LEGEND_SYMBOL_PADDING,
    };"""
new = """    if ((symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.shape) === 'rect') {
        return {
            shape: 'rect',
            width: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.width) || DEFAULT_LEGEND_SYMBOL_SIZE,
            height: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.height) || 4,
            radius: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.radius) || 0,
            padding: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.padding) || DEFAULT_LEGEND_SYMBOL_PADDING,
        };
    }
    return {
        shape: 'symbol',
        symbolType: symbolType || SymbolType.Circle,
        width: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.width) || DEFAULT_LEGEND_SYMBOL_SIZE,
        padding: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.padding) || DEFAULT_LEGEND_SYMBOL_PADDING,
    };"""
if old not in text:
    raise SystemExit(f"gravity legend patch target not found: {path}")
path.write_text(text.replace(old, new))
PY
  done
}

UI_DIR="$(ensure_official_ui_worktree "$UI_VER")"
apply_ui_patches "$UI_DIR"

if ! grep -q 'label_customization-profile' "${UI_DIR}/src/i18n-keysets/wizard/ru.json" 2>/dev/null; then
  echo "[publish-ui-dist] ERROR: wizard ru.json missing corp i18n (label_customization-profile)" >&2
  exit 1
fi

# 0 = incremental (dev); 1 = clean dist (release / prod-gate). See docs/dev/build-loops.md
NO_CACHE="${YDL_BUILD_NO_CACHE:-0}"
if [[ "$NO_CACHE" == "1" ]]; then
  log "no-cache: clean dist, webpack/rspack caches"
  rm -rf "${UI_DIR}/dist" "${UI_DIR}/.cache" "${UI_DIR}/node_modules/.cache"
fi

SKIP_CLIENT=0
if [[ "$CLIENT_BUILD" == "1" && "${YDL_SKIP_CLIENT_BUILD:-0}" == "1" ]]; then
  if compgen -G "${UI_DIR}/dist/public/build/js/dl-main"*.js >/dev/null; then
    log "YDL_SKIP_CLIENT_BUILD=1: reuse existing client dist"
    SKIP_CLIENT=1
    (
      cd "${UI_DIR}"
      ./node_modules/.bin/tsc src/i18n/prepare-keysets/index.ts --esModuleInterop --outDir dist/i18n 2>/dev/null || true
      npx tsc -p src/server/tsconfig.json
    )
    bash "${SCRIPT_DIR}/verify-corp-client-bundle.sh" "${UI_DIR}"
  fi
fi

if [[ "$CLIENT_BUILD" == "1" && "$SKIP_CLIENT" == "0" ]]; then
  log "npm ci + client build tier=${CLIENT_TIER} (no-cache=${NO_CACHE})..."
  (
    cd "${UI_DIR}"
    export HUSKY=0
    unset NODE_ENV
    # devDependencies (typescript, app-builder) required for compile; omit only at runtime in image.
    npm ci --ignore-scripts --no-audit --no-fund --prefer-online
    npm install exceljs@4.4.0 puppeteer@22.15.0 pdf-lib@1.17.1 --no-save --no-audit --no-fund --prefer-online
    patch_gravity_charts_legend
    bash "${SCRIPT_DIR}/patch-gravity-charts-repka.sh" "${UI_DIR}"
    ./node_modules/.bin/tsc src/i18n/prepare-keysets/index.ts --esModuleInterop --outDir dist/i18n
    node dist/i18n/prepare-keysets/index.js
    export NODE_ENV=production NODE_OPTIONS=--max_old_space_size=4096 APP_BUILDER_CDN=false
    ./node_modules/.bin/app-builder build
    # Upstream layout links /build/fonts.css; without this file Express returns signin HTML (white screen).
    mkdir -p "${UI_DIR}/dist/public/build"
    cp -f "${UI_DIR}/node_modules/@gravity-ui/uikit/styles/fonts.css" \
      "${UI_DIR}/dist/public/build/fonts.css"
  )
  bash "${SCRIPT_DIR}/verify-corp-client-bundle.sh" "${UI_DIR}"
else
  log "server-only (YDL_UI_CLIENT_TIER=none)..."
  if [[ ! -d "${UI_DIR}/node_modules/typescript" ]]; then
    (cd "${UI_DIR}" && npm ci --ignore-scripts --no-audit --no-fund)
  fi
  (
    cd "${UI_DIR}"
    ./node_modules/.bin/tsc src/i18n/prepare-keysets/index.ts --esModuleInterop --outDir dist/i18n
    node dist/i18n/prepare-keysets/index.js
    npx tsc -p src/server/tsconfig.json
  )
fi

log "base=${BASE_TAG} -> ${OUT_TAG} tier=${CLIENT_TIER}"
CID="$(docker create "$BASE_TAG")"

if [[ "$CLIENT_BUILD" == "1" && -d "${UI_DIR}/dist/public" ]]; then
  # Official base already ships dist/public/build/i18n/*.js — docker cp only adds files.
  # Stale ru.*.js without corp keys breaks i18n (UI shows raw label_customization_profile).
  docker start "${CID}" >/dev/null
  docker exec -u 0 "${CID}" sh -c 'chmod -R u+w /opt/app/dist/public /opt/app/dist/i18n /opt/app/dist/ui 2>/dev/null || true; rm -rf /opt/app/dist/public /opt/app/dist/i18n /opt/app/dist/ui' || true
  docker stop "${CID}" >/dev/null
  copy_overlay "${UI_DIR}/dist/public/." /opt/app/dist/public/
  copy_overlay "${UI_DIR}/dist/i18n/." /opt/app/dist/i18n/ 2>/dev/null || true
  copy_overlay "${UI_DIR}/dist/ui/." /opt/app/dist/ui/ 2>/dev/null || true
  if [[ -f "${OVERLAY_PLATFORM}/assets/favicorn.64x64.svg" ]]; then
    copy_overlay "${OVERLAY_PLATFORM}/assets/favicorn.64x64.svg" /opt/app/dist/public/favicorn.64x64.svg
  fi
  if [[ -f "${OVERLAY_PLATFORM}/assets/favicorn.48x48.svg" ]]; then
    copy_overlay "${OVERLAY_PLATFORM}/assets/favicorn.48x48.svg" /opt/app/dist/public/favicorn.48x48.svg
  fi
  if [[ -f "${OVERLAY_PLATFORM}/assets/ydl-early-guards.js" ]]; then
    copy_overlay "${OVERLAY_PLATFORM}/assets/ydl-early-guards.js" /opt/app/dist/public/ydl-early-guards.js
  fi
fi

# Corp server overlay: fail fast if flight-groups / ru locale build artifacts missing.
for required in \
  server/controllers/flight-groups-editor.js \
  server/modes/opensource/routes.js \
  server/modes/opensource/ydl-extra-routes.js \
  server/configs/opensource/common.js \
  ; do
  if [[ ! -f "${UI_DIR}/dist/${required}" ]]; then
    log "ERROR: missing dist/${required} — run full corp client build (YDL_UI_CLIENT_TIER=corp)"
    exit 1
  fi
done
if ! grep -q 'Language.Ru' "${UI_DIR}/dist/server/configs/opensource/common.js"; then
  log "ERROR: ydl-config defaultLang Ru not in dist/server/configs/opensource/common.js"
  exit 1
fi
if ! grep -q 'getYdlExtraRoutes' "${UI_DIR}/dist/server/modes/opensource/routes.js"; then
  log "ERROR: ydl-routes not wired in dist/server/modes/opensource/routes.js"
  exit 1
fi
if ! grep -q 'TABLE_BODY_COLUMN_REYS_BG' "${UI_DIR}/dist/server/modes/charts/plugins/constants/misc.js"; then
  log "ERROR: corp table constants missing in dist/server/modes/charts/plugins/constants/misc.js"
  exit 1
fi

for rel in \
  server/components/auth \
  server/components/layout \
  server/controllers/dl-main.js \
  server/components/sdk/us-universal.js \
  server/components/charts-engine/controllers \
  server/components/charts-engine/components/mssql-params.js \
  server/components/charts-engine/components/processor \
  server/modes/opensource \
  server/modes/charts/plugins/datalens/url/build-request-body \
  server/modes/charts/plugins/datalens/url/helpers \
  server/modes/charts/plugins/control \
  server/modes/charts/plugins/constants \
  server/modes/charts/plugins/datalens/preparers \
  server/utils \
  shared/modules/wizard \
  shared/modules/charts-shared.js \
  shared/modules/flat-table-row-tree-state.js \
  shared/modules/repka-dataset-parameters \
  shared/modules/encode-entry-id.js \
  server/controllers/flight-groups-editor.js \
  server/controllers/xlsx-converter.js \
  server/controllers/xlsx-pivot-layout.js \
  server/controllers/print-entry.js \
  server/configs/opensource/common.js \
  shared/modules/charts-shared.js \
  ; do
  src="${UI_DIR}/dist/${rel}"
  [[ -e "$src" ]] || continue
  if [[ -d "$src" ]]; then
    copy_overlay "${src}/." "/opt/app/dist/${rel}/"
  else
    copy_overlay "$src" "/opt/app/dist/${rel}"
  fi
done

docker start "$CID" >/dev/null
if [[ -f "${UI_DIR}/dist/server/controllers/print-entry.js" ]] || [[ -f "${UI_DIR}/dist/server/controllers/flight-groups-editor.js" ]]; then
  log "install runtime deps: mssql, exceljs, puppeteer, pdf-lib + Chromium system libraries"
  docker exec -u 0 "$CID" mkdir -p /opt/app/.cache/puppeteer 2>/dev/null || true
  docker exec -u 0 "$CID" sh -c 'export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq \
      ca-certificates fonts-liberation \
      libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libcairo2 libcups2t64 \
      libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 libglib2.0-0t64 libgtk-3-0t64 \
      libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
      libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
      libxrender1 libxshmfence1 libxss1 libxtst6 libxkbcommon0 libatspi2.0-0t64 \
    || apt-get install -y -qq \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 \
      libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
      libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 \
      libxfixes3 libxi6 libxrandr2 libxrender1 libxshmfence1 libxss1 libxtst6 libxkbcommon0 \
      libatspi2.0-0'
  docker exec -u 0 "$CID" npm install mssql@10.0.4 exceljs@4.4.0 puppeteer@22.15.0 pdf-lib@1.17.1 --omit=dev --prefix /opt/app
  docker exec -u 0 "$CID" sh -c 'export PUPPETEER_CACHE_DIR=/opt/app/.cache/puppeteer HOME=/opt/app && cd /opt/app && npx puppeteer browsers install chrome'
  docker exec -u 0 "$CID" sh -c 'mkdir -p /opt/app/.config/puppeteer /opt/app/.cache/puppeteer && chown -R app:app /opt/app/.config /opt/app/.cache 2>/dev/null || chown -R 1001:1001 /opt/app/.config /opt/app/.cache'
  if ! docker exec -u 0 "$CID" sh -c 'export PUPPETEER_CACHE_DIR=/opt/app/.cache/puppeteer HOME=/opt/app && cd /opt/app && node -e "
const p=require(\"puppeteer\");
const ep=p.executablePath();
if(!ep||!require(\"fs\").existsSync(ep)) { console.error(\"missing chrome binary\"); process.exit(2); }
p.launch({headless:true,executablePath:ep,args:[\"--no-sandbox\",\"--disable-setuid-sandbox\",\"--disable-dev-shm-usage\"]}).then(async b=>{await b.close();}).catch(e=>{console.error(e.message);process.exit(3);});
"'; then
    log "ERROR: puppeteer chrome launch failed during image build — abort"
    docker rm -f "$CID" >/dev/null
    exit 1
  fi
fi
docker stop "$CID" >/dev/null

docker start "${CID}" >/dev/null
if ! docker exec "${CID}" test -f /opt/app/dist/server/controllers/flight-groups-editor.js; then
  log "ERROR: flight-groups-editor.js not in image layer — abort"
  docker rm -f "${CID}" >/dev/null
  exit 1
fi
if ! docker exec "${CID}" grep -q 'getYdlExtraRoutes' /opt/app/dist/server/modes/opensource/routes.js; then
  log "ERROR: ydl-extra routes not in image — abort"
  docker rm -f "${CID}" >/dev/null
  exit 1
fi
if ! docker exec "${CID}" grep -q 'Language.Ru' /opt/app/dist/server/configs/opensource/common.js; then
  log "ERROR: defaultLang Ru not in image common.js — abort"
  docker rm -f "${CID}" >/dev/null
  exit 1
fi
docker stop "${CID}" >/dev/null

docker commit "$CID" "$OUT_TAG" >/dev/null
docker rm "$CID" >/dev/null

bash "$(dirname "$0")/sync-official-image-pins.sh" >/dev/null
source "${OVERLAY_PLATFORM}/.official-images.env"
cat >"${OVERLAY_PLATFORM}/.ydl-built-images.env" <<EOF
# Generated by integration/publish-ui-overlay-dist.sh
YDL_UI_IMAGE=${OUT_TAG}
YDL_AUTH_IMAGE=${OFFICIAL_AUTH_IMAGE}
YDL_US_IMAGE=${OFFICIAL_US_IMAGE}
YDL_BUILD_SHA=${GIT_SHA}
YDL_OFFICIAL_STACK=1
YDL_UI_CLIENT_TIER=${CLIENT_TIER}
YDL_BUILD_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)
YDL_BUILD_UTC_TAG=${BUILD_UTC_TAG}
OFFICIAL_US_IMAGE=${OFFICIAL_US_IMAGE}
OFFICIAL_AUTH_IMAGE=${OFFICIAL_AUTH_IMAGE}
EOF

log "Wrote ${OVERLAY_PLATFORM}/.ydl-built-images.env"
log "OK ${OUT_TAG} (upstream client tier=${CLIENT_TIER})"
