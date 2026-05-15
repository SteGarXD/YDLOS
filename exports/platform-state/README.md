# Снимок состояния платформы для Git (без секретов)

Здесь версионируется **максимально полный** набор артефактов, которые можно безопасно положить в Git: санитизированные SQL-дампы всех релевантных БД кластера, отпечатки БД (JSON), манифест с SHA256, опционально метаданные бинарного архива тома Postgres.

## Что входит (по умолчанию, полный экспорт)

| Файл / каталог | Назначение |
|----------------|------------|
| `sanitized/pg-us-db.sql` | United Storage: коллекции, воркбуки, entries, revisions, links. |
| `sanitized/pg-meta-manager-db.sql` | Meta Manager (данные). |
| `sanitized/pg-compeng-db.schema.sql` | Схема Computation Engine. |
| `sanitized/pg-auth-db.sql` | Auth DB (если БД создана, `INIT_DB_AUTH=1`). |
| `sanitized/pg-demo-db.sql` | Демо-БД (если есть). |
| `sanitized/pg-temporal-db.schema.sql` | Схема Temporal (если есть). |
| `sanitized/pg-temporal-visibility-db.schema.sql` | Схема visibility Temporal (если есть). |
| `sanitized/pg-compeng-db.data.sql` | Только с флагом `-IncludeCompengData` и размером ≤ 200 MB. |
| `sanitized/footprint-*.json` | Счётчики таблиц по БД (без данных). |
| `sanitized/MANIFEST.json` | Время экспорта, версия Postgres, список файлов и SHA256. |
| `sanitized/EXPORT_META.txt` | Краткое резюме для людей. |
| `sanitized/VOLUME_ARCHIVE.json` | После `archive-postgres-data-volume-for-git.ps1`: путь, размер, sha256 `.tar.gz`. |
| `volume-snapshots/` | Бинарные `pgdata-*.tar.gz` (по умолчанию **не** в Git — см. `volume-snapshots/README.md`). |

### Режим `-Minimal`

Только US + meta-manager + схема compeng (как в первой версии скрипта).

### Режим санитизации

`scripts/sanitize-pg-dump.cjs`:

- **`strict` (по умолчанию)** — максимум: `connection_id`, `subsql`, длинные `db_version`, публичные IP в `host`, email, хэши паролей, токены и т.д.
- **`standard`** — меньше агрессии (удобнее для частичного восстановления структуры).

Параметр: `export-platform-state-for-git.ps1 -SanitizeMode standard`.

## Команды (из корня репозитория)

```powershell
# Полный логический экспорт + манифест
.\scripts\export-platform-state-for-git.ps1

# То же + архив тома Postgres (живой снимок; для консистентности см. -VolumeColdSnapshot)
.\scripts\export-full-platform-for-git.ps1 -ArchiveVolume

# Холодный архив тома (короткий простой Postgres)
.\scripts\export-full-platform-for-git.ps1 -ArchiveVolume -VolumeColdSnapshot

# Данные compeng (если умеренного размера)
.\scripts\export-full-platform-for-git.ps1 -IncludeCompengData
```

Требования: **Docker** (контейнер `datalens-postgres-*`), **Node.js**.

## Ограничения, которые сняты инструментами

| Раньше | Сейчас |
|--------|--------|
| Только US / meta / схема compeng | Все БД из compose (auth, demo, temporal + US + meta + compeng). |
| Секреты в дампах | Расширенная санитизация + режимы strict/standard. |
| Том Postgres «не в Git» | Скрипт архива + `VOLUME_ARCHIVE.json` в Git; бинарник — LFS или вне репозитория. |
| Непонятно, что коммитить | `MANIFEST.json` с SHA256 по каждому артефакту. |

### Ограничения среды (не «политика», а размер/время)

- **Данные compeng** в Git только если дамп не превышает лимит (`-IncludeCompengData`, по умолчанию 200 MB, см. `-CompengDataMaxMb`); иначе полный сырой дамп — `datalens/scripts/docker-full-backup.ps1` или отдельный архив.
- **Бинарный том** в обычном Git без LFS может быть слишком тяжёлым; используйте `volume-snapshots/` + при необходимости Git LFS (`gitattributes.example`).
- **Внешние СУБД** (MSSQL, ClickHouse и т.д.) не входят в Postgres: их бэкап — отдельно от этого набора скриптов.

## Восстановление

`.\scripts\restore-platform-state-from-git.ps1` — напоминание шагов. Подробно: `datalens/DOCKER-BACKUP.md`.

После **`strict`**-экспорта подключения в US нужно **перенастроить в UI** (пароли, привязка connection).

## Переменные окружения

Список имён без значений: `ENV_KEYS.md`. Шаблон UI: `components/datalens-ui/.env.example`.
