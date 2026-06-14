#!/usr/bin/env bash
# Full YDL OS release: vendor bump + overlay build + profiles + repka + deploy + smoke.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
# shellcheck source=lib/deploy-runtime-opt.sh
source "$(dirname "$0")/lib/deploy-runtime-opt.sh"

VENDOR_REF="${VENDOR_REF:-main}"
COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
PROFILES_DIR="${PROFILES_DIR:-$OVERLAY_PLATFORM/profiles/extracted}"
DEPLOY_LOCAL="${DEPLOY_LOCAL:-1}"
BUILD_IMAGES="${BUILD_IMAGES:-1}"
SYNC_PROFILES="${SYNC_PROFILES:-1}"
PATCH_REPKA="${PATCH_REPKA:-0}"
ROLLBACK_ON_FAIL="${ROLLBACK_ON_FAIL:-1}"

TS="$(date -u +%Y%m%d-%H%M%SZ)"
LOG="$OVERLAY_PLATFORM/reports/release-full-${TS}.log"
mkdir -p "$(dirname "$LOG")"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG"; }

rollback_stack() {
  log "ROLLBACK: restoring previous compose state if stamp exists"
  if [[ -f "$COMPOSE_DIR/.ydl-deploy-previous" ]]; then
    # shellcheck disable=SC1090
    source "$COMPOSE_DIR/.ydl-deploy-previous"
    log "previous stamp: $PREV_COMMIT"
  fi
  if docker compose version >/dev/null 2>&1 && [[ -f "$COMPOSE_DIR/docker-compose.yaml" ]]; then
    (cd "$COMPOSE_DIR" && docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d) \
      | tee -a "$LOG" || true
  fi
}

on_fail() {
  log "RELEASE FAILED"
  if [[ "$ROLLBACK_ON_FAIL" == "1" ]]; then
    rollback_stack
  fi
  exit 1
}
trap on_fail ERR

log "=== YDL OS full release ==="
log "vendor_ref=$VENDOR_REF profiles=$PROFILES_DIR compose_dir=$COMPOSE_DIR"

log "[1/10] verify vendor pristine"
bash "$(dirname "$0")/verify-vendor-pristine.sh" | tee -a "$LOG"

log "[2/10] bump vendor to $VENDOR_REF"
bash "$(dirname "$0")/update-vendor.sh" "$VENDOR_REF" | tee -a "$LOG"

log "[3/10] upstream sync report"
bash "$YDL_SCRIPTS/sync-platform-upstream.sh" | tee -a "$LOG" || true

log "[4/10] validate dashboard profiles"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" validate --profiles-dir "$PROFILES_DIR" | tee -a "$LOG"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" compile \
  --profiles-dir "$PROFILES_DIR" \
  --out "$OVERLAY_PLATFORM/reports/profiles/bundle-${TS}.json" | tee -a "$LOG"

if [[ "$SYNC_PROFILES" == "1" ]]; then
  log "[5/10] sync profiles to US (apply)"
  python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" sync --profiles-dir "$PROFILES_DIR" --apply \
    | tee -a "$LOG" || log "WARN: profile sync skipped (DB unavailable?)"
else
  log "[5/10] skip profile sync"
fi

if [[ "$PATCH_REPKA" == "1" ]]; then
  log "[6/10] WARN: PATCH_REPKA=1 ignored — mass US patch scripts removed; use DataLens UI or repka-platform-healthcheck.py"
else
  log "[6/10] skip repka DB patch (scripts removed)"
fi

if [[ "$BUILD_IMAGES" == "1" ]]; then
  log "[7/10] build overlay images"
  bash "$(dirname "$0")/build.sh" | tee -a "$LOG"
  bash "$(dirname "$0")/build-hardened-vendor-images.sh" | tee -a "$LOG"
else
  log "[7/10] skip image build"
fi

