#!/usr/bin/env bash
# Resolve datalens-auth user id by login (docker psql or direct).
set -euo pipefail

auth_user_id_by_login() {
  local login="$1"
  if [[ -n "${PG_CONTAINER:-}" ]]; then
    docker exec "$PG_CONTAINER" psql -U "${POSTGRES_USER:-pg-user}" -d "${POSTGRES_DB_AUTH:-pg-auth-db}" -tAc \
      "SELECT user_id::text FROM auth_users WHERE login = '${login//\'/\'\'}' LIMIT 1;"
    return
  fi
  if [[ -n "${POSTGRES_HOST:-}" ]]; then
    PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$POSTGRES_HOST" -U "${POSTGRES_USER}" -d "${POSTGRES_DB_AUTH:-pg-auth-db}" -tAc \
      "SELECT user_id::text FROM auth_users WHERE login = '${login//\'/\'\'}' LIMIT 1;"
    return
  fi
  echo ""
}
