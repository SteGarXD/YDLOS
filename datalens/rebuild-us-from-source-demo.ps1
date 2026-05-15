# Сборка US из components/datalens-us и перезапуск контейнера для стека demo + local-dev.
# Нужен после правок в datalens-us (например auth + master-token для AUTH_ENABLED).
# Запуск из папки datalens: .\rebuild-us-from-source-demo.ps1

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $datalensDir "..")
$usDir = Join-Path $repoRoot "components\datalens-us"
$usTag = "0.413.0"
# Имя как в docker-compose.yaml (demo-стек)
$imageName = "akrasnov87/datalens-us:$usTag"

if (-not (Test-Path (Join-Path $usDir "package.json"))) {
    Write-Host "Error: components/datalens-us not found." -ForegroundColor Red
    exit 1
}

Write-Host "=== npm run build (dist/server для Dockerfile) ===" -ForegroundColor Cyan
Push-Location $usDir
if (-not (Test-Path "node_modules")) { npm ci }
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "=== docker build US -> $imageName ===" -ForegroundColor Cyan
docker build -f (Join-Path $usDir "Dockerfile") -t $imageName $usDir
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "=== docker compose recreate us ===" -ForegroundColor Cyan
Set-Location $datalensDir
docker compose `
    -f docker-compose.yaml `
    -f docker-compose.demo.yaml `
    -f docker-compose.local-dev.yaml `
    --env-file .env `
    up -d --force-recreate us

if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "Done. Проверка: curl /auth через US (после логина в UI)." -ForegroundColor Green
