#!/usr/bin/env bash
set -euo pipefail
export PATH="/home/g.stepanov/.local/bin:$PATH"

# Nightly maintenance for YDL OS:
# 1) commit-divergence report
# 2) PostgreSQL US dump
# 3) backup rotation
# 4) smoke checks

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/ydl-os}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/datalens/backups/nightly}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/nightly}"
KEEP_DUMPS="${KEEP_DUMPS:-14}"
KEEP_REPORTS="${KEEP_REPORTS:-30}"
TS="$(date +%Y-%m-%d_%H-%M-%S)"

mkdir -p "$BACKUP_DIR" "$REPORT_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

log "nightly-maintenance started"

log "generate divergence report"
bash "$REPO_ROOT/datalens/scripts/ydl-os/commit-divergence-report.sh" > "$REPORT_DIR/commit-divergence-${TS}.txt" 2>&1 || true

log "create pg_dump custom format"
docker exec datalens-postgres-prod sh -lc 'PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -U "${POSTGRES_USER:-pg-user}" -d "${POSTGRES_DB_US:-pg-us-db}" -F c -f /tmp/us-nightly.dump'
docker cp datalens-postgres-prod:/tmp/us-nightly.dump "$BACKUP_DIR/us-nightly-${TS}.dump"

log "rotate old dumps and reports"
ls -1t "$BACKUP_DIR"/us-nightly-*.dump 2>/dev/null | tail -n +$((KEEP_DUMPS + 1)) | xargs -r rm -f
ls -1t "$REPORT_DIR"/commit-divergence-*.txt 2>/dev/null | tail -n +$((KEEP_REPORTS + 1)) | xargs -r rm -f

log "smoke checks"
PING_CODE="$(curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1/ping || echo 000)"
REFRESH_CODE="$(curl -sS -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1/gateway/auth/auth/refreshTokens -H 'Content-Type: application/json' -d '{}' || echo 000)"

{
  echo "timestamp_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "ping_code=$PING_CODE"
  echo "refresh_code_no_cookie=$REFRESH_CODE"
  echo "latest_backup=$(ls -1t "$BACKUP_DIR"/us-nightly-*.dump 2>/dev/null | head -n 1 || true)"
} > "$REPORT_DIR/health-${TS}.txt"

log "nightly-maintenance done (ping=$PING_CODE refresh_no_cookie=$REFRESH_CODE)"
