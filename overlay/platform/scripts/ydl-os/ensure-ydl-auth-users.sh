#!/usr/bin/env bash
# Гарантирует учётки admin (полный доступ) и user (viewer: просмотр + селекторы).
set -euo pipefail

ENV_FILE="${1:-${YDL_COMPOSE_DIR}/.env}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres-prod}"
PASSWORD="${YDL_DEFAULT_PASSWORD:-qwe-123}"

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_DB_AUTH="${POSTGRES_DB_AUTH:-pg-auth-db}"

hash_password() {
  local pass="$1"
  local salt salt_hex salt_b64 key_b64
  salt="$(openssl rand 16)"
  salt_hex="$(echo -n "$salt" | od -A n -t x1 -v | tr -d ' \n')"
  salt_b64="$(echo -n "$salt" | openssl enc -base64 -A | tr '+/' '-_' | tr -d '=')"
  key_b64="$(
    openssl kdf -keylen 64 \
      -kdfopt "pass:${pass}" -kdfopt "hexsalt:${salt_hex}" \
      -kdfopt "n:16384" -kdfopt "r:8" -kdfopt "p:1" \
      -kdfopt "maxmem_bytes:33554432" \
      -binary scrypt | openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
  )"
  echo "${salt_b64}:${key_b64}"
}

ensure_user() {
  local login="$1"
  local role="$2"
  local hash
  hash="$(hash_password "$PASSWORD")"
  docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB_AUTH" -v ON_ERROR_STOP=1 \
    -c "INSERT INTO auth_users (login, password, idp_type, idp_slug)
        SELECT '${login}', '${hash}', NULL, NULL
        WHERE NOT EXISTS (SELECT 1 FROM auth_users WHERE login = '${login}');" \
    -c "UPDATE auth_users SET password = '${hash}', idp_type = NULL, idp_slug = NULL WHERE login = '${login}';" \
    -c "DELETE FROM auth_roles WHERE user_id IN (SELECT user_id FROM auth_users WHERE login = '${login}');" \
    -c "INSERT INTO auth_roles (user_id, role)
        SELECT user_id, '${role}' FROM auth_users WHERE login = '${login}';"
}

echo "ensure-ydl-auth-users: admin -> datalens.admin, user -> datalens.viewer (password: ${PASSWORD})"
ensure_user "admin" "datalens.admin"
ensure_user "user" "datalens.viewer"
echo "OK: admin (admin), user (viewer)"
