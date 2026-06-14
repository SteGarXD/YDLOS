#!/usr/bin/env bash
# Full platform finalization: P0–P2 gates, build, deploy, cleanup.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

export PATH="/home/g.stepanov/.local/bin:$PATH"
COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
BUILD_IMAGES="${BUILD_IMAGES:-1}"
GIT_SHA="$(git -C "$YDL_REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo local)"
VC="${VENDOR_DATALENS}/versions-config.json"
UI_V="$(jq -r .uiVersion "$VC")"
AUTH_V="$(jq -r .authVersion "$VC")"
US_V="$(jq -r .version "${OVERLAY_COMPONENTS}/datalens-us/package.json")"
PREFIX="${YDL_IMAGE_PREFIX:-akrasnov87}"
UI_TAG="${UI_TAG:-${PREFIX}/datalens-ui:${UI_V}-ydl-${GIT_SHA}}"
AUTH_TAG="${AUTH_TAG:-${PREFIX}/datalens-auth:${AUTH_V}-ydl-${GIT_SHA}}"
US_TAG="${US_TAG:-${PREFIX}/datalens-us:${US_V}-ydl-${GIT_SHA}}"

log() { echo "[finalize $(date -u +%H:%M:%S)] $*"; }

log "=== YDL OS platform finalization ==="

log "[1] server cleanup"
bash "$(dirname "$0")/server-cleanup.sh"

log "[2] verify vendor + profiles"
bash "$(dirname "$0")/verify-vendor-pristine.sh"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" validate \
  --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" drift-check \
  --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted" \
  > "$OVERLAY_PLATFORM/reports/profiles/drift-$(date -u +%Y%m%d-%H%M%SZ).md" || true

log "[3] security scan (running images)"
ENFORCE_CRITICAL=0 FAIL_ON_REGRESSION=1 \
  bash "$YDL_SCRIPTS/security-image-scan.sh" || true

log "[4] build overlay images (when BUILD_IMAGES=1)"
if [[ "$BUILD_IMAGES" == "1" ]]; then
  if [[ -d "$OVERLAY_COMPONENTS/datalens-ui" ]]; then
    log "npm ci UI (may take several minutes)"
    (cd "$OVERLAY_COMPONENTS/datalens-ui" && npm ci --no-audit --no-fund) || log "WARN: npm ci failed — using existing UI image tag"
  fi
  UI_TAG="$UI_TAG" AUTH_TAG="$AUTH_TAG" US_TAG="$US_TAG" \
    bash "$(dirname "$0")/build.sh" || log "WARN: image build failed — redeploy with pinned tags"
fi

log "[5] clean deploy to $COMPOSE_DIR"
bash "$(dirname "$0")/deploy-clean-prod.sh"

log "[6] post-deploy: profiles + repka"
sleep 15
cd ${YDL_COMPOSE_DIR}
# shellcheck disable=SC1091
source "${YDL_REPO_ROOT}/integration/lib/compose-files.sh"
mapfile -t _fc < <(ydl_compose_files "${YDL_REPO_ROOT}" "${YDL_COMPOSE_DIR}")
docker compose --env-file ${YDL_COMPOSE_DIR}/.env "${_fc[@]}" \
  -f ${YDL_COMPOSE_DIR}/compose/docker-compose.host-ports.yaml up -d postgres 2>/dev/null || true
sleep 5
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" sync \
  --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted" --apply || true
log "[6b] repka mass DB patch: skipped (removed — edit dashboards in DataLens UI)"

log "[7] reader journey gate (optional)"
if [[ "${READER_GATE:-1}" == "1" ]] && [[ -d "$OVERLAY_COMPONENTS/datalens-ui/tests" ]]; then
  (
    cd "$OVERLAY_COMPONENTS/datalens-ui/tests"
    export E2E_DOMAIN="${E2E_DOMAIN:-http://127.0.0.1}"
    export E2E_NO_AUTH="${E2E_NO_AUTH:-1}"
    if [[ -f package.json ]]; then
      npm ci --no-audit --no-fund 2>/dev/null || true
      bash scripts/run-reader-journey-gate.sh
    fi
  ) || log "WARN: reader gate failed or skipped"
fi

log "[8] backup drill snapshot"
BACKUP_DRILL="/opt/backups/drill-$(date -u +%Y%m%d-%H%M%SZ)"
mkdir -p "$BACKUP_DRILL"
docker exec datalens-postgres-prod pg_dumpall -U pg-user 2>/dev/null | gzip -c > "$BACKUP_DRILL/pg-all.sql.gz" || true
cp -a "$COMPOSE_DIR/.env" "$BACKUP_DRILL/.env" 2>/dev/null || true
log "backup drill: $BACKUP_DRILL"

log "[9] governance report"
python3 "$YDL_SCRIPTS/platform-governance-report.py" --repo-root "$YDL_REPO_ROOT"

log "[10] install cron (autopilot + drift)"
bash "$YDL_SCRIPTS/install-platform-cron.sh" || true

log "=== FINALIZATION COMPLETE ==="
curl -s -o /dev/null -w "ping=%{http_code}\n" http://127.0.0.1/ping || true
