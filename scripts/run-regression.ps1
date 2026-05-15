# ============================================================
# YDL OS - run regression: verify-project + optional reminder
# Run from repo root: .\scripts\run-regression.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Split-Path $PSScriptRoot -Parent)

Write-Host "=== Running verify-project.ps1 ===" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "verify-project.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== Regression reminder ===" -ForegroundColor Cyan
Write-Host "Manual checks: see docs\REGRESSION-CHECKLIST.md"
Write-Host "  - docker compose up in datalens/ ; UI :8080"
Write-Host "  - Login (local / OIDC), dashboard, filters, pivot with footer/2-level head"
Write-Host "  - Meridian-Demo iframe + Silent SSO when available"
Write-Host ""
