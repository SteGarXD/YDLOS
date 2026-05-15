#!/usr/bin/env pwsh
# Docker cleanup script — run periodically to prevent disk bloat
# Usage: .\scripts\docker-cleanup.ps1

Write-Host "=== Docker Disk Cleanup ===" -ForegroundColor Cyan

# Auto-backup US data before cleanup
$usBackup = Join-Path $PSScriptRoot "..\datalens\us-backup.ps1"
if (Test-Path $usBackup) {
    Write-Host "`n[0/5] Auto-backup US data before cleanup..." -ForegroundColor Green
    & $usBackup
}

# Show disk space before
$dBefore = [math]::Round((Get-PSDrive D).Free/1GB, 1)
Write-Host "`nD: free before: $dBefore GB" -ForegroundColor Yellow

# 1. Remove stopped containers
Write-Host "`n[1/5] Removing stopped containers..." -ForegroundColor Green
docker container prune -f

# 2. Remove dangling images (untagged)
Write-Host "`n[2/5] Removing dangling images..." -ForegroundColor Green
docker image prune -f

# 3. Remove unused images (not used by any container)
Write-Host "`n[3/5] Removing unused images..." -ForegroundColor Green
docker image prune -a -f

# 4. Remove unused volumes
Write-Host "`n[4/5] Removing unused volumes..." -ForegroundColor Green
docker volume prune -f

# 5. Remove build cache
Write-Host "`n[5/5] Removing build cache..." -ForegroundColor Green
docker builder prune -f

# Show results
Write-Host "`n=== Results ===" -ForegroundColor Cyan
docker system df
$dAfter = [math]::Round((Get-PSDrive D).Free/1GB, 1)
Write-Host "`nD: free after: $dAfter GB (freed: $([math]::Round($dAfter - $dBefore, 1)) GB)" -ForegroundColor Yellow

# Check VHDX size
$vhdx = "D:\WSL\docker_data.vhdx"
if (Test-Path $vhdx) {
    $vhdxSize = [math]::Round((Get-Item $vhdx).Length/1GB, 2)
    Write-Host "Docker VHDX size: $vhdxSize GB" -ForegroundColor Yellow
    if ($vhdxSize -gt 50) {
        Write-Host "WARNING: VHDX is over 50 GB! Consider running 'wsl --manage docker-desktop-data --set-sparse true' or compact it." -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Green
