#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/ydl-os}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/dev-ui}"
PID_FILE="$REPORT_DIR/dev-ui.pid"
STAMP_FILE="$REPORT_DIR/dev-ui.mode"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    log "stop dev-ui npm pid=$PID"
    kill "$PID" 2>/dev/null || true
    sleep 2
    kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

# Убить дочерние node dev-процессы на портах dev (на случай orphan)
pkill -f "app-builder dev" 2>/dev/null || true

COMPOSE_PROD=(docker compose -f "$COMPOSE_DIR/docker-compose.yaml" -f "$COMPOSE_DIR/docker-compose.production.yaml" --env-file "$COMPOSE_DIR/.env")

log "restore prod ui + nginx"
cd "$COMPOSE_DIR"
"${COMPOSE_PROD[@]}" up -d --force-recreate ui ui-api nginx

rm -f "$STAMP_FILE"

log "=== dev-ui stopped, prod ui restored ==="
