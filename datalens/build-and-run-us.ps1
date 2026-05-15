# YDL OS: сборка US из исходников (components/datalens-us) + перезапуск контейнера us.
# Нужен после правок в US (например authorize: JSON вместо FormData для us-auth).
# Запуск из папки datalens: .\build-and-run-us.ps1

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $datalensDir "..")
$usDir = Join-Path $repoRoot "components\datalens-us"
$usTag = "0.413.0"
$imageName = "aeronavigatorbi/datalens-us:$usTag"

if (-not (Test-Path (Join-Path $usDir "package.json"))) {
    Write-Host "Error: components/datalens-us not found." -ForegroundColor Red
    exit 1
}

Write-Host "=== 1. Сборка образа US (components/datalens-us) ===" -ForegroundColor Cyan
Set-Location $repoRoot
docker build -f (Join-Path $usDir "Dockerfile") -t $imageName $usDir
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "=== 2. Перезапуск us ===" -ForegroundColor Cyan
Set-Location $datalensDir
$env:APP_ENV = "prod"
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d --force-recreate us
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done. US image rebuilt and container restarted." -ForegroundColor Green
Write-Host "  Image: $imageName" -ForegroundColor Gray
