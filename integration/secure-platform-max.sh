#!/usr/bin/env bash
# Super-security pipeline: secrets scan, hardened builds, deploy, compose hardening, trivy gate.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
export PATH="/home/g.stepanov/.local/bin:$PATH"

COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
ENFORCE_CRITICAL="${ENFORCE_CRITICAL:-1}"
IGNORE_STATUS_FIXED="${IGNORE_STATUS_FIXED:-1}"
FAIL_ON_REGRESSION="${FAIL_ON_REGRESSION:-1}"
IGNORE_UNFIXED="${IGNORE_UNFIXED:-1}"

log() { echo "[secure-max $(date -u +%H:%M:%S)] $*"; }

log "=== YDL super-security pipeline ==="

log "[1] secret leak scan (must pass)"
bash "$YDL_SCRIPTS/security-secrets-check.sh"

log "[2] sync official image pins + build overlay from sources"
bash "$(dirname "$0")/sync-official-image-pins.sh"
bash "$(dirname "$0")/build-hardened.sh"

log "[3] quality gate (lint + max tests)"
bash "$(dirname "$0")/lint-overlay-full.sh"
bash "$(dirname "$0")/test-overlay-max.sh"

log "[4] deploy with official + ydl-built + security hardening"
DEPLOY_LOCAL=1 BUILD_IMAGES=0 VENDOR_REF=main SYNC_PROFILES=0 PATCH_REPKA=0 \
  bash "$(dirname "$0")/release-full.sh"

if [[ -f "$OVERLAY_PLATFORM/compose/docker-compose.security-hardening.yaml" ]]; then
  install -m 0644 "$OVERLAY_PLATFORM/compose/docker-compose.security-hardening.yaml" \
    "$COMPOSE_DIR/compose/docker-compose.security-hardening.yaml"
  cd "$COMPOSE_DIR"
  # shellcheck disable=SC1090
  set -a && source .env && set +a
  docker compose --env-file .env \
    -f docker-compose.yaml \
    -f docker-compose.production.yaml \
    -f compose/docker-compose.official-images.yaml \
    -f compose/docker-compose.ydl-built-images.yaml \
    -f compose/docker-compose.security-hardening.yaml \
    up -d 2>&1 | tail -20
fi

log "[5] trivy scan (regression gate)"
FAIL_ON_REGRESSION="$FAIL_ON_REGRESSION" ENFORCE_CRITICAL="$ENFORCE_CRITICAL" \
  IGNORE_UNFIXED="$IGNORE_UNFIXED" \
  bash "$YDL_SCRIPTS/security-image-scan.sh"

log "[6] BI future gap report"
python3 "$(dirname "$0")/compute-bi-future-gap.py"

log "=== secure-platform-max done ==="
curl -s -o /dev/null -w "ping=%{http_code}\n" http://127.0.0.1/ping || true
