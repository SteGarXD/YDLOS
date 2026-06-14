#!/usr/bin/env bash
# Общие функции для dev-start / dev-prod-start / dev-stop (YDL OS, кастомный UI на хосте).
set -euo pipefail

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_YDL_SCRIPTS="$(cd "${_LIB_DIR}/.." && pwd)"
_OVERLAY_PLATFORM="$(cd "${_YDL_SCRIPTS}/../.." && pwd)"
YDL_REPO_ROOT="${YDL_REPO_ROOT:-$(cd "${_OVERLAY_PLATFORM}/../.." && pwd)}"
REPO_ROOT="${REPO_ROOT:-$YDL_REPO_ROOT}"
COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
UI_DIR="${UI_DIR:-}"
REPORT_DIR="${REPORT_DIR:-$YDL_REPO_ROOT/overlay/platform/reports/dev-ui}"
PID_FILE="$REPORT_DIR/dev-ui.pid"
LOG_FILE="$REPORT_DIR/dev-ui.log"
STAMP_FILE="$REPORT_DIR/dev-ui.mode"

DEV_CLIENT_PORT="${DEV_CLIENT_PORT:-8080}"
DEV_SERVER_PORT="${DEV_SERVER_PORT:-3030}"

export PATH="/home/g.stepanov/.local/bin:$PATH"

ydl_log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

# Official tag worktree + corp overlay (HMR без docker publish).
ydl_prepare_ui_worktree() {
  if [[ -n "${UI_DIR:-}" && -f "${UI_DIR}/package.json" ]]; then
    return 0
  fi
  # shellcheck source=/dev/null
  source "${YDL_REPO_ROOT}/integration/lib/env.sh"
  # shellcheck source=/dev/null
  source "${YDL_REPO_ROOT}/integration/lib/ui-worktree.sh"
  UI_DIR="$(ensure_official_ui_worktree)"
  apply_ui_patches "$UI_DIR"
  export UI_DIR
  ydl_log "UI_DIR (overlay worktree): $UI_DIR"
}

ydl_ensure_dirs() {
  mkdir -p "$REPORT_DIR"
  install -d "$COMPOSE_DIR/nginx"
  install -m 0644 "$YDL_REPO_ROOT/overlay/platform/docker-compose.dev-ui.yaml" "$COMPOSE_DIR/docker-compose.dev-ui.yaml"
  install -m 0644 "$YDL_REPO_ROOT/overlay/platform/nginx/nginx-edge-proxy-dev.conf" "$COMPOSE_DIR/nginx/nginx-edge-proxy-dev.conf"
}

ydl_compose() {
  COMPOSE=(docker compose -f "$COMPOSE_DIR/docker-compose.yaml" -f "$COMPOSE_DIR/docker-compose.production.yaml" -f "$COMPOSE_DIR/docker-compose.dev-ui.yaml" --env-file "$COMPOSE_DIR/.env")
}

ydl_stop_ui_process() {
  if [[ -f "$PID_FILE" ]]; then
    local old_pid
    old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
      ydl_log "stopping UI pid=$old_pid"
      kill "$old_pid" 2>/dev/null || true
      sleep 2
      kill -9 "$old_pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
  pkill -f '[a]pp-builder dev' 2>/dev/null || true
  pkill -f 'node dist/server' 2>/dev/null || true
}

