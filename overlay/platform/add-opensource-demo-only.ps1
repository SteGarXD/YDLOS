# YDL OS: add OpenSource Demo workbook only (metadata). Your projects/collections/charts are NOT touched.
# Run from datalens folder with stack up: .\add-opensource-demo-only.ps1

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$env:APP_ENV = "prod"
$repoRoot = (Resolve-Path (Join-Path $datalensDir ".."))
$seedScript = Join-Path $repoRoot "datalens\postgres\seed-demo-data.sh"

Set-Location $datalensDir

Write-Host "=== Add OpenSource Demo only (no data loss) ===" -ForegroundColor Cyan
$containerName = "datalens-postgres-$env:APP_ENV"
if (-not (docker ps -q -f "name=$containerName")) {
    Write-Host "Postgres container $containerName is not running. Start the stack first." -ForegroundColor Red
    exit 1
}
Write-Host "Copying current seed script into container and running US-only seed..." -ForegroundColor Gray
docker cp $seedScript "${containerName}:/init/seed-demo-data.sh"
if ($LASTEXITCODE -ne 0) { Write-Host "Failed to copy script." -ForegroundColor Red; exit 1 }
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml exec postgres sed -i "s/\r$//" /init/seed-demo-data.sh
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml exec -e "POSTGRES_HOST=localhost" -e "INIT_DEMO_DATA=1" postgres bash /init/seed-demo-data.sh --us-only
if ($LASTEXITCODE -ne 0) { Write-Host "Seed failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Done. OpenSource Demo added or already present. Your data unchanged." -ForegroundColor Green
Write-Host "Check: http://localhost:8080" -ForegroundColor Gray
