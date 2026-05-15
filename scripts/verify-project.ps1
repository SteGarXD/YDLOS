# ============================================================
# YDL OS - verify project: component versions = compose, compose valid
# Run from repo root: .\scripts\verify-project.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Split-Path $PSScriptRoot -Parent)
$DatalensDir = Join-Path $RepoRoot "datalens"
$failed = 0

Write-Host "=== 1. Component versions vs docker-compose ===" -ForegroundColor Cyan
. (Join-Path $PSScriptRoot "component-versions-from-compose.ps1")
$expected = @{
    'datalens-control-api'   = '0.2396.0'
    'datalens-data-api'     = '0.2396.0'
    'datalens-ui'           = '0.3498.0'
    'datalens-us'            = '0.413.0'
    'datalens-auth'          = '0.2.6'
    'datalens-meta-manager'  = '0.50.0'
}
$composePath = Join-Path $DatalensDir "docker-compose.yaml"
$composeText = Get-Content $composePath -Raw
foreach ($key in $expected.Keys) {
    $tag = $expected[$key]
    if ($composeText -match "akrasnov87/${key}:(\S+)") {
        $actual = $Matches[1]
        if ($actual -eq $tag) {
            Write-Host "  OK $key : $tag"
        } else {
            Write-Host "  FAIL $key : compose has $actual, component-versions expects $tag" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "=== 2. docker compose config (datalens/) ===" -ForegroundColor Cyan
Push-Location $DatalensDir
try {
    $out = & docker compose -f docker-compose.yaml -f docker-compose.override.yaml config 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  FAIL docker compose config" -ForegroundColor Red
        $out
        $failed++
    } else {
        Write-Host "  OK docker compose config"
    }
} finally {
    Pop-Location
}

Write-Host ""
if ($failed -gt 0) {
    Write-Host "Verification failed: $failed issue(s)" -ForegroundColor Red
    exit 1
}
Write-Host "Verification passed. Components = container versions; backend overrides from components/datalens-backend." -ForegroundColor Green
