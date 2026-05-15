#!/usr/bin/env pwsh
# Восстановление United Storage данных из бэкапа.
#
# Использование:
#   .\us-restore.ps1                         — восстановить из последнего бэкапа
#   .\us-restore.ps1 -InputFile backup.sql   — восстановить из указанного файла

param(
    [string]$InputFile = ""
)

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$backupsDir = Join-Path $datalensDir "backups"

if (-not $InputFile) {
    $all = @(Get-ChildItem $backupsDir -Filter "us-backup-*.sql" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending)
    if ($all.Count -eq 0) {
        Write-Host "No backups found in $backupsDir" -ForegroundColor Red
        exit 1
    }
    # Только бэкапы, где есть и воркбук «Репка», и OpenSource Demo (иначе бекап не подходит)
    $withRepkaAndDemo = @($all | Where-Object {
        $content = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8
        $content -match 'INSERT INTO public\.workbooks' -and
        $content -match "Repka" -and
        ($content -match "OpenSource Demo" -or $content -match "opensourcedemo")
    })
    if ($withRepkaAndDemo.Count -eq 0) {
        Write-Host "No backup with workbook 'Repka' AND 'OpenSource Demo' found in $backupsDir" -ForegroundColor Red
        Write-Host "Restore only from a backup that contains both workbooks. Specify file: .\us-restore.ps1 -InputFile path\to\backup.sql" -ForegroundColor Yellow
        exit 1
    }
    # По имени файла (дата в имени), самый новый
    $pick = $withRepkaAndDemo | Sort-Object Name -Descending | Select-Object -First 1
    $InputFile = $pick.FullName
    Write-Host "Using backup with Repka + OpenSource Demo: $($pick.Name)" -ForegroundColor Cyan
}

if (-not (Test-Path $InputFile)) {
    Write-Host "File not found: $InputFile" -ForegroundColor Red
    exit 1
}

$containerName = docker ps --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1
if (-not $containerName) {
    Write-Host "PostgreSQL container is not running." -ForegroundColor Red
    exit 1
}

$isHealthy = docker inspect --format '{{.State.Health.Status}}' $containerName 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1
if ($isHealthy -ne "healthy") {
    Write-Host "PostgreSQL container is not healthy ($isHealthy). Wait for it to be ready." -ForegroundColor Red
    exit 1
}

Write-Host "Restoring US data into $containerName from $(Split-Path $InputFile -Leaf) ..." -ForegroundColor Cyan

$naturalsortSql = Join-Path $datalensDir "postgres\pg-naturalsort.sql"
if (Test-Path $naturalsortSql) {
    Write-Host "Ensuring naturalsort() exists (US triggers) ..." -ForegroundColor DarkGray
    docker cp $naturalsortSql "${containerName}:/tmp/pg-naturalsort.sql"
    $null = docker exec $containerName bash -c "psql --host localhost --port 5432 --username pg-user --dbname pg-us-db -f /tmp/pg-naturalsort.sql 2>&1"
    docker exec $containerName bash -c "rm -f /tmp/pg-naturalsort.sql" 2>&1 | Out-Null
}

# pg_dump 16 \restrict / \unrestrict — старый psql в контейнере не понимает; убираем строки
$tmpLocal = Join-Path $env:TEMP ("us-restore-" + [Guid]::NewGuid().ToString("n") + ".sql")
try {
    @(
        'SET search_path TO public, pg_catalog;'
        Get-Content -LiteralPath $InputFile -Encoding UTF8 |
            Where-Object {
                $_ -notmatch '^\s*\\restrict' -and $_ -notmatch '^\s*\\unrestrict' -and
                $_ -notmatch "set_config\s*\(\s*'search_path'\s*,\s*''\s*,"
            }
    ) | Set-Content -LiteralPath $tmpLocal -Encoding UTF8
    docker cp $tmpLocal "${containerName}:/tmp/us-restore.sql"
} finally {
    Remove-Item -LiteralPath $tmpLocal -Force -ErrorAction SilentlyContinue
}

# Явный UTF-8: иначе кириллица в дампе может исказиться при клиенте psql
$result = docker exec $containerName bash -c "export PGCLIENTENCODING=UTF8; psql --host localhost --port 5432 --username pg-user --dbname pg-us-db -f /tmp/us-restore.sql 2>&1"
$result | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

docker exec $containerName bash -c "rm -f /tmp/us-restore.sql" 2>&1 | Out-Null

Write-Host "Restore complete. Restart us and ui-api if needed:" -ForegroundColor Green
Write-Host "  cd datalens" -ForegroundColor Gray
Write-Host "  docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.local-dev.yaml --env-file .env restart us ui-api" -ForegroundColor Gray
