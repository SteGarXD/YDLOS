# Compact Docker/WSL vhdx files on D: so Windows shows freed space after docker prune.
# VHDX grows when you use Docker but does NOT shrink automatically - compact does it.
# RUN AS ADMINISTRATOR. Close Docker Desktop before running (tray icon -> Quit Docker Desktop).
# Then: cd D:\YDLOS\datalens; .\scripts\compact-docker-vhdx.ps1

$ErrorActionPreference = "Stop"
$datalensDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $datalensDir

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Run PowerShell as Administrator (right-click -> Run as administrator)." -ForegroundColor Red
    Write-Host "Then: cd D:\YDLOS\datalens; .\scripts\compact-docker-vhdx.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Make sure Docker Desktop is CLOSED (Quit from tray). Press Enter to continue or Ctrl+C to cancel." -ForegroundColor Yellow
Read-Host

$vhdxPaths = @(
    "D:\DockerDesktopWSL\disk\docker_data.vhdx",
    "D:\WSL\docker_data.vhdx"
)

Write-Host "=== 1. Shutting down WSL (Docker Desktop must be closed) ===" -ForegroundColor Cyan
wsl --shutdown
Start-Sleep -Seconds 5

foreach ($path in $vhdxPaths) {
    if (-not (Test-Path $path)) {
        Write-Host "Skip (not found): $path" -ForegroundColor Gray
        continue
    }
    $sizeBefore = [math]::Round((Get-Item $path).Length / 1GB, 2)
    Write-Host ""
    Write-Host "=== 2. Compacting: $path (was $sizeBefore GB) ===" -ForegroundColor Cyan
    $diskpartScript = @"
select vdisk file="$path"
attach vdisk readonly
compact vdisk
detach vdisk
exit
"@
    $scriptFile = [System.IO.Path]::GetTempFileName()
    $diskpartScript | Out-File -FilePath $scriptFile -Encoding ASCII
    & diskpart /s $scriptFile
    Remove-Item -Force $scriptFile -ErrorAction SilentlyContinue
    $sizeAfter = [math]::Round((Get-Item $path).Length / 1GB, 2)
    Write-Host "After: $sizeAfter GB (freed $([math]::Round($sizeBefore - $sizeAfter, 2)) GB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done. Start Docker Desktop again. Check free space on D: in This PC." -ForegroundColor Green
