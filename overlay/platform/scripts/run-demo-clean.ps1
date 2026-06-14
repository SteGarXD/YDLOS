# Полный перезапуск стека через docker-compose.demo.yaml.
# Используйте, если после частичных перезапусков temporal даёт "lookup postgres: no such host"
# или ui не видит us-auth (ENOTFOUND). Все контейнеры создаются заново в одной сети.
# Запуск из папки datalens: .\scripts\run-demo-clean.ps1

$ErrorActionPreference = "Stop"
$datalensDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $datalensDir

$envFile = Join-Path $datalensDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Warning: .env not found. Create .env with POSTGRES_PASSWORD, US_MASTER_TOKEN, etc." -ForegroundColor Yellow
}

Write-Host "=== Stopping and removing all demo containers ===" -ForegroundColor Cyan
docker compose -f docker-compose.demo.yaml down

Write-Host ""
Write-Host "=== Starting full stack (postgres -> temporal -> ... -> ui) ===" -ForegroundColor Cyan
if (Test-Path $envFile) {
    docker compose -f docker-compose.demo.yaml --env-file $envFile up -d
} else {
    docker compose -f docker-compose.demo.yaml up -d
}
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Waiting for postgres to be healthy (temporal needs it)..." -ForegroundColor Gray
Start-Sleep -Seconds 15
docker compose -f docker-compose.demo.yaml ps

Write-Host ""
Write-Host "If temporal is still 'starting' or 'unhealthy', wait 30s and run: docker compose -f docker-compose.demo.yaml up -d" -ForegroundColor Gray
Write-Host "UI: http://localhost:8080" -ForegroundColor Green
