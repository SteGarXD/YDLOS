# Освобождение места на диске: Docker (кэш, неиспользуемые образы) и рекомендации по C/D.
# Запуск из папки datalens: .\scripts\free-disk-space.ps1
# Не удаляет образы aeronavigatorbi/*, используемые текущим стеком.

$ErrorActionPreference = "Stop"
$datalensDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $datalensDir

Write-Host "=== 1. Docker: build cache (often 10-20 GB) ===" -ForegroundColor Cyan
docker builder prune -a -f
Write-Host "Done." -ForegroundColor Green

Write-Host ""
Write-Host "=== 2. Docker: неиспользуемый образ dl-ui:local (~6.6 GB) ===" -ForegroundColor Cyan
docker rmi aeronavigatorbi/dl-ui:local 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "Removed aeronavigatorbi/dl-ui:local" -ForegroundColor Green } else { Write-Host "Image not found or in use (skip)." -ForegroundColor Gray }

Write-Host ""
Write-Host "=== 3. Docker: образы akrasnov87 (дубликаты после pull+tag, ~2.6 GB) ===" -ForegroundColor Cyan
@("akrasnov87/datalens-auth:0.2.6", "akrasnov87/datalens-meta-manager:0.50.0", "akrasnov87/datalens-us:0.413.0") | ForEach-Object {
    docker rmi $_ 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "  Removed $_" -ForegroundColor Green }
}
Write-Host "Done." -ForegroundColor Green

Write-Host ""
Write-Host "=== 4. Docker: остановленные контейнеры и неиспользуемые сети ===" -ForegroundColor Cyan
docker system prune -f
Write-Host "Done." -ForegroundColor Green

Write-Host ""
docker system df
Write-Host ""
Write-Host "--- Why free space on D: did not change ---" -ForegroundColor Yellow
Write-Host "Docker stores data in .vhdx files on D: (DockerDesktopWSL, WSL). Prune frees space INSIDE the disk, but the .vhdx file size does not shrink until you compact it."
Write-Host ""
Write-Host "To actually free space on D:"
Write-Host "  1. Quit Docker Desktop (tray -> Quit Docker Desktop)."
Write-Host "  2. Run PowerShell AS ADMINISTRATOR."
Write-Host "  3. cd D:\YDLOS\datalens; .\scripts\compact-docker-vhdx.ps1"
Write-Host "  4. Start Docker Desktop again. Check This PC - free space on D: should increase."
Write-Host ""
Write-Host "C: Clear %TEMP%, run: npm cache clean --force, clear VS Code / editor cache in AppData."
Write-Host ""
