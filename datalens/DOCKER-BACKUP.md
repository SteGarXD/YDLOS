# Бэкап Docker: тома, контейнеры и БД

**Git не может хранить** состояние томов (volumes), слои запущенных контейнеров и данные внутри них — только файлы репозитория. Чтобы «зафиксировать» окружение Docker, используйте отдельные бэкапы.

## Что важно для YDL OS

| Что хранит данные | Где |
|-------------------|-----|
| Метаданные BI, дашборды, чарты, подключения | PostgreSQL, БД **pg-us-db** и др. в одном кластере |
| Файлы данных Postgres | Именованный том **`datalens-volume-<APP_ENV>`** (по умолчанию `APP_ENV=prod` → `datalens-volume-prod`) |
| Образы приложений | Docker Hub / локальная сборка — не в томе, восстанавливаются из `docker compose pull` / `build-all-images.ps1` |

Остальные сервисы (control-api, data-api, ui, …) в типичном `docker-compose.yaml` **без своих томов** — их состояние только в образах и переменных окружения.

## 1. Быстрый логический бэкап US (как раньше)

Из каталога `datalens`:

```powershell
.\us-backup.ps1
```

или полный дамп через общий скрипт ниже.

## 2. Полный бэкап: SQL + архив тома Postgres + метаданные

Со **запущенным** стеком:

```powershell
cd D:\YDLOS\datalens
.\scripts\docker-full-backup.ps1
```

Создаётся каталог `backups/docker-full-<дата-время>/` с:

- `compose.effective.yaml` — итоговый compose (если собрался)
- `docker-ps-a.txt`, `docker-images.txt`, `docker-volumes-ls.txt`
- **`pg_dumpall.sql`** — полный логический дамп кластера
- **`pg-us-db.dump`** или **`pg-us-db.sql`** — дамп БД United Storage
- **`pgdata.tar.gz`** — сжатый том `/var/lib/postgresql/data` (сырые файлы БД)

Опции:

```powershell
.\scripts\docker-full-backup.ps1 -SkipPostgresVolumeTar   # только SQL + метаданные, без большого tar.gz тома
.\scripts\docker-full-backup.ps1 -SkipSqlDumps           # только метаданные + том
.\scripts\docker-full-backup.ps1 -SaveImages              # docker save образов в tar (долго и много места)
```

Имя тома берётся из **`APP_ENV`** в `datalens/.env` (`datalens-volume-$APP_ENV`).

## 3. Восстановление из `pg_dumpall.sql`

На новой машине: поднять пустой Postgres (тот же образ/мажорная версия), затем:

```bash
psql -U pg-user -f pg_dumpall.sql
```

(уточните пользователя/хост под ваш `.env`; часто восстанавливают через `docker exec -i datalens-postgres-prod psql -U pg-user -f - < pg_dumpall.sql`.)

## 4. Восстановление из `pgdata.tar.gz` (том)

**Остановите** контейнер postgres, **удалите** старый том (или используйте новое имя), создайте том и распакуйте:

```powershell
docker compose -f docker-compose.yaml -f docker-compose.demo.yaml --env-file .env up -d
docker compose stop postgres
docker volume rm datalens-volume-prod   # осторожно: имя из docker volume ls
docker volume create datalens-volume-prod
docker run --rm -v datalens-volume-prod:/target -v ${PWD}\backups\docker-full-XXX:/backup alpine tar xzf /backup/pgdata.tar.gz -C /target
docker compose start postgres
```

Версия образа Postgres должна совпадать с той, с которой делали архив.

## 5. Образы без `-SaveImages`

Обычно достаточно **тегов** `docker-compose.yaml` + `docker compose pull` или локальной **`build-all-images.ps1`**. Полный `docker save` нужен только для air-gapped / гарантии того же digest.

## 6. Версионирование состояния BI в Git (без секретов)

Полный охват: US, Meta Manager, Auth, Demo, Temporal (схемы), CompEng (схема + опционально данные), манифест SHA256, опционально **архив тома** Postgres.

1. Каталог **`exports/platform-state/`** — **`exports/platform-state/README.md`**.
2. Логические дампы: **`.\scripts\export-platform-state-for-git.ps1`** или **`.\scripts\export-full-platform-for-git.ps1`** (Docker, Node.js).
3. Бинарный том: **`.\scripts\archive-postgres-data-volume-for-git.ps1`** (метаданные в `sanitized/VOLUME_ARCHIVE.json`, `.tar.gz` по умолчанию в `.gitignore`).
4. Подсказки по восстановлению: **`.\scripts\restore-platform-state-from-git.ps1`**.

Сырые `pg_dumpall` без санитизации и огромные дампы compeng — по-прежнему через п. 2–4 и хранение вне публичного Git при необходимости.

## 6. Безопасность

Дампы БД и `pgdata` содержат **пароли и метаданные**. Не коммитьте их в Git; храните в защищённом хранилище и шифруйте при передаче.
