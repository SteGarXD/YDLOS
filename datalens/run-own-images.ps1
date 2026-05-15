# YDL OS: запуск стека только на образах aeronavigatorbi (prod).
# Сначала: .\build-all-images.ps1

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot

# Имена контейнеров: datalens-*-prod
$env:APP_ENV = "prod"

$images = @(
    "aeronavigatorbi/datalens-postgres:16",
    "aeronavigatorbi/datalens-temporal:1.27.2",
    "aeronavigatorbi/datalens-control-api:0.2396.0",
    "aeronavigatorbi/datalens-data-api:0.2396.0",
    "aeronavigatorbi/datalens-ui:0.3498.0",
    "aeronavigatorbi/datalens-us:0.413.0",
    "aeronavigatorbi/datalens-auth:0.2.6",
    "aeronavigatorbi/datalens-meta-manager:0.50.0"
)
foreach ($img in $images) {
    docker image inspect $img 2>&1 | Out-Null
    if (-not $?) {
        Write-Host "Image not found: $img. Run .\build-all-images.ps1 first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Stopping stack if running..." -ForegroundColor Cyan
Set-Location $datalensDir
$ErrorActionPreference = "Continue"
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml down --remove-orphans 2>&1 | Out-Null

Write-Host "Starting stack (aeronavigatorbi, prod)..." -ForegroundColor Cyan
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed (exit $LASTEXITCODE)." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Done. Open http://localhost:8080 (Aeronavigator BI)." -ForegroundColor Green
