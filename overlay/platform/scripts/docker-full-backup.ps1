#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Полный бэкап Docker-части стека YDL OS: метаданные compose/контейнеров, дампы БД, архив тома PostgreSQL.

.DESCRIPTION
  Git не хранит тома и состояние контейнеров. Этот скрипт сохраняет в каталог backups/docker-full-<timestamp>/:
  - effective docker compose (config)
  - списки контейнеров, образов, томов
  - полный pg_dump / pg_dumpall из контейнера postgres (если запущен)
  - tar.gz сырых данных тома db-postgres (имя: datalens-volume-<APP_ENV>)

  Восстановление тома: см. datalens/DOCKER-BACKUP.md

.PARAMETER OutputRoot
  Корень для бэкапов (по умолчанию: ../backups относительно скрипта = datalens/backups).

.PARAMETER SkipPostgresVolumeTar
  Не архивировать весь том /var/lib/postgresql/data (только SQL-дампы).

.PARAMETER SkipSqlDumps
  Не делать pg_dump (только метаданные и том).

.PARAMETER SaveImages
  Сохранить используемые образы в tar (docker save) — может занять много места и времени.

.EXAMPLE
  cd D:\YDLOS\datalens
  .\scripts\docker-full-backup.ps1
#>

param(
    [string]$OutputRoot = "",
    [switch]$SkipPostgresVolumeTar,
    [switch]$SkipSqlDumps,
    [switch]$SaveImages
)

$ErrorActionPreference = "Continue"
$LogPrefix = "docker-full-backup:"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$datalensDir = Split-Path -Parent $scriptDir

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $datalensDir "backups"
}

if (-not (Test-Path $OutputRoot)) {
    New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
}

$ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outDir = Join-Path $OutputRoot "docker-full-$ts"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

Write-Host ($LogPrefix + " Output: $outDir") -ForegroundColor Cyan

# --- APP_ENV из datalens/.env ---
$envFile = Join-Path $datalensDir ".env"
$appEnv = "prod"
if (Test-Path $envFile) {
    Get-Content $envFile -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_ -match '^\s*APP_ENV\s*=\s*(.+)\s*$') {
            $appEnv = $matches[1].Trim().Trim('"').Trim("'")
        }
    }
}
$volumeName = "datalens-volume-$appEnv"
Set-Content -Path (Join-Path $outDir "META.env.txt") -Value "APP_ENV=$appEnv`nVOLUME_NAME=$volumeName`nTIMESTAMP=$ts`n"

# --- docker compose ---
$composeFiles = @(
    (Join-Path $datalensDir "docker-compose.yaml"),
    (Join-Path $datalensDir "docker-compose.demo.yaml")
)
$composeArgs = @()
foreach ($f in $composeFiles) {
    if (Test-Path $f) { $composeArgs += @("-f", $f) }
}

Push-Location $datalensDir
try {
    if ($composeArgs.Count -gt 0 -and (Test-Path $envFile)) {
        docker compose @composeArgs --env-file $envFile config 2>&1 | Out-File -FilePath (Join-Path $outDir "compose.effective.yaml") -Encoding utf8
    }
} catch {
    Write-Host ($LogPrefix + " Warning: compose config failed: $_") -ForegroundColor Yellow
}
Pop-Location

docker ps -a 2>&1 | Out-File -FilePath (Join-Path $outDir "docker-ps-a.txt") -Encoding utf8
docker images -a 2>&1 | Out-File -FilePath (Join-Path $outDir "docker-images.txt") -Encoding utf8
docker volume ls 2>&1 | Out-File -FilePath (Join-Path $outDir "docker-volumes-ls.txt") -Encoding utf8

# --- контейнер postgres ---
$pgContainer = docker ps --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 | Where-Object { $_ -is [string] -and $_ } | Select-Object -First 1

if (-not $pgContainer) {
    Write-Host ($LogPrefix + " PostgreSQL container not running; skip DB dumps and volume backup.") -ForegroundColor Yellow
    Set-Content -Path (Join-Path $outDir "README.txt") -Encoding utf8 -Value @"
Docker full backup ($ts).
Postgres container was not running; only compose metadata and docker listings were saved.
Start stack and run this script again for SQL + volume archive.
"@
    exit 0
}

