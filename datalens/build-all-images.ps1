# YDL OS: собрать/подготовить ВСЕ образы под aeronavigatorbi (никаких akrasnov87 / datalens-tech).
# Запуск из папки datalens: .\build-all-images.ps1
# После: .\run-own-images.ps1 (прод без dev и без монтирования).

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$repoRoot = Resolve-Path (Join-Path $datalensDir "..")

# Auto-backup US data before full rebuild
Write-Host "=== 0. Auto-backup US data ===" -ForegroundColor Cyan
& (Join-Path $datalensDir "us-backup.ps1")
$ErrorActionPreference = "Stop"

$backendLib = Join-Path $repoRoot "components\datalens-backend\lib"
$uiDir = Join-Path $repoRoot "components\datalens-ui"
if (-not (Test-Path (Join-Path $backendLib "dl_core\dl_core\fields.py"))) {
    Write-Host "Error: components/datalens-backend/lib not found." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $uiDir "package.json"))) {
    Write-Host "Error: components/datalens-ui not found." -ForegroundColor Red
    exit 1
}

$tag = "0.2396.0"
$uiTag = "0.3498.0"
$pgTag = "16"
$temporalTag = "1.27.2"
$usTag = "0.413.0"
$metaTag = "0.50.0"
$authTag = "0.2.6"

Set-Location $repoRoot

# 1. Postgres (своя сборка)
Write-Host "=== 1. Postgres: aeronavigatorbi/datalens-postgres ===" -ForegroundColor Cyan
$postgresContext = Join-Path $datalensDir "postgres"
docker build -f (Join-Path $postgresContext "dockerfile") -t "aeronavigatorbi/datalens-postgres:$pgTag" $postgresContext
if ($LASTEXITCODE -ne 0) { exit 1 }

# 2. Temporal (своя сборка)
Write-Host ""
Write-Host "=== 2. Temporal: aeronavigatorbi/datalens-temporal ===" -ForegroundColor Cyan
$temporalContext = Join-Path $datalensDir "temporal"
docker build -f (Join-Path $temporalContext "dockerfile") -t "aeronavigatorbi/datalens-temporal:$temporalTag" $temporalContext
if ($LASTEXITCODE -ne 0) { exit 1 }

# 3. Backend API (своя сборка)
Write-Host ""
Write-Host "=== 3. Backend: aeronavigatorbi/datalens-control-api, aeronavigatorbi/datalens-data-api ===" -ForegroundColor Cyan
docker build -f datalens/build/Dockerfile.control-api -t "aeronavigatorbi/datalens-control-api:$tag" .
if ($LASTEXITCODE -ne 0) { exit 1 }
docker build -f datalens/build/Dockerfile.data-api -t "aeronavigatorbi/datalens-data-api:$tag" .
if ($LASTEXITCODE -ne 0) { exit 1 }

# 4. UI (своя сборка; при ошибке — pull+tag базового образа)
Write-Host ""
Write-Host "=== 4. UI: aeronavigatorbi/datalens-ui ===" -ForegroundColor Cyan
docker build -f datalens/build/Dockerfile.ui -t "aeronavigatorbi/datalens-ui:$uiTag" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "UI build failed. Pulling and tagging base image as aeronavigatorbi/datalens-ui:$uiTag so the stack can run." -ForegroundColor Yellow
    docker pull "akrasnov87/datalens-ui:$uiTag"
    docker tag "akrasnov87/datalens-ui:$uiTag" "aeronavigatorbi/datalens-ui:$uiTag"
}

# 5. US, Auth, Meta-manager — ретарг с akrasnov87 (своих Dockerfile нет)
Write-Host ""
Write-Host "=== 5. US, Auth, Meta-manager: pull + tag aeronavigatorbi ===" -ForegroundColor Cyan
docker pull "akrasnov87/datalens-us:$usTag"
docker tag "akrasnov87/datalens-us:$usTag" "aeronavigatorbi/datalens-us:$usTag"
docker pull "akrasnov87/datalens-auth:$authTag"
docker tag "akrasnov87/datalens-auth:$authTag" "aeronavigatorbi/datalens-auth:$authTag"
docker pull "akrasnov87/datalens-meta-manager:$metaTag"
docker tag "akrasnov87/datalens-meta-manager:$metaTag" "aeronavigatorbi/datalens-meta-manager:$metaTag"

Write-Host ""
Write-Host "Done. All images are under aeronavigatorbi. Start stack:" -ForegroundColor Green
Write-Host "  cd datalens; .\run-own-images.ps1"
