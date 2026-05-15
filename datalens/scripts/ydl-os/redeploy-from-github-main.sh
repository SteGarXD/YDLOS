#!/usr/bin/env bash
set -euo pipefail

# Redeploy YDL stack from github/main snapshot.
# Usage:
#   bash datalens/datalens/scripts/ydl-os/redeploy-from-github-main.sh
#
# Optional env:
#   REPO_ROOT=/home/g.stepanov/datalens
#   COMPOSE_DIR=/opt/ydl-os
#   WORKTREE_DIR=/home/g.stepanov/ydlos-github-main

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/ydl-os}"
WORKTREE_DIR="${WORKTREE_DIR:-/home/g.stepanov/ydlos-github-main}"
export PATH="/home/g.stepanov/.local/bin:$PATH"

wait_for_http_code() {
  local url="$1"
  local expected="$2"
  local method="${3:-GET}"
  local max_attempts="${4:-25}"
  local sleep_sec="${5:-2}"
  local payload="${6:-}"

  local i=1
  local code=000

  while [[ "$i" -le "$max_attempts" ]]; do
    if [[ -n "$payload" ]]; then
      code="$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url" -H 'Content-Type: application/json' -d "$payload" || echo 000)"
    else
      code="$(curl -sS -o /dev/null -w "%{http_code}" -X "$method" "$url" || echo 000)"
    fi
    if [[ "$code" == "$expected" ]]; then
      echo "$code"
      return 0
    fi
    sleep "$sleep_sec"
    i=$((i + 1))
  done

  echo "$code"
  return 1
}

echo "=== Redeploy from GitHub main ==="
echo "REPO_ROOT=$REPO_ROOT"
echo "COMPOSE_DIR=$COMPOSE_DIR"
echo "WORKTREE_DIR=$WORKTREE_DIR"

cd "$REPO_ROOT"

git fetch github --prune

if [[ -d "$WORKTREE_DIR" ]]; then
  git worktree remove --force "$WORKTREE_DIR" || true
fi
git worktree add --detach "$WORKTREE_DIR" github/main

echo "[1/5] Build datalens-auth image..."
cd "$WORKTREE_DIR/components/datalens-auth"
docker build -f Dockerfile -t akrasnov87/datalens-auth:0.2.6 .

echo "[2/5] Build datalens-ui image..."
cd "$WORKTREE_DIR/components/datalens-ui"
docker build -t akrasnov87/datalens-ui:0.3498.0 .

echo "[3/5] Sync compose/nginx/docs to $COMPOSE_DIR ..."
cd "$WORKTREE_DIR/datalens"
rsync -av \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='.env' \
  --exclude='backups/' \
  --exclude='exports/' \
  --exclude='*.pem' \
  --exclude='*.key' \
  --exclude='.ssh' \
  ./ "$COMPOSE_DIR/"

echo "[4/5] Recreate services..."
cd "$COMPOSE_DIR"
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d --force-recreate us-auth ui ui-api nginx

echo "[5/5] Smoke checks..."
HTTP_PING="$(wait_for_http_code "http://127.0.0.1/ping" "200" "GET" 30 2 || true)"
HTTP_REFRESH="$(wait_for_http_code "http://127.0.0.1/gateway/auth/auth/refreshTokens" "401" "POST" 30 2 '{}' || true)"
echo "GET /ping -> $HTTP_PING (expected 200)"
echo "POST /gateway/auth/auth/refreshTokens (no cookie) -> $HTTP_REFRESH (expected 401)"

if [[ "$HTTP_PING" != "200" || "$HTTP_REFRESH" != "401" ]]; then
  echo "ERROR: smoke checks failed"
  exit 1
fi

# Stamp deploy source commit for operational audit
SRC_COMMIT="$(git -C "$REPO_ROOT" rev-parse github/main)"
{
  echo "source=github/main"
  echo "commit=$SRC_COMMIT"
  echo "deployed_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "deployer=$(id -un 2>/dev/null || echo unknown)"
} > "$COMPOSE_DIR/.ydl-deploy-source"

echo "=== Done ==="
echo "GitHub main commit:"
echo "$SRC_COMMIT"
echo "Deploy source stamp: $COMPOSE_DIR/.ydl-deploy-source"
