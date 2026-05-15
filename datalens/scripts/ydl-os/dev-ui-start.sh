#!/usr/bin/env bash
set -euo pipefail

# Поднимает dev UI (npm run dev + HMR) против prod-бэкенда в Docker.
# Браузер: http://<host>/ (порт 80 → nginx → dev UI на host:8080).

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/ydl-os}"
UI_DIR="${UI_DIR:-$REPO_ROOT/components/datalens-ui}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/dev-ui}"
PID_FILE="$REPORT_DIR/dev-ui.pid"
LOG_FILE="$REPORT_DIR/dev-ui.log"
STAMP_FILE="$REPORT_DIR/dev-ui.mode"

DEV_CLIENT_PORT="${DEV_CLIENT_PORT:-8080}"
DEV_SERVER_PORT="${DEV_SERVER_PORT:-3030}"
# Версия как в datalens-tech/datalens (upstream versions-config.json → releaseVersion)
RELEASE_VERSION="${RELEASE_VERSION:-2.9.0}"

export PATH="/home/g.stepanov/.local/bin:$PATH"

mkdir -p "$REPORT_DIR"

log "sync dev-ui compose/nginx into $COMPOSE_DIR"
install -d "$COMPOSE_DIR/nginx"
install -m 0644 "$REPO_ROOT/datalens/docker-compose.dev-ui.yaml" "$COMPOSE_DIR/docker-compose.dev-ui.yaml"
install -m 0644 "$REPO_ROOT/datalens/nginx/nginx-edge-proxy-dev.conf" "$COMPOSE_DIR/nginx/nginx-edge-proxy-dev.conf"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

if [[ ! -f "$COMPOSE_DIR/.env" ]]; then
  echo "ERROR: $COMPOSE_DIR/.env not found"
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: node/npm required for dev UI"
  exit 1
fi

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    log "stopping previous dev-ui pid=$OLD_PID"
    kill "$OLD_PID" 2>/dev/null || true
    sleep 2
  fi
  rm -f "$PID_FILE"
fi

# Версия платформы = upstream release
if grep -q '^RELEASE_VERSION=' "$COMPOSE_DIR/.env"; then
  sed -i "s/^RELEASE_VERSION=.*/RELEASE_VERSION=$RELEASE_VERSION/" "$COMPOSE_DIR/.env"
else
  echo "RELEASE_VERSION=$RELEASE_VERSION" >> "$COMPOSE_DIR/.env"
fi

US_MASTER_TOKEN="$(grep '^US_MASTER_TOKEN=' "$COMPOSE_DIR/.env" | cut -d= -f2- | tr -d '"' || true)"
US_MASTER_TOKEN="${US_MASTER_TOKEN:-us-master-token}"
SERVICE_NAME="$(grep '^SERVICE_NAME=' "$COMPOSE_DIR/.env" | cut -d= -f2- | tr -d '"' || true)"
SERVICE_NAME="${SERVICE_NAME:-Aeronavigator BI}"

log "install npm deps (if needed) in $UI_DIR"
cd "$UI_DIR"
if [[ ! -d node_modules ]]; then
  npm ci
fi

cat > "$UI_DIR/.env" <<EOF
APP_ENV=development
APP_INSTALLATION=opensource
APP_MODE=full
RELEASE_VERSION=$RELEASE_VERSION
SERVICE_NAME=$SERVICE_NAME
US_ENDPOINT=http://127.0.0.1:8030
BI_API_ENDPOINT=http://127.0.0.1:8010
BI_DATA_ENDPOINT=http://127.0.0.1:8020
AUTH_ENDPOINT=http://127.0.0.1:8088
US_MASTER_TOKEN=$US_MASTER_TOKEN
DEV_CLIENT_PORT=$DEV_CLIENT_PORT
DEV_SERVER_PORT=$DEV_SERVER_PORT
EOF

COMPOSE=(docker compose -f "$COMPOSE_DIR/docker-compose.yaml" -f "$COMPOSE_DIR/docker-compose.production.yaml" -f "$COMPOSE_DIR/docker-compose.dev-ui.yaml" --env-file "$COMPOSE_DIR/.env")

log "stop prod ui containers, switch nginx to dev upstream"
cd "$COMPOSE_DIR"
"${COMPOSE[@]}" stop ui ui-api 2>/dev/null || true
"${COMPOSE[@]}" up -d --force-recreate nginx us us-auth control-api data-api us postgres temporal meta-manager

log "start npm run dev (client :$DEV_CLIENT_PORT, api :$DEV_SERVER_PORT)"
cd "$UI_DIR"
: >"$LOG_FILE"
nohup env DEV_CLIENT_PORT="$DEV_CLIENT_PORT" DEV_SERVER_PORT="$DEV_SERVER_PORT" npm run dev >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

log "wait for dev client on 127.0.0.1:$DEV_CLIENT_PORT"
READY=0
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "http://127.0.0.1:$DEV_CLIENT_PORT/ping" 2>/dev/null; then
    READY=1
    break
  fi
  sleep 2
done

if [[ "$READY" != "1" ]]; then
  log "WARN: dev client not ready yet — check $LOG_FILE"
else
  log "dev client ready"
fi

if curl -sf -o /dev/null "http://127.0.0.1/ping" 2>/dev/null; then
  log "edge nginx OK (http://127.0.0.1/)"
else
  log "WARN: edge nginx /ping not 200 yet"
fi

cat >"$STAMP_FILE" <<EOF
mode=dev-ui
started_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
release_version=$RELEASE_VERSION
dev_client_port=$DEV_CLIENT_PORT
pid=$(cat "$PID_FILE")
log=$LOG_FILE
EOF

log "=== dev-ui started ==="
log "Open: http://127.0.0.1/ (or your server IP on port 80)"
log "Logs: tail -f $LOG_FILE"
log "Stop: bash $REPO_ROOT/datalens/scripts/ydl-os/dev-ui-stop.sh"
