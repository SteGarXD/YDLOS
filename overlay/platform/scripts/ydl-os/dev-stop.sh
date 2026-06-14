#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/ydl-os-dev-lib.sh
source "$SCRIPT_DIR/lib/ydl-os-dev-lib.sh"

ydl_stop_ui_process

# По умолчанию не поднимаем Docker UI — экономия RAM при цикле dev-start → dev-stop.
# Вернуть prod-контейнеры: RESTORE_DOCKER_UI=1 bash dev-stop.sh
if [[ "${RESTORE_DOCKER_UI:-0}" == "1" ]] && [[ -f "$COMPOSE_DIR/.env" ]]; then
  ydl_log "restore Docker UI + default nginx"
  cd "$COMPOSE_DIR"
  COMPOSE_PROD=(docker compose -f "$COMPOSE_DIR/docker-compose.yaml" -f "$COMPOSE_DIR/docker-compose.production.yaml" --env-file "$COMPOSE_DIR/.env")
  "${COMPOSE_PROD[@]}" up -d --force-recreate ui ui-api nginx 2>/dev/null || true
fi

rm -f "$STAMP_FILE"
ydl_log "=== dev stopped (host UI killed, Docker UI restored) ==="
ydl_log "Fast dev again: bash $SCRIPT_DIR/dev-start.sh"
