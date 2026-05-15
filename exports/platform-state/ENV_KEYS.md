# Имена переменных окружения (без значений)

Справочник ключей, которые задают поведение стека YDL OS. **Значения с паролями и токенами не коммитить** — только `.env.example` с плейсхолдерами и локальный `.env`.

## Docker / Postgres (`datalens/docker-compose*.yaml`)

- `APP_ENV`, `HC`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `POSTGRES_DB_COMPENG`, `POSTGRES_DB_AUTH`, `POSTGRES_DB_US`, `POSTGRES_DB_DEMO`
- `POSTGRES_DB_META_MANAGER`, `POSTGRES_DB_TEMPORAL`, `POSTGRES_DB_TEMPORAL_VISIBILITY`
- `POSTGRES_ARGS`, `INIT_*`, `CONTROL_API_CRYPTO_KEY`, `US_ENDPOINT`, `US_MASTER_TOKEN`
- `AUTH_TYPE`, `AUTH_TOKEN_PUBLIC_KEY`, и др. из compose-файлов сервисов

## UI dev / Express (`components/datalens-ui/.env.example`)

- `APP_ENV`, `APP_MODE`, `APP_INSTALLATION`, `RELEASE_VERSION`
- `DEV_CLIENT_PORT`, `DEV_SERVER_PORT`
- `US_ENDPOINT`, `BI_API_ENDPOINT`, `BI_DATA_ENDPOINT`, `AUTH_ENDPOINT`, `US_MASTER_TOKEN`
- Редактор групп рейсов: `FLIGHT_GROUPS_MSSQL_CONNECTION_STRING`, `FLIGHT_GROUPS_EDITOR_DATASET_IDS`, `FLIGHT_GROUPS_MASTER_FLIGHTS_SQL`, `FLIGHT_GROUPS_PROTECTED_GROUP_IDS`, `FLIGHT_GROUPS_TABLE_*`, `FLIGHT_GROUPS_EDITOR_TOKEN`

Полные комментарии и шаблоны — в `components/datalens-ui/.env.example`.

## Скрипты экспорта (корень репозитория)

- `scripts/export-platform-state-for-git.ps1` — дампы БД + `MANIFEST.json`
- `scripts/export-full-platform-for-git.ps1` — то же + опционально архив тома
- `scripts/archive-postgres-data-volume-for-git.ps1` — только `pgdata-*.tar.gz` + `VOLUME_ARCHIVE.json`
- `scripts/sanitize-pg-dump.cjs` — обезличивание SQL
- `scripts/restore-platform-state-from-git.ps1` — шаги восстановления
