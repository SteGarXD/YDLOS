# Run UI using the image's built-in build (no local build mount).
# Usage: .\scripts\run-ui-with-image-build.ps1
# Run stack with aeronavigatorbi images (prod). See run-own-images.ps1.

$ErrorActionPreference = "Stop"
$datalensDir = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { Split-Path $MyInvocation.MyCommand.Path -Parent }
if (-not (Test-Path (Join-Path $datalensDir "docker-compose.yaml"))) {
    $datalensDir = Join-Path (Get-Location) "datalens"
}
Set-Location $datalensDir

Write-Host "Restarting UI (aeronavigatorbi image)..." -ForegroundColor Cyan
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d ui --force-recreate
if ($LASTEXITCODE -ne 0) { throw "docker compose exited with $LASTEXITCODE" }
Write-Host "Done. Open http://localhost:8080" -ForegroundColor Green
