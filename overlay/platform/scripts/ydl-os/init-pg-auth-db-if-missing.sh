#!/usr/bin/env bash
# Create pg-auth-db on existing Postgres volume (no volume recreate).
set -euo pipefail

ENV_FILE="${1:-${YDL_COMPOSE_DIR}/.env}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres-prod}"

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

export POSTGRES_USER="${POSTGRES_USER:-pg-user}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD required}"
export POSTGRES_DB_AUTH="${POSTGRES_DB_AUTH:-pg-auth-db}"

if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "ERROR: $PG_CONTAINER not running" >&2
  exit 3
fi

exists="$(docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB_AUTH}';" 2>/dev/null | tr -d '[:space:]')"
if [[ "$exists" == "1" ]]; then
  echo "OK: ${POSTGRES_DB_AUTH} already exists"
  exit 0
fi

echo "Creating ${POSTGRES_DB_AUTH} on existing volume (template0, locale C)..."
docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${POSTGRES_DB_AUTH}\" WITH OWNER \"${POSTGRES_USER}\" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE='C' LC_CTYPE='C';"
docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB_AUTH" -v ON_ERROR_STOP=1 \
  -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS btree_gin; CREATE EXTENSION IF NOT EXISTS btree_gist; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
echo "OK: ${POSTGRES_DB_AUTH} created"
