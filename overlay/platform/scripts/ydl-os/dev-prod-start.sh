#!/usr/bin/env bash
# Production build на хосте + npm run start (как раньше dev-ui-start.sh).
# Только перед выкладкой или когда нужен точный prod-бандл; долго и жрёт RAM.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/ydl-os-dev-lib.sh
source "$SCRIPT_DIR/lib/ydl-os-dev-lib.sh"

: "${NODE_OPTIONS:=}"
case "$NODE_OPTIONS" in
  *max-old-space-size*) ;;
  *) export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=8192" ;;
esac

if [[ ! -f "$COMPOSE_DIR/.env" ]]; then
  echo "ERROR: $COMPOSE_DIR/.env not found"
  exit 1
fi

ydl_ensure_dirs
ydl_stop_ui_process
ydl_prepare_ui_worktree

FETCH_UPSTREAM="${FETCH_UPSTREAM:-1}"
RELEASE_VERSION="$(ydl_sync_release_version)"
ydl_log "RELEASE_VERSION=$RELEASE_VERSION"

ydl_ensure_npm_deps
ydl_write_ui_env "$RELEASE_VERSION"

ydl_log "stop compose stack during build (free RAM)"
cd "$COMPOSE_DIR"
ydl_compose
"${COMPOSE[@]}" stop 2>/dev/null || true

cd "$UI_DIR"
: >"$LOG_FILE"
ydl_log "production build (client+server) — see $LOG_FILE"
if ! npm run i18n:prepare >>"$LOG_FILE" 2>&1; then
  tail -40 "$LOG_FILE"
  exit 1
fi
if ! NODE_ENV=production APP_BUILDER_CDN=false ./node_modules/.bin/app-builder build >>"$LOG_FILE" 2>&1; then
  ydl_log "ERROR: build failed"
  tail -80 "$LOG_FILE"
  exit 1
fi
node scripts/copy-public-assets.js >>"$LOG_FILE" 2>&1

ydl_docker_stack_up
ydl_ui_prepare_ports

ydl_log "npm run start on APP_PORT=$DEV_CLIENT_PORT"
nohup env NODE_OPTIONS="$NODE_OPTIONS" NODE_ENV=production APP_PORT="$DEV_CLIENT_PORT" npm run start >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

ydl_check_backends
ydl_wait_http "http://127.0.0.1:$DEV_CLIENT_PORT/ping" "UI prod" 60 || true

ydl_write_stamp "dev-prod" "prebuilt" "$RELEASE_VERSION"

ydl_log "=== dev prod (build+start) ready ==="
ydl_log "Open: http://127.0.0.1/"
ydl_log "Daily dev: bash $SCRIPT_DIR/dev-start.sh"
