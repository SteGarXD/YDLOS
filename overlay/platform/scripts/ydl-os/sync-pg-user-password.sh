#!/usr/bin/env bash
# Sync pg-user password in existing Postgres volume to POSTGRES_PASSWORD from .env
# (required after image change: scram auth from Docker network needs matching hash).
# Does NOT recreate volumes or re-init databases.
set -euo pipefail

ENV_FILE="${1:-${YDL_COMPOSE_DIR}/.env}"
PG_CONTAINER="${PG_CONTAINER:-datalens-postgres-prod}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 2
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

PG_USER="${POSTGRES_USER:-pg-user}"
PG_PASS="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD not set in $ENV_FILE}"

if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  echo "ERROR: container $PG_CONTAINER not running" >&2
  exit 3
fi

echo "Sync password for role ${PG_USER} in ${PG_CONTAINER} (volume unchanged)"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER USER \"${PG_USER}\" WITH PASSWORD '${PG_PASS//\'/\'\'}';"

docker run --rm --network "container:${PG_CONTAINER}" \
  -e PGPASSWORD="$PG_PASS" postgres:16-alpine \
  psql -h 127.0.0.1 -U "$PG_USER" -d pg-us-db -c "SELECT 1" >/dev/null

echo "OK: scram auth from network matches .env"
