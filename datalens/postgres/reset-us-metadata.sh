#!/usr/bin/env bash
# Полный сброс метаданных Universal Storage (БД pg-us-db): коллекции, воркбуки, записи, ревизии.
# После выполнения перезапустите контейнер us — миграции создадут пустую схему заново.
#
# Использование (из хоста):
#   export POSTGRES_CONTAINER=datalens-postgres-prod   # имя из `docker ps`
#   export POSTGRES_USER=pg-user
#   export POSTGRES_PASSWORD=postgres
#   export POSTGRES_DB_US=pg-us-db
#   bash datalens/postgres/reset-us-metadata.sh
#
set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-}"
POSTGRES_USER="${POSTGRES_USER:-pg-user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB_US="${POSTGRES_DB_US:-pg-us-db}"

# Читает SQL из stdin (-i обязателен для docker exec + heredoc)
exec_sql() {
  local db="$1"
  if [[ -n "$POSTGRES_CONTAINER" ]]; then
    docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
      psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$db"
  else
    PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$db"
  fi
}

echo ">>> Terminating sessions and recreating database \"$POSTGRES_DB_US\"..."
exec_sql postgres <<-SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$POSTGRES_DB_US'
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$POSTGRES_DB_US";
CREATE DATABASE "$POSTGRES_DB_US" WITH OWNER "$POSTGRES_USER" ENCODING 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';
SQL

echo ">>> Extensions in \"$POSTGRES_DB_US\" (как в init-postgres.sh)..."
exec_sql "$POSTGRES_DB_US" <<-SQL
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
SQL

echo ">>> Готово. Выполните: docker compose restart us"
echo ">>> Очистите в браузере localStorage (ключ x-rpc-authorization) и войдите снова."
