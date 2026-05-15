#!/usr/bin/env pwsh
# Создать актуальный бэкап US с воркбуками «Репка» и OpenSource Demo.
#
# Вариант A: если PostgreSQL уже запущен и в нём есть Репка + OpenSource Demo —
#   просто делает дамп в backups/us-backup-YYYY-MM-DD_HH-mm-ss.sql (как us-backup.ps1).
# Вариант B: если нужен бэкап «из эталона» — сначала восстанавливает из последнего
#   бэкапа с Репка+Demo, затем создаёт новый дамп.
#
# Использование:
#   .\us-backup-repka-demo.ps1           — дамп текущего состояния (или эталона, см. -FromTemplate)
#   .\us-backup-repka-demo.ps1 -FromTemplate  — сначала восстановить из последнего Repka+Demo, потом дамп

param(
    [switch]$FromTemplate
)

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$backupsDir = Join-Path $datalensDir "backups"

if (-not (Test-Path $backupsDir)) {
    New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

$containerName = docker ps --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1
if (-not $containerName) {
    Write-Host "PostgreSQL container (datalens-postgres) is not running. Start Docker and US first." -ForegroundColor Red
    exit 1
}

if ($FromTemplate) {
    Write-Host "Restoring from latest Repka+OpenSource Demo backup, then creating new backup ..." -ForegroundColor Cyan
    & (Join-Path $datalensDir "us-restore.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OutputFile = Join-Path $backupsDir "us-backup-$ts.sql"
& (Join-Path $datalensDir "us-backup.ps1") -OutputFile $OutputFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$content = Get-Content -LiteralPath $OutputFile -Raw -Encoding UTF8
if ($content -notmatch "Repka" -or ($content -notmatch "OpenSource Demo" -and $content -notmatch "opensourcedemo")) {
    Write-Host "WARNING: New backup may not contain both workbooks 'Repka' and 'OpenSource Demo'. Check $OutputFile" -ForegroundColor Yellow
} else {
    Write-Host "Backup with Repka + OpenSource Demo saved: $OutputFile" -ForegroundColor Green
}

exit 0
