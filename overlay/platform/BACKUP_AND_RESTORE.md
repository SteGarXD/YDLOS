# BACKUP_AND_RESTORE

Операционный регламент резервного копирования и восстановления.

## 1. Что обязательно хранить

- `latest` и `previous` SQL backup;
- nightly dump-файлы с ротацией;
- отчёты health/divergence.

## 2. Быстрый backup US

```bash
docker exec datalens-postgres-prod sh -lc \
  'PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -U "${POSTGRES_USER:-pg-user}" -d "${POSTGRES_DB_US:-pg-us-db}" -F c -f /tmp/us-manual.dump'
docker cp datalens-postgres-prod:/tmp/us-manual.dump ./backups/us-manual-$(date +%Y-%m-%d_%H-%M-%S).dump
```

## 3. Ночной backup

```bash
bash scripts/ydl-os/nightly-maintenance.sh
```

Артефакты:

- `backups/nightly/us-nightly-*.dump`
- `reports/nightly/health-*.txt`
- `reports/nightly/commit-divergence-*.txt`

## 4. Минимальная проверка восстановления

1. Развернуть отдельный test-контур.
2. Восстановить dump.
3. Проверить вход в UI, список воркбуков, открытие ключевых дашбордов.