if (-not $SkipSqlDumps) {
    Write-Host ($LogPrefix + " pg_dumpall ...") -ForegroundColor Cyan
    $pgDumpAll = Join-Path $outDir "pg_dumpall.sql"
    docker exec $pgContainer pg_dumpall -U pg-user 2>&1 | Out-File -FilePath $pgDumpAll -Encoding utf8
    $sz = [math]::Round((Get-Item $pgDumpAll).Length / 1MB, 2)
    Write-Host ($LogPrefix + " pg_dumpall saved: $pgDumpAll sizeMB=$sz") -ForegroundColor Green

    Write-Host ($LogPrefix + " pg_dump US db (custom format) ...") -ForegroundColor Cyan
    $usDb = "pg-us-db"
    $dumpOut = Join-Path $outDir "pg-us-db.dump"
    docker exec $pgContainer pg_dump -U pg-user -Fc $usDb -f /tmp/pg-us-db.dump 2>&1 | Out-Null
    docker cp "${pgContainer}:/tmp/pg-us-db.dump" $dumpOut 2>&1 | Out-Null
    docker exec $pgContainer rm -f /tmp/pg-us-db.dump 2>&1 | Out-Null
    if (-not (Test-Path $dumpOut) -or (Get-Item $dumpOut).Length -lt 100) {
        docker exec $pgContainer pg_dump -U pg-user --format=plain $usDb 2>&1 | Out-File -FilePath (Join-Path $outDir "pg-us-db.sql") -Encoding utf8
    }
}

# --- архив тома PostgreSQL (сырые данные кластера) ---
if (-not $SkipPostgresVolumeTar) {
    $volExists = docker volume inspect $volumeName 2>&1
    if ($LASTEXITCODE -eq 0) {
        $tarPath = Join-Path $outDir "postgres-data-volume-$volumeName.tar.gz"
        Write-Host ($LogPrefix + " Archiving volume $volumeName (may take a while) ...") -ForegroundColor Cyan
        docker run --rm `
            -v "${volumeName}:/source:ro" `
            -v "${outDir}:/backup" `
            alpine:3.20 `
            tar czf /backup/pgdata.tar.gz -C /source .
        if (Test-Path (Join-Path $outDir "pgdata.tar.gz")) {
            $gz = Get-Item (Join-Path $outDir "pgdata.tar.gz")
            $gzMb = [math]::Round($gz.Length / 1MB, 2)
            Write-Host ($LogPrefix + " Volume archive: " + $gz.FullName + " sizeMB=" + $gzMb) -ForegroundColor Green
        }
    } else {
        Write-Host ($LogPrefix + " Volume $volumeName not found. Check APP_ENV in .env") -ForegroundColor Yellow
    }
}

if ($SaveImages) {
    $imgDir = Join-Path $outDir "images-tar"
    New-Item -ItemType Directory -Path $imgDir -Force | Out-Null
    $imgs = docker ps -a --format "{{.Image}}" 2>&1 | Sort-Object -Unique
    $i = 0
    foreach ($img in $imgs) {
        if (-not $img -or $img -match "IMAGE") { continue }
        $safe = $img -replace '[\\/:*?"<>|]', '_'
        $i++
        $tarFile = Join-Path $imgDir ("image-{0}-{1}.tar" -f $i, $safe)
        Write-Host ($LogPrefix + " docker save " + $img + " ...") -ForegroundColor Gray
        docker save -o $tarFile $img 2>&1 | Out-Null
    }
}

$readmeLines = @(
    "Docker full backup ($ts)",
    "========================",
    "APP_ENV: $appEnv",
    "Postgres volume name: $volumeName",
    "",
    "Contents:",
    "- compose.effective.yaml",
    "- docker-ps-a.txt, docker-images.txt, docker-volumes-ls.txt",
    "- pg_dumpall.sql (full cluster logical dump)",
    "- pg-us-db.dump or pg-us-db.sql (United Storage)",
    "- pgdata.tar.gz (raw postgres data volume)",
    "",
    "Restore: see DOCKER-BACKUP.md in datalens folder.",
    "Do not commit secrets; store backups securely."
)
$readme = $readmeLines -join [Environment]::NewLine
Set-Content -Path (Join-Path $outDir "README.txt") -Value $readme -Encoding utf8

Write-Host ($LogPrefix + " Done.") -ForegroundColor Green
