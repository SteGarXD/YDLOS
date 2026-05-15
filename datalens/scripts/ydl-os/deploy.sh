#!/bin/bash
# ============================================================
# YDL OS - Deploy to production server
# ============================================================
# Запускать из каталога datalens/datalens (рядом с docker-compose.yaml):
#   ./scripts/ydl-os/deploy.sh
# Или с любого cwd:
#   bash /path/to/datalens/scripts/ydl-os/deploy.sh [user@host]
#
# Переменные:
#   PULL=1          — выполнить docker compose pull перед up (для ghcr; для akrasnov87 обычно не нужно)
#   SYNC_MONOREPO=1 — дополнительно rsync весь ydl-os в ~/datalens на сервере (components/ для сборки UI у вас локально или на сервере)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# datalens/datalens (рядом с compose)
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SERVER="${1:-g.stepanov@192.168.201.40}"
REMOTE_DIR="/opt/ydl-os"
REMOTE_MONO="${REMOTE_MONO:-/home/g.stepanov/datalens}"

echo "=== YDL OS Production Deployment ==="
echo "Server: $SERVER"
echo "Compose dir (remote): $REMOTE_DIR"
echo "Local compose root: $REPO_ROOT"
echo ""

cd "$REPO_ROOT"

echo "[1/4] Syncing compose/nginx/scripts/docs to $SERVER:$REMOTE_DIR ..."
rsync -avz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='.env' \
    --exclude='*.pem' \
    --exclude='*.key' \
    --exclude='.ssh' \
    --exclude='backups/*.sql' \
    -e ssh ./ "$SERVER:$REMOTE_DIR/"

if [[ "${SYNC_MONOREPO:-}" == "1" ]]; then
    # mono root: каталог выше inner datalens/datalens (там components/)
    MONO="$(cd "$REPO_ROOT/.." && pwd)"
    if [[ -d "$MONO/components" ]]; then
        echo "[1b] SYNC_MONOREPO=1: syncing full ydl-os to $SERVER:$REMOTE_MONO ..."
        rsync -avz \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='__pycache__' \
            --exclude='.env' \
            --exclude='*.pem' \
            --exclude='*.key' \
            --exclude='.ssh' \
            -e ssh "$MONO/" "$SERVER:$REMOTE_MONO/"
    else
        echo "[1b] SKIP: no components/ at $MONO"
    fi
fi

echo "[2/4] Checking .env on server..."
ssh "$SERVER" "cd $REMOTE_DIR && ([ -f .env ] || ([ -f .env.example ] && cp .env.example .env) || true)"

if [[ "${PULL:-}" == "1" ]]; then
    echo "[3/4] docker compose pull..."
    ssh "$SERVER" "cd $REMOTE_DIR && docker compose -f docker-compose.yaml -f docker-compose.production.yaml pull"
else
    echo "[3/4] Skip pull (set PULL=1 to pull). Кастомные образы подтягиваете сами после сборки."
fi

echo "[4/4] docker compose up -d..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d"

echo ""
echo "=== Deployment complete ==="
echo "Проверка на сервере: ssh $SERVER 'curl -sI http://127.0.0.1:80 | head -3'"
echo "Публично: https://bi.aeronavigator.ru (внешний nginx → $REMOTE_DIR на :80)"