ydl_write_ui_env() {
  local release_version="${1:?}"
  local us_master_token service_name
  us_master_token="$(grep '^US_MASTER_TOKEN=' "$COMPOSE_DIR/.env" | cut -d= -f2- | tr -d '"' || true)"
  us_master_token="${us_master_token:-us-master-token}"
  service_name="$(grep '^SERVICE_NAME=' "$COMPOSE_DIR/.env" | cut -d= -f2- | tr -d '"' || true)"
  service_name="${service_name:-Organization BI}"

  local flight_groups_mssql=""
  local flight_groups_datasets=""
  local flight_groups_table_groups=""
  local flight_groups_table_members=""
  local flight_groups_protected=""
  if [[ -f "$COMPOSE_DIR/.env" ]]; then
    flight_groups_mssql="$(
      grep -E '^FLIGHT_GROUPS_MSSQL_CONNECTION_STRING=' "$COMPOSE_DIR/.env" 2>/dev/null \
        | head -1 | cut -d= -f2- || true
    )"
    flight_groups_datasets="$(
      grep -E '^FLIGHT_GROUPS_EDITOR_DATASET_IDS=' "$COMPOSE_DIR/.env" 2>/dev/null \
        | head -1 | cut -d= -f2- || true
    )"
    flight_groups_table_groups="$(
      grep -E '^FLIGHT_GROUPS_TABLE_GROUPS=' "$COMPOSE_DIR/.env" 2>/dev/null \
        | head -1 | cut -d= -f2- || true
    )"
    flight_groups_table_members="$(
      grep -E '^FLIGHT_GROUPS_TABLE_MEMBERS=' "$COMPOSE_DIR/.env" 2>/dev/null \
        | head -1 | cut -d= -f2- || true
    )"
    flight_groups_protected="$(
      grep -E '^FLIGHT_GROUPS_PROTECTED_GROUP_IDS=' "$COMPOSE_DIR/.env" 2>/dev/null \
        | head -1 | cut -d= -f2- || true
    )"
  fi

  cat >"$UI_DIR/.env" <<EOF
APP_ENV=development
APP_INSTALLATION=opensource
APP_MODE=full
RELEASE_VERSION=$release_version
SERVICE_NAME=$service_name
US_ENDPOINT=http://127.0.0.1:8030
BI_API_ENDPOINT=http://127.0.0.1:8010
BI_DATA_ENDPOINT=http://127.0.0.1:8020
AUTH_ENDPOINT=http://127.0.0.1:8088
US_MASTER_TOKEN=$us_master_token
UI_AUTH_ENABLED=true
AUTH_ENABLED=true
AUTH_RESOLVE_USERS_BY_IDS_ENABLED=false
DEV_CLIENT_PORT=$DEV_CLIENT_PORT
DEV_SERVER_PORT=$DEV_SERVER_PORT
WORKERS=1
${flight_groups_mssql:+FLIGHT_GROUPS_MSSQL_CONNECTION_STRING=$flight_groups_mssql}
${flight_groups_datasets:+FLIGHT_GROUPS_EDITOR_DATASET_IDS=$flight_groups_datasets}
${flight_groups_table_groups:+FLIGHT_GROUPS_TABLE_GROUPS=$flight_groups_table_groups}
${flight_groups_table_members:+FLIGHT_GROUPS_TABLE_MEMBERS=$flight_groups_table_members}
${flight_groups_protected:+FLIGHT_GROUPS_PROTECTED_GROUP_IDS=$flight_groups_protected}
EOF
}

ydl_ensure_npm_deps() {
  cd "$UI_DIR"
  if [[ ! -d node_modules ]] || [[ ! -x node_modules/.bin/tsc ]]; then
    ydl_log "npm ci (first time) in $UI_DIR"
    export HUSKY=0
    # NODE_ENV=production отрезает devDependencies (tsc, app-builder).
    (unset NODE_ENV; npm ci --ignore-scripts --no-audit --no-fund)
    npx patch-package 2>/dev/null || ydl_log "WARN: patch-package skipped"
  fi
}

ydl_ensure_postgres_host_port() {
  if ss -tln 2>/dev/null | grep -qE '127\.0\.0\.1:5432 |0\.0\.0\.0:5432 '; then
    return 0
  fi
  ydl_log "postgres: проброс 127.0.0.1:5432 (пересоздание контейнера)"
  cd "$COMPOSE_DIR"
  ydl_compose
  "${COMPOSE[@]}" up -d --force-recreate postgres
  local i
  for ((i = 1; i <= 30; i++)); do
    if ss -tln 2>/dev/null | grep -qE '127\.0\.0\.1:5432 '; then
      ydl_log "postgres:5432 OK на хосте (скрипты: PGHOST=127.0.0.1 python3 …)"
      return 0
    fi
    sleep 1
  done
  ydl_log "WARN: postgres:5432 на хосте не слушает — аудит US: python3 overlay/platform/scripts/ydl-os/repka-platform-healthcheck.py"
  return 1
}

ydl_dev_auth_service() {
  if grep -qE '^US_AUTH_ENABLED=true' "$COMPOSE_DIR/.env" 2>/dev/null; then
    echo us-auth
  else
    echo auth
  fi
}

