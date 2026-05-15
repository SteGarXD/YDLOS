# Очистка Docker (кэш сборки + неиспользуемые образы), пересборка UI с фиксом авторизации, полный перезапуск стека.
# Освобождает место на диске; оставляет только свежие образы после pull + одна сборка UI.
# Запуск из папки datalens: .\scripts\cleanup-docker-and-rebuild.ps1

$ErrorActionPreference = "Stop"
$datalensDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$repoRoot = (Resolve-Path (Join-Path $datalensDir "..")).Path
$uiDir = Join-Path $repoRoot "components\datalens-ui"
$envFile = Join-Path $datalensDir ".env"

Set-Location $datalensDir

if (-not (Test-Path (Join-Path $uiDir "package.json"))) {
    Write-Host "Error: components/datalens-ui not found." -ForegroundColor Red
    exit 1
}

# 1. Остановить стек
Write-Host "=== 1. Остановка контейнеров demo ===" -ForegroundColor Cyan
docker compose -f docker-compose.demo.yaml down
$ErrorActionPreference = "Continue"
docker compose -f docker-compose.demo.yaml down 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# 2. Очистка Docker: кэш сборки (освобождает много места) + только "висячие" образы (не трогаем aeronavigatorbi/*)
Write-Host ""
Write-Host "=== 2. Очистка кэша сборки Docker ===" -ForegroundColor Cyan
docker builder prune -a -f
Write-Host ""
Write-Host "=== 3. Удаление висячих образов (dangling) ===" -ForegroundColor Cyan
docker image prune -f
# Не делаем image prune -a: образы aeronavigatorbi/* локальные/собранные, их нет в публичном реестре.

# 4. Сборка UI из исходников (в т.ч. фикс куки при входе)
$uiTag = "0.3498.0"
$imageName = "aeronavigatorbi/datalens-ui:$uiTag"
Write-Host ""
Write-Host "=== 4. Сборка UI (components/datalens-ui) ===" -ForegroundColor Cyan
Set-Location $uiDir
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
$buildInfoPath = Join-Path $uiDir "dist\public\build\build-info.txt"
$serverPath = Join-Path $uiDir "dist\server"
if (-not (Test-Path $buildInfoPath)) {
    Write-Host "Error: build-info.txt not found after build." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $serverPath)) {
    Write-Host "Error: dist/server not found." -ForegroundColor Red
    exit 1
}
Write-Host "Build OK." -ForegroundColor Green

Write-Host ""
Write-Host "=== 5. Сборка образа UI (Docker) ===" -ForegroundColor Cyan
$prevErrAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$dockerResult = & docker build -f (Join-Path $repoRoot "datalens\build\Dockerfile.ui.from-host") -t aeronavigatorbi/dl-ui:local . 2>&1
$dockerResult | Write-Host
$dockerExit = $LASTEXITCODE
$ErrorActionPreference = $prevErrAction
if ($dockerExit -ne 0) { exit 1 }
docker tag aeronavigatorbi/dl-ui:local $imageName
Write-Host "Image: $imageName" -ForegroundColor Green

# 6. Запуск всего стека (образы postgres, temporal, us-auth и т.д. должны быть уже локально)
Set-Location $datalensDir
Write-Host ""
Write-Host "=== 6. Запуск стека (docker-compose.demo.yaml) ===" -ForegroundColor Cyan
if (Test-Path $envFile) {
    docker compose -f docker-compose.demo.yaml --env-file $envFile up -d
} else {
    docker compose -f docker-compose.demo.yaml up -d
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Если ошибка 'pull access denied' или 'image not found': образы aeronavigatorbi/* нужно получить локально." -ForegroundColor Yellow
    Write-Host "Выполните из папки datalens: .\build-all-images.ps1" -ForegroundColor Yellow
    Write-Host "После этого снова: .\scripts\cleanup-docker-and-rebuild.ps1 или .\scripts\run-demo-clean.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Waiting for postgres/temporal..." -ForegroundColor Gray
Start-Sleep -Seconds 15
docker compose -f docker-compose.demo.yaml ps

Write-Host ""
Write-Host "Done. UI пересобран с фиксом авторизации (куки при входе)." -ForegroundColor Green
Write-Host "  UI:   http://localhost:8080" -ForegroundColor Gray
Write-Host "  Login: master / qwe-123" -ForegroundColor Gray
Write-Host "  Если temporal ещё starting — подождите 30 с и: docker compose -f docker-compose.demo.yaml up -d" -ForegroundColor Gray
