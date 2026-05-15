#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Архив каталога данных PostgreSQL (Docker volume) в tar.gz для полного снимка кластера.

.DESCRIPTION
  Имя тома: datalens-volume-<APP_ENV>, APP_ENV читается из datalens/.env (как в docker-full-backup.ps1).

  Важно: снимок **на лету** с работающего Postgres теоретически может быть неконсистентен.
  Ключ -AllowDowntime останавливает контейнер postgres, архивирует том, затем запускает контейнер.

  Архив по умолчанию: exports/platform-state/volume-snapshots/pgdata-<timestamp>.tar.gz
  Метаданные (хеш, размер) пишутся в exports/platform-state/sanitized/VOLUME_ARCHIVE.json — файл
  можно коммитить; сам .tar.gz по умолчанию в .gitignore (см. README).

.PARAMETER AllowDowntime
  Остановить datalens-postgres-* перед tar и запустить после (короче окно несогласованности).

.PARAMETER VolumeName
  Явное имя docker volume (иначе вычисляется из APP_ENV).
#>

param(
    [switch]$AllowDowntime,
    [string]$VolumeName = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$datalensDir = Join-Path $repoRoot "datalens"
$envFile = Join-Path $datalensDir ".env"
$snapDir = Join-Path $repoRoot "exports\platform-state\volume-snapshots"
$sanitizedDir = Join-Path $repoRoot "exports\platform-state\sanitized"

$appEnv = "prod"
if (Test-Path $envFile) {
    Get-Content $envFile -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_ -match '^\s*APP_ENV\s*=\s*(.+)\s*$') {
            $appEnv = $matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $VolumeName) {
    $VolumeName = "datalens-volume-$appEnv"
}

$pgContainer = docker ps -a --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 |
    Where-Object { $_ -is [string] -and $_ } |
    Select-Object -First 1

if (-not $pgContainer) {
    Write-Error "No container datalens-postgres*. Cannot resolve stack."
}

docker volume inspect $VolumeName 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker volume not found: $VolumeName. Set -VolumeName or check datalens/.env APP_ENV. docker volume ls"
}

New-Item -ItemType Directory -Path $snapDir -Force | Out-Null
New-Item -ItemType Directory -Path $sanitizedDir -Force | Out-Null

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$tarName = "pgdata-$ts.tar.gz"
$tarPath = Join-Path $snapDir $tarName

Write-Host "[archive-postgres-volume] Volume=$VolumeName -> $tarPath" -ForegroundColor Cyan

if ($AllowDowntime) {
    Write-Host "[archive-postgres-volume] Stopping $pgContainer ..." -ForegroundColor Yellow
    docker stop $pgContainer 2>&1 | Out-Null
}

try {
    docker run --rm `
        -v "${VolumeName}:/source:ro" `
        -v "${snapDir}:/backup" `
        alpine:3.20 `
        tar czf "/backup/$tarName" -C /source .
    if (-not (Test-Path $tarPath) -or (Get-Item $tarPath).Length -lt 1000) {
        Write-Error "Archive failed or empty: $tarPath"
    }
} finally {
    if ($AllowDowntime) {
        Write-Host "[archive-postgres-volume] Starting $pgContainer ..." -ForegroundColor Yellow
        docker start $pgContainer 2>&1 | Out-Null
    }
}

$fi = Get-Item $tarPath
$hash = (Get-FileHash -Path $tarPath -Algorithm SHA256).Hash.ToLowerInvariant()
$relTar = "exports/platform-state/volume-snapshots/$tarName"

$volMeta = [ordered]@{
    createdAt       = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssK")
    volumeName      = $VolumeName
    appEnv          = $appEnv
    postgresContainer = $pgContainer
    allowDowntime   = [bool]$AllowDowntime
    archivePath     = $relTar
    bytes           = $fi.Length
    sha256          = $hash
    note            = "Binary archive not committed by default; transfer out-of-band or enable Git LFS and adjust .gitignore."
}

$metaPath = Join-Path $sanitizedDir "VOLUME_ARCHIVE.json"
$volMeta | ConvertTo-Json -Depth 4 | Set-Content -Path $metaPath -Encoding utf8

$mb = [math]::Round($fi.Length / 1MB, 2)
Write-Host "[archive-postgres-volume] OK $tarPath ($mb MB) sha256=$hash" -ForegroundColor Green
Write-Host "[archive-postgres-volume] Metadata: $metaPath" -ForegroundColor Green
