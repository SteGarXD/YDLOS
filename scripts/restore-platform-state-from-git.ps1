#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Подсказки и проверки для восстановления из exports/platform-state/sanitized (не автоматизирует весь кластер).

.DESCRIPTION
  Полное восстановление YDL OS = образ Postgres + init + применение SQL + (опционально) распаковка
  тома из volume-snapshots. Версии Postgres и DataLens должны быть совместимы.

  См. exports/platform-state/README.md и datalens/DOCKER-BACKUP.md.
#>

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$san = Join-Path $repoRoot "exports\platform-state\sanitized"

if (-not (Test-Path $san)) {
    Write-Error "Not found: $san"
}

Write-Host @"
Восстановление из Git-снимка (ручные шаги):

1) Поднять пустой стек тем же образом Postgres, что и при экспорте (см. MANIFEST.json -> postgresVersion).

2) Логические дампы (порядок типичный, уточняйте под вашу версию):
   - Схемы: pg-*-db.schema.sql (temporal, compeng) — только если БД пустые и без конфликта с init-скриптами образа.
   - Данные: pg-auth-db.sql, pg-demo-db.sql, pg-meta-manager-db.sql, pg-us-db.sql
   Выполнение (пример):
     docker exec -i <postgres-container> psql -U pg-user -d pg-us-db -f - < exports/platform-state/sanitized/pg-us-db.sql

3) После strict-санитизации в US нужно заново настроить подключения (connection_id, пароли) в UI.

4) Полный бинарный кластер: распаковать volume-snapshots/pgdata-*.tar.gz в том Postgres при ОСТАНОВЛЕННОМ
   контейнере — см. datalens/DOCKER-BACKUP.md §4. Проверьте sha256 из VOLUME_ARCHIVE.json.

Текущие файлы:
"@ -ForegroundColor Cyan

Get-ChildItem $san -File | Sort-Object Name | Format-Table Name, Length -AutoSize