ydl_docker_stack_up() {
  local auth_svc
  auth_svc="$(ydl_dev_auth_service)"
  ydl_log "Docker dev-local: nginx + backends (как prod), UI в контейнере отключён, auth=$auth_svc"
  cd "$COMPOSE_DIR"
  ydl_compose
  "${COMPOSE[@]}" stop ui 2>/dev/null || true
  if [[ "$auth_svc" == "us-auth" ]]; then
    "${COMPOSE[@]}" --profile legacy-us-auth up -d \
      nginx postgres temporal us us-auth control-api data-api ui-api meta-manager
  else
    "${COMPOSE[@]}" up -d \
      nginx postgres temporal us auth control-api data-api ui-api meta-manager
  fi
  ydl_ensure_postgres_host_port || true
  bash "$YDL_REPO_ROOT/overlay/platform/scripts/ydl-os/apply-control-api-parameter-patch.sh" 2>/dev/null \
    || ydl_log "WARN: parameter patch skipped or failed"
}

ydl_ui_prepare_ports() {
  cd "$UI_DIR"
  export DEV_CLIENT_PORT DEV_SERVER_PORT
  unset APP_PORT || true
  node scripts/free-dev-ports.cjs || ydl_log "WARN: free-dev-ports exited non-zero"
}

ydl_wait_http() {
  local url="$1"
  local label="$2"
  local rounds="${3:-60}"
  local i
  for ((i = 1; i <= rounds; i++)); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      ydl_log "$label OK ($url)"
      return 0
    fi
    sleep 2
  done
  ydl_log "WARN: $label not ready — $url"
  return 1
}

ydl_check_backends() {
  ydl_wait_http "http://127.0.0.1:8030/ping" "US" 30 || true
  local auth_svc
  auth_svc="$(ydl_dev_auth_service)"
  if [[ "$auth_svc" == "us-auth" ]]; then
    if curl -sf -X POST "http://127.0.0.1:8088/demo/auth" \
      -H 'Content-Type: application/json' \
      -d '{"UserName":"master","Password":"qwe-123"}' 2>/dev/null | grep -q '"token"'; then
      ydl_log "AUTH OK (us-auth demo/auth)"
    else
      ydl_log "WARN: us-auth not ready on :8088"
    fi
  elif ydl_wait_http "http://127.0.0.1:8088/ping" "datalens-auth" 20; then
    ydl_log "AUTH OK (native auth :8088)"
  else
    ydl_log "WARN: auth not ready on :8088 — signin may fail until container is up"
  fi
}

ydl_verify_dev_log() {
  local failed=0
  if [[ ! -f "$LOG_FILE" ]]; then
    ydl_log "ERROR: log missing: $LOG_FILE"
    return 1
  fi
  if grep -qE 'RpcExitError|exited \[SIGKILL\]|Issues checking service aborted|^Killed$|heap out of memory|ENOMEM' "$LOG_FILE" 2>/dev/null; then
    ydl_log "ERROR: dev log has OOM/kill markers — tail -80 $LOG_FILE"
    failed=1
  fi
  if ! curl -sf -o /dev/null "http://127.0.0.1:${DEV_CLIENT_PORT}/ping" 2>/dev/null; then
    ydl_log "ERROR: UI dev client :${DEV_CLIENT_PORT} not ready (webpack/rspack died?)"
    failed=1
  fi
  if ! curl -sf -o /dev/null "http://127.0.0.1:${DEV_SERVER_PORT}/ping" 2>/dev/null; then
    ydl_log "ERROR: UI API :${DEV_SERVER_PORT} not ready"
    failed=1
  fi
  return "$failed"
}

ydl_write_stamp() {
  local mode="$1"
  local ui_stack="$2"
  local release_version="$3"
  cat >"$STAMP_FILE" <<EOF
mode=$mode
ui_stack=$ui_stack
started_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
release_version=$release_version
dev_client_port=$DEV_CLIENT_PORT
dev_server_port=$DEV_SERVER_PORT
pid=$(cat "$PID_FILE" 2>/dev/null || echo '')
log=$LOG_FILE
EOF
}

ydl_sync_release_version() {
  FETCH_UPSTREAM="${FETCH_UPSTREAM:-0}" \
    bash "$YDL_REPO_ROOT/overlay/platform/scripts/ydl-os/sync-release-version-from-upstream.sh" 2>/dev/null \
    || echo "2.9.0"
}
