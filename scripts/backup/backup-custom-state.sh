#!/usr/bin/env bash
set -euo pipefail

# Backup critical custom state so upstream sync cannot destroy product specifics.
# Required tools: pg_dump, pg_dumpall, tar.

TARGET_ROOT="${1:-./backup-output}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="${TARGET_ROOT}/${TIMESTAMP}"

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_DB_US="${POSTGRES_DB_US:-pg-us-db}"
POSTGRES_DB_META_MANAGER="${POSTGRES_DB_META_MANAGER:-pg-meta-manager-db}"

mkdir -p "${TARGET_DIR}/db" "${TARGET_DIR}/artifacts"

echo "[1/5] Exporting role/permission/auth-related schema (core)..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB_US}" \
  -n core \
  -Fc \
  -f "${TARGET_DIR}/db/us-core-schema.dump"

echo "[2/5] Exporting meta-manager database..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB_META_MANAGER}" \
  -Fc \
  -f "${TARGET_DIR}/db/meta-manager.dump"

echo "[3/5] Exporting global roles/users..."
PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dumpall \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  --globals-only \
  > "${TARGET_DIR}/db/postgres-globals.sql"

echo "[4/5] Saving git pointers..."
{
  echo "datalens_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  echo "datalens_commit=$(git rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "created_at=${TIMESTAMP}"
} > "${TARGET_DIR}/artifacts/git-state.env"

echo "[5/5] Packing backup..."
tar -C "${TARGET_ROOT}" -czf "${TARGET_ROOT}/backup-${TIMESTAMP}.tar.gz" "${TIMESTAMP}"

ln -sfn "${TARGET_DIR}" "${TARGET_ROOT}/latest"

echo "Backup complete: ${TARGET_DIR}"
echo "Archive complete: ${TARGET_ROOT}/backup-${TIMESTAMP}.tar.gz"

