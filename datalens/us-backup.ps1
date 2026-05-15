#!/usr/bin/env pwsh
# Бэкап United Storage (коллекции, воркбуки, чарты, подключения, датасеты, дашборды)
# из работающего контейнера PostgreSQL.
#
# Использование:
#   .\us-backup.ps1                   — бэкап в datalens/backups/ с таймстемпом
#   .\us-backup.ps1 -OutputFile X.sql — бэкап в указанный файл
#
# Вызывается автоматически из build-and-run-ui.ps1 и docker-cleanup.ps1
#
# Git: полный снимок БД + манифест — ..\scripts\export-platform-state-for-git.ps1
#     + архив тома — ..\scripts\export-full-platform-for-git.ps1 -ArchiveVolume

param(
    [string]$OutputFile = "",
    [switch]$Quiet
)

$ErrorActionPreference = "Continue"
$datalensDir = $PSScriptRoot
$backupsDir = Join-Path $datalensDir "backups"

if (-not (Test-Path $backupsDir)) {
    New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

if (-not $OutputFile) {
    $ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $OutputFile = Join-Path $backupsDir "us-backup-$ts.sql"
}

$containerName = docker ps --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1

if (-not $containerName) {
    if (-not $Quiet) { Write-Host "[us-backup] PostgreSQL container is not running, skipping backup." -ForegroundColor Yellow }
    exit 0
}

$isHealthy = docker inspect --format '{{.State.Health.Status}}' $containerName 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1
if ($isHealthy -ne "healthy") {
    if (-not $Quiet) { Write-Host "[us-backup] PostgreSQL container is not healthy ($isHealthy), skipping." -ForegroundColor Yellow }
    exit 0
}

if (-not $Quiet) { Write-Host "[us-backup] Dumping US data from $containerName ..." -ForegroundColor Cyan }

$dumpCmd = @"
pg_dump --host localhost --port 5432 --username pg-user --dbname pg-us-db --inserts --column-inserts --data-only --table entries --table revisions --table workbooks --table collections --table links --on-conflict-do-nothing 2>/dev/null
"@

$dumpResult = docker exec $containerName bash -c $dumpCmd 2>&1 | Where-Object { $_ -is [string] } | Out-String

if (-not $dumpResult -or $dumpResult.Length -lt 100) {
    if (-not $Quiet) { Write-Host "[us-backup] Dump is empty or failed (US may be fresh). Skipping." -ForegroundColor Yellow }
    exit 0
}

$dumpResult | Out-File -FilePath $OutputFile -Encoding utf8
$sizeMB = [math]::Round((Get-Item $OutputFile).Length / 1MB, 2)

if (-not $Quiet) {
    Write-Host "[us-backup] Saved: $OutputFile ($sizeMB MB)" -ForegroundColor Green
}

# Keep last 20 backups so there is always something to roll back to after a bad build
$keepCount = 20
$allBackups = Get-ChildItem $backupsDir -Filter "us-backup-*.sql" | Sort-Object LastWriteTime -Descending
if ($allBackups.Count -gt $keepCount) {
    $allBackups | Select-Object -Skip $keepCount | Remove-Item -Force -ErrorAction SilentlyContinue
    if (-not $Quiet) { Write-Host "[us-backup] Cleaned old backups (keeping last $keepCount)." -ForegroundColor Gray }
}

exit 0
