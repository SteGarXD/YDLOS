#!/usr/bin/env bash
# Set qwe-123 for all local auth users (akrasnov87 parity). Bypasses signup password policy.
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

HASH="$(hash_password "$PASSWORD")"
echo "Reset passwords in ${POSTGRES_DB_AUTH} -> ${PASSWORD}"

docker exec "$PG_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB_AUTH" -v ON_ERROR_STOP=1 \
  -c "UPDATE auth_users SET password = '${HASH}' WHERE idp_slug IS NULL AND login IN ('admin','user');"

echo "OK: admin/user password ${PASSWORD}"
