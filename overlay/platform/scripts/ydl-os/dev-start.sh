#!/usr/bin/env bash
# Быстрый dev: кастомный UI с HMR (npm run dev), Docker-бэкенд как в prod.
# Правки в src/ — сразу в браузере (http://127.0.0.1/ → host :8080).
# На хост проброшены те же точки, что нужны для скриптов/отладки:
#   PG 5432  US 8030  AUTH 8088  control 8010  data 8020  ui-api 3040  meta 3050
#
# Использование:
#   bash scripts/ydl-os/dev-start.sh
#   bash scripts/ydl-os/dev-stop.sh
#
# Production-сборка перед выкладкой:
#   bash scripts/ydl-os/dev-prod-start.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/ydl-os-dev-lib.sh
source "$SCRIPT_DIR/lib/ydl-os-dev-lib.sh"

: "${NODE_OPTIONS:=}"
case "$NODE_OPTIONS" in
  *max-old-space-size*) ;;
  *) export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--max-old-space-size=4096" ;;
esac

if [[ ! -f "$COMPOSE_DIR/.env" ]]; then
  echo "ERROR: $COMPOSE_DIR/.env not found"
  exit 1
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: node/npm required"
  exit 1
fi

ydl_ensure_dirs
ydl_stop_ui_process
ydl_prepare_ui_worktree

RELEASE_VERSION="$(ydl_sync_release_version)"
ydl_log "RELEASE_VERSION=$RELEASE_VERSION (FETCH_UPSTREAM=${FETCH_UPSTREAM:-0})"

ydl_ensure_npm_deps
ydl_write_ui_env "$RELEASE_VERSION"
ydl_docker_stack_up
ydl_ui_prepare_ports

: >"$LOG_FILE"
cd "$UI_DIR"

ydl_log "starting npm run dev (client :$DEV_CLIENT_PORT, API :$DEV_SERVER_PORT) — log: $LOG_FILE"
nohup env NODE_OPTIONS="$NODE_OPTIONS" npm run dev >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

ydl_check_backends
# Первый запуск Rspack: 3–8 мин; ждём API :3030, затем клиент :8080
ydl_wait_http "http://127.0.0.1:$DEV_SERVER_PORT/ping" "UI API" 120 || true
ydl_wait_http "http://127.0.0.1:$DEV_CLIENT_PORT/ping" "UI dev client" 240 || true
curl -sf -o /dev/null "http://127.0.0.1/ping" 2>/dev/null && ydl_log "edge nginx OK http://127.0.0.1/" || true

if ! ydl_verify_dev_log; then
  ydl_log "dev-start FAILED — fix log errors and re-run dev-start.sh"
  exit 1
fi

ydl_write_stamp "dev-hmr" "app-builder-dev" "$RELEASE_VERSION"

ydl_log "=== dev HMR started ==="
ydl_log "Open: http://127.0.0.1/  (nginx → host :$DEV_CLIENT_PORT)"
ydl_log "Login: admin / qwe-123  (viewer: user / qwe-123)"
ydl_log "DB/scripts: PGHOST=127.0.0.1 PGPORT=5432 (пароль в $COMPOSE_DIR/.env)"
ydl_log "Logs: tail -f $LOG_FILE"
ydl_log "Stop: bash $SCRIPT_DIR/dev-stop.sh"
ydl_log "Prod build: bash $SCRIPT_DIR/dev-prod-start.sh"
