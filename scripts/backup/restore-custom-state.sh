#!/usr/bin/env bash
set -euo pipefail

# Restore critical custom state from backup-custom-state.sh output.
# Usage: ./scripts/backup/restore-custom-state.sh ./backup-output/latest

SOURCE_DIR="${1:-}"
if [[ -z "${SOURCE_DIR}" ]]; then
  echo "Usage: $0 <backup-directory>"
  exit 1
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Backup directory does not exist: ${SOURCE_DIR}"
  exit 1
fi

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_DB_US="${POSTGRES_DB_US:-pg-us-db}"
POSTGRES_DB_META_MANAGER="${POSTGRES_DB_META_MANAGER:-pg-meta-manager-db}"

US_CORE_DUMP="${SOURCE_DIR}/db/us-core-schema.dump"
META_MANAGER_DUMP="${SOURCE_DIR}/db/meta-manager.dump"
GLOBALS_SQL="${SOURCE_DIR}/db/postgres-globals.sql"

if [[ ! -f "${US_CORE_DUMP}" || ! -f "${META_MANAGER_DUMP}" || ! -f "${GLOBALS_SQL}" ]]; then
  echo "Required backup files are missing in: ${SOURCE_DIR}/db"
  exit 1
fi

echo "[1/4] Restoring postgres globals..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" psql \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d postgres \
  -f "${GLOBALS_SQL}"

echo "[2/4] Restoring core schema in US database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_restore \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB_US}" \
  --clean --if-exists --schema=core \
  "${US_CORE_DUMP}"

echo "[3/4] Restoring meta-manager database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_restore \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB_META_MANAGER}" \
  --clean --if-exists \
  "${META_MANAGER_DUMP}"

echo "[4/4] Done. Run platform smoke checks."

