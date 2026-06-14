#!/usr/bin/env bash
# Display author as admin in US (workbook lists still use LoginById overlay for uid:*).
set -euo pipefail

ENV_FILE="${1:-${YDL_COMPOSE_DIR}/.env}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres}"

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_DB_US="${POSTGRES_DB_US:-pg-us-db}"

echo "Normalize entries.created_by/updated_by -> admin in ${POSTGRES_DB_US}"

docker exec -i "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB_US" -v ON_ERROR_STOP=1 <<'SQL'
UPDATE entries
SET created_by = 'admin'
WHERE created_by IS DISTINCT FROM 'admin';

UPDATE entries
SET updated_by = 'admin'
WHERE updated_by IS DISTINCT FROM 'admin';

UPDATE revisions
SET created_by = 'admin'
WHERE created_by IS DISTINCT FROM 'admin';

UPDATE revisions
SET updated_by = 'admin'
WHERE updated_by IS DISTINCT FROM 'admin';
SQL

echo "OK: US metadata authors set to admin"