if [[ "$DEPLOY_LOCAL" == "1" && -d "$COMPOSE_DIR" ]]; then
  log "[8/10] deploy to $COMPOSE_DIR"
  PREV="$(cat "$COMPOSE_DIR/.ydl-deploy-source" 2>/dev/null || echo none)"
  echo "PREV_COMMIT=$PREV" > "$COMPOSE_DIR/.ydl-deploy-previous"

  deploy_runtime_to_compose_dir "$OVERLAY_PLATFORM" "$COMPOSE_DIR" "$VENDOR_DATALENS"
  # Remove legacy full-tree artifacts from previous layouts (docs, ps1, backups, terraform, …)
  find "$COMPOSE_DIR" -maxdepth 1 -type f \( -name '*.md' -o -name '*.ps1' -o -name 'backup.sql' \) -delete 2>/dev/null || true
  rm -rf "$COMPOSE_DIR/backups" "$COMPOSE_DIR/terraform" "$COMPOSE_DIR/helm" \
    "$COMPOSE_DIR/profiles" "$COMPOSE_DIR/reports" "$COMPOSE_DIR/scripts" \
    "$COMPOSE_DIR/.github" "$COMPOSE_DIR/postgres" "$COMPOSE_DIR/temporal" \
    "$COMPOSE_DIR/keep-features-backup" "$COMPOSE_DIR/docs" "$COMPOSE_DIR/governance" 2>/dev/null || true
  rm -f "$COMPOSE_DIR"/docker-compose.debug.yaml "$COMPOSE_DIR"/docker-compose.demo.yaml \
    "$COMPOSE_DIR"/docker-compose.dev-ui.yaml "$COMPOSE_DIR"/docker-compose.local-dev.yaml \
    "$COMPOSE_DIR"/docker-compose.own-images.yaml "$COMPOSE_DIR"/docker-compose.test-ui-only.yaml \
    "$COMPOSE_DIR"/LICENSE "$COMPOSE_DIR"/init.sh "$COMPOSE_DIR"/security-baseline.json 2>/dev/null || true
  if [[ ! -f "$COMPOSE_DIR/.env" ]]; then
    cp "$OVERLAY_PLATFORM/.env.example" "$COMPOSE_DIR/.env"
    sed -i 's/^APP_ENV=.*/APP_ENV=prod/' "$COMPOSE_DIR/.env" || echo 'APP_ENV=prod' >> "$COMPOSE_DIR/.env"
  fi
  grep -q '^YDL_LEGACY_AUTH=' "$COMPOSE_DIR/.env" 2>/dev/null && \
    sed -i 's/^YDL_LEGACY_AUTH=.*/YDL_LEGACY_AUTH=0/' "$COMPOSE_DIR/.env" || \
    echo 'YDL_LEGACY_AUTH=0' >>"$COMPOSE_DIR/.env"
  grep -q '^YDL_OFFICIAL_AUTH=' "$COMPOSE_DIR/.env" 2>/dev/null && \
    sed -i 's/^YDL_OFFICIAL_AUTH=.*/YDL_OFFICIAL_AUTH=1/' "$COMPOSE_DIR/.env" || \
    echo 'YDL_OFFICIAL_AUTH=1' >>"$COMPOSE_DIR/.env"
  grep -q '^NODE_RPC_URL=' "$COMPOSE_DIR/.env" 2>/dev/null && sed -i '/^NODE_RPC_URL=/d' "$COMPOSE_DIR/.env" || true
  grep -q '^USE_AUTH_DATA=' "$COMPOSE_DIR/.env" 2>/dev/null && sed -i '/^USE_AUTH_DATA=/d' "$COMPOSE_DIR/.env" || true
  grep -q '^AUTH_ADMIN_PASSWORD=' "$COMPOSE_DIR/.env" 2>/dev/null || \
    echo 'AUTH_ADMIN_PASSWORD=qwe-123' >>"$COMPOSE_DIR/.env"

  bash "$(dirname "$0")/sync-official-image-pins.sh" | tee -a "$LOG"
  install -m 0644 "$OVERLAY_PLATFORM/.official-images.env" "$COMPOSE_DIR/.official-images.env"
  install -m 0644 "$OVERLAY_PLATFORM/compose/docker-compose.official-images.yaml" \
    "$COMPOSE_DIR/compose/docker-compose.official-images.yaml"
  grep -q '^OFFICIAL_' "$COMPOSE_DIR/.env" 2>/dev/null && sed -i '/^OFFICIAL_/d' "$COMPOSE_DIR/.env" || true
  grep -q '^YDL_POSTGRES_IMAGE=' "$COMPOSE_DIR/.env" 2>/dev/null && sed -i '/^YDL_POSTGRES_IMAGE=/d;/^YDL_TEMPORAL_IMAGE=/d' "$COMPOSE_DIR/.env" || true
  cat "$OVERLAY_PLATFORM/.official-images.env" >>"$COMPOSE_DIR/.env"
  if [[ -f "$OVERLAY_PLATFORM/.ydl-hardened-vendor.env" ]]; then
    cat "$OVERLAY_PLATFORM/.ydl-hardened-vendor.env" >>"$COMPOSE_DIR/.env"
  fi

  if [[ -f "$OVERLAY_PLATFORM/.ydl-built-images.env" ]]; then
    # shellcheck disable=SC1090
    set -a && source "$OVERLAY_PLATFORM/.ydl-built-images.env" && set +a
    install -m 0644 "$OVERLAY_PLATFORM/.ydl-built-images.env" "$COMPOSE_DIR/.ydl-built-images.env"
    grep -q '^YDL_BUILD_SHA=' "$COMPOSE_DIR/.env" 2>/dev/null && \
      sed -i '/^YDL_/d' "$COMPOSE_DIR/.env" || true
    cat "$OVERLAY_PLATFORM/.ydl-built-images.env" >>"$COMPOSE_DIR/.env"
    install -m 0644 "$OVERLAY_PLATFORM/compose/docker-compose.ydl-built-images.yaml" \
      "$COMPOSE_DIR/compose/docker-compose.ydl-built-images.yaml"
  fi
  install -m 0644 "$OVERLAY_PLATFORM/compose/docker-compose.ydl-platform.yaml" \
    "$COMPOSE_DIR/compose/docker-compose.ydl-platform.yaml"
  install -m 0644 "$OVERLAY_PLATFORM/compose/docker-compose.edge-production.yaml" \
    "$COMPOSE_DIR/compose/docker-compose.edge-production.yaml"

  cd "$COMPOSE_DIR"
  mapfile -t _cf < <(
    # shellcheck disable=SC1091
    source "${YDL_REPO_ROOT}/integration/lib/compose-files.sh"
    ydl_compose_files "${YDL_REPO_ROOT}" "$COMPOSE_DIR"
  )
  COMPOSE_FILES=(--env-file .env "${_cf[@]}")
  docker compose "${COMPOSE_FILES[@]}" up -d 2>&1 | tee -a "$LOG"

  log "[8b] sync pg-user password (existing volume, no re-init)"
  bash "$YDL_SCRIPTS/sync-pg-user-password.sh" "$COMPOSE_DIR/.env" 2>&1 | tee -a "$LOG" || true
  docker compose "${COMPOSE_FILES[@]}" up -d temporal meta-manager 2>&1 | tee -a "$LOG" || true

  if [[ -f compose/docker-compose.host-ports.yaml ]]; then
    docker compose "${COMPOSE_FILES[@]}" -f compose/docker-compose.host-ports.yaml \
      up -d postgres 2>&1 | tee -a "$LOG" || true
  fi

  {
    echo "source=overlay+vendor"
    echo "commit=$(git -C "$YDL_REPO_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
    echo "vendor=$(git -C "$VENDOR_DATALENS" rev-parse HEAD 2>/dev/null || echo unknown)"
    echo "deployed_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } > "$COMPOSE_DIR/.ydl-deploy-source"
else
  log "[8/10] skip local deploy (COMPOSE_DIR missing or DEPLOY_LOCAL=0)"
fi

log "[9/10] smoke checks (wait for /ping)"
PING="000"
for _i in $(seq 1 40); do
  PING="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://127.0.0.1/ping 2>/dev/null || echo 000)"
  [[ "$PING" == "200" ]] && break
  sleep 3
done
REFRESH="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 -X POST http://127.0.0.1/gateway/auth/auth/refreshTokens -H 'Content-Type: application/json' -d '{}' 2>/dev/null || echo 000)"
REFRESH_DEMO="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 -X POST http://127.0.0.1/demo/refresh -H 'Content-Type: application/json' -d '{}' 2>/dev/null || echo 000)"
log "GET /ping -> $PING (expect 200)"
log "POST refreshTokens -> $REFRESH; POST /demo/refresh -> $REFRESH_DEMO (401 without cookie OK)"
if [[ "$PING" != "200" ]]; then
  log "smoke failed: ping"
  exit 1
fi
if [[ "$REFRESH" == "000" && "$REFRESH_DEMO" == "000" ]]; then
  log "smoke failed: auth unreachable"
  exit 1
fi

log "[10/10] governance report"
python3 "$YDL_SCRIPTS/platform-governance-report.py" --repo-root "$YDL_REPO_ROOT" | tee -a "$LOG"

log "=== RELEASE OK ==="
log "log=$LOG"
