# YDL OS: запуск стека на образах aeronavigatorbi с demo-портами (как docker-compose.demo.yaml).
# Все контейнеры с тегами aeronavigatorbi. Сначала выполните: .\build-all-images.ps1

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot

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

Set-Location $datalensDir
Write-Host "Stopping stack if running..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.own-images.yaml down --remove-orphans 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host "Starting stack (aeronavigatorbi + demo ports)..." -ForegroundColor Cyan
$envFile = Join-Path $datalensDir ".env"
if (Test-Path $envFile) {
    docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.own-images.yaml --env-file $envFile up -d
} else {
    docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.own-images.yaml up -d
}
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed (exit $LASTEXITCODE)." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Done. All containers use aeronavigatorbi. Open http://localhost:8080" -ForegroundColor Green
