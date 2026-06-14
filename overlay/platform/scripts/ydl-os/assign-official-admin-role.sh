#!/usr/bin/env bash
# Grant datalens.admin to user in official auth DB (auth_users / auth_roles).
set -euo pipefail

LOGIN="${1:-admin}"
COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres-prod}"

cd "$COMPOSE_DIR"
# shellcheck disable=SC1091
set -a && source .env && set +a

docker exec "$PG_CONTAINER" psql -U "${POSTGRES_USER:-pg-user}" -d "${POSTGRES_DB_AUTH:-pg-auth-db}" -v ON_ERROR_STOP=1 <<SQL
DELETE FROM auth_roles WHERE user_id IN (SELECT user_id FROM auth_users WHERE login = '${LOGIN}');
INSERT INTO auth_roles (user_id, role)
SELECT user_id, 'datalens.admin' FROM auth_users WHERE login = '${LOGIN}';
SQL

echo "OK: datalens.admin for ${LOGIN}"
