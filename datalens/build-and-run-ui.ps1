# YDL OS: полная сборка UI из исходников (все правки: сводная, иконки, брендинг) + образ + перезапуск ui/ui-api.
# Запуск из папки datalens: .\build-and-run-ui.ps1
# Проверка: http://localhost:8080/build/build-info.txt — должно быть "Aeronavigator BI custom build"

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $datalensDir "..")
$uiDir = Join-Path $repoRoot "components\datalens-ui"

if (-not (Test-Path (Join-Path $uiDir "package.json"))) {
    Write-Host "Error: components/datalens-ui not found." -ForegroundColor Red
    exit 1
}

# Auto-backup US data before rebuild (collections, charts, dashboards, connections)
Write-Host "=== 0. Auto-backup US data ===" -ForegroundColor Cyan
& (Join-Path $datalensDir "us-backup.ps1")
$ErrorActionPreference = "Stop"

$uiTag = "0.3498.0"
$imageName = "aeronavigatorbi/datalens-ui:$uiTag"

# 1. Сборка UI на хосте (все правки из components/datalens-ui)
Write-Host "=== 1. Сборка UI (components/datalens-ui) ===" -ForegroundColor Cyan
Set-Location $uiDir
# Фавикон: SVG из datalens/assets/favicorn.svg (при сборке copy-public-assets.js копирует в dist/public/favicorn.svg). Лого на странице входа — ui/assets/icons/logo-aeronavigator.svg.
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max_old_space_size=4096"
$env:APP_BUILDER_CDN = "false"
npm run i18n:prepare
if ($LASTEXITCODE -ne 0) { exit 1 }
npx app-builder build
if ($LASTEXITCODE -ne 0) { exit 1 }
node scripts/copy-public-assets.js
if ($LASTEXITCODE -ne 0) { exit 1 }

# Проверка: в сборке есть фронт, сервер (окраска сводной, ЗПК, колонки) и метка
$buildInfoPath = Join-Path $uiDir "dist\public\build\build-info.txt"
$serverPath = Join-Path $uiDir "dist\server"
if (-not (Test-Path $buildInfoPath)) {
    Write-Host "Error: build-info.txt not found after build." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $serverPath)) {
    Write-Host "Error: dist/server not found - needed for pivot coloring (YDL OS)." -ForegroundColor Red
    exit 1
}
Write-Host "Build OK (public + server + build-info)." -ForegroundColor Green

# 2. Сборка образа from-host (контекст = components/datalens-ui)
Write-Host ""
Write-Host "=== 2. Сборка образа UI (from-host) ===" -ForegroundColor Cyan
# Docker пишет прогресс в stderr — PowerShell трактует это как ошибку и останавливает скрипт. Временно не останавливаться.
$prevErrAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$dockerResult = & docker build -f (Join-Path $repoRoot "datalens\build\Dockerfile.ui.from-host") -t aeronavigatorbi/dl-ui:local . 2>&1
$dockerResult | Write-Host
$dockerExit = $LASTEXITCODE
$ErrorActionPreference = $prevErrAction
if ($dockerExit -ne 0) { exit 1 }
docker tag aeronavigatorbi/dl-ui:local $imageName
$imageId = docker image inspect --format '{{.Id}}' aeronavigatorbi/dl-ui:local
Write-Host "Image: $imageName ($imageId)" -ForegroundColor Green

# 3. Перезапуск ui, ui-api
Write-Host ""
Write-Host "=== 3. Перезапуск ui, ui-api ===" -ForegroundColor Cyan
Set-Location $datalensDir
$env:APP_ENV = "prod"
docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.own-images.yaml up -d --force-recreate ui ui-api
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Done. Custom UI image is running." -ForegroundColor Green
Write-Host "  Image: $imageName" -ForegroundColor Gray
Write-Host "  Check: http://localhost:8080/build/build-info.txt" -ForegroundColor Gray
Write-Host "  App:   http://localhost:8080" -ForegroundColor Gray
