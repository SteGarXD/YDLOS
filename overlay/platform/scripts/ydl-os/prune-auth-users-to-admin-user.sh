#!/usr/bin/env bash
# Keep only local admin + user (remove master/oidc and other legacy seeds).
set -euo pipefail

ENV_FILE="${1:-${YDL_COMPOSE_DIR}/.env}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres-prod}"

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_DB_AUTH="${POSTGRES_DB_AUTH:-pg-auth-db}"

echo "Prune auth users in ${POSTGRES_DB_AUTH} (keep admin + user only)"

docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB_AUTH" -v ON_ERROR_STOP=1 <<'SQL'
DELETE FROM auth_roles
WHERE user_id IN (SELECT user_id FROM auth_users WHERE login NOT IN ('admin', 'user'));

DELETE FROM auth_users
WHERE login NOT IN ('admin', 'user');
SQL

echo "OK: only admin and user remain"
