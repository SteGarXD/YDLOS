#!/usr/bin/env bash
# Staged migration: legacy us-auth + US 0.413 -> official ghcr US 1.39 + auth 0.27.
# Does NOT remove Postgres volumes.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

TS="$(date -u +%Y%m%d-%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-${OVERLAY_PLATFORM}/backups/migration-${TS}}"
STAGING_COMPOSE="${OVERLAY_COMPOSE}/docker-compose.ydl-official-auth.yaml"

vendor_lag() {
  git -C "$VENDOR_DATALENS" fetch -q https://github.com/datalens-tech/datalens.git main 2>/dev/null || true
  git -C "$VENDOR_DATALENS" rev-list --left-right --count FETCH_HEAD...HEAD 2>/dev/null || echo "? ?"
}

cmd_report() {
  local lag
  lag="$(vendor_lag)"
  echo "=== YDL official stack migration report ==="
  echo "vendor/datalens vs datalens-tech/main: behind/ahead = ${lag}"
  echo "vendor release: $(jq -r .releaseVersion "$VENDOR_DATALENS/versions-config.json")"
  echo "vendor usVersion: $(jq -r .usVersion "$VENDOR_DATALENS/versions-config.json")"
  echo "vendor authVersion: $(jq -r .authVersion "$VENDOR_DATALENS/versions-config.json")"
  echo "overlay US package: $(jq -r .version "${OVERLAY_COMPONENTS}/datalens-us/package.json" 2>/dev/null || echo n/a)"
  echo "default compose auth: official (YDL_LEGACY_AUTH=0)"
  echo "rollback: YDL_LEGACY_AUTH=1"
  if [[ -f "${OVERLAY_PLATFORM}/.ydl-built-images.env" ]]; then
    # shellcheck disable=SC1090
    source "${OVERLAY_PLATFORM}/.ydl-built-images.env"
    echo "built UI: ${YDL_UI_IMAGE:-n/a}"
    echo "US image: ${YDL_US_IMAGE:-n/a}"
    echo "auth: ${OFFICIAL_AUTH_IMAGE:-${YDL_AUTH_IMAGE:-n/a}}"
  fi
  echo ""
  echo "Full apply: bash integration/apply-official-stack.sh"
  echo "Doc: overlay/platform/docs/MIGRATION_US_AUTH_1.39.md"
}

cmd_backup() {
  mkdir -p "$BACKUP_DIR"
  echo "Backup dir: $BACKUP_DIR"
  local pg_container="${POSTGRES_CONTAINER:-datalens-postgres-prod}"
  if docker ps --format '{{.Names}}' | grep -q "${pg_container}\|datalens-postgres"; then
    pg_container="$(docker ps --format '{{.Names}}' | grep -E 'datalens-postgres' | head -1)"
    docker exec "$pg_container" pg_dump -U "${POSTGRES_USER:-pg-user}" "${POSTGRES_DB_US:-pg-us-db}" \
      >"${BACKUP_DIR}/pg-us-db.sql" 2>/dev/null \
      || docker exec "$pg_container" pg_dump -U pg-user pg-us-db >"${BACKUP_DIR}/pg-us-db.sql"
    echo "Wrote ${BACKUP_DIR}/pg-us-db.sql"
    docker exec "$pg_container" pg_dump -U "${POSTGRES_USER:-pg-user}" "${POSTGRES_DB_AUTH:-pg-auth-db}" \
      >"${BACKUP_DIR}/pg-auth-db.sql" 2>/dev/null \
      || echo "WARN: pg-auth-db dump skipped (may not exist on official stack)"
  else
    echo "WARN: postgres container not running — backup SQL skipped"
  fi
  [[ -f "${OVERLAY_PLATFORM}/.env" ]] && cp "${OVERLAY_PLATFORM}/.env" "${BACKUP_DIR}/.env.snapshot"
  local compose_dir="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
  [[ -f "${compose_dir}/.env" ]] && cp "${compose_dir}/.env" "${BACKUP_DIR}/compose.env.snapshot" 2>/dev/null || true
  git -C "$YDL_REPO_ROOT" rev-parse HEAD >"${BACKUP_DIR}/ydl-git-sha.txt"
  git -C "$VENDOR_DATALENS" rev-parse HEAD >"${BACKUP_DIR}/vendor-git-sha.txt" 2>/dev/null || true
  echo "Backup complete."
}

cmd_compose_staging() {
  echo "Official auth is DEFAULT in integration/lib/compose-files.sh"
  echo "File: $STAGING_COMPOSE"
  echo "  export YDL_LEGACY_AUTH=0"
  echo "  bash integration/apply-official-stack.sh"
}

cmd_legacy_snapshot() {
  local dest="${OVERLAY_COMPONENTS}/datalens-us-0.413-legacy"
  if [[ -d "$dest" ]]; then
    echo "Legacy snapshot already exists: $dest"
    return 0
  fi
  echo "Copying overlay US -> $dest"
  cp -a "${OVERLAY_COMPONENTS}/datalens-us" "$dest"
  echo "Legacy US frozen at $(jq -r .version "${dest}/package.json")"
}

main() {
  local cmd="${1:-report}"
  case "$cmd" in
    report) cmd_report ;;
    backup) cmd_backup ;;
    compose-staging) cmd_compose_staging ;;
    legacy-snapshot) cmd_legacy_snapshot ;;
    *)
      echo "Usage: $0 {report|backup|compose-staging|legacy-snapshot}" >&2
      exit 1
      ;;
  esac
}

main "$@"
