# ============================================================
# YDL OS - install npm dependencies in all components that have package.json
# Fixes IDE errors like "File '@gravity-ui/tsconfig/tsconfig' not found" in datalens-ui.
# Run from repo root: .\scripts\install-components-deps.ps1
# ============================================================
# Husky в package.json (prepare) ожидает .git в текущей папке; в монорепе корень — YDLOS.
# Отключаем установку husky в подпапках components/* (хуки при необходимости — в корне репо).
$env:HUSKY = "0"

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$ComponentsDir = Join-Path $RepoRoot "components"

$componentsWithPackageJson = @(
    "datalens-ui",
    "datalens-us",
    "datalens-auth",
    "datalens-meta-manager"
)

foreach ($name in $componentsWithPackageJson) {
    $dir = Join-Path $ComponentsDir $name
    $pkg = Join-Path $dir "package.json"
    if (-not (Test-Path $pkg)) {
        Write-Host "[SKIP] $name - no package.json"
        continue
    }
    Write-Host "[NPM] $name ..."
    Push-Location $dir
    try {
        if (Test-Path (Join-Path $dir "package-lock.json")) {
            npm ci 2>&1 | Out-Null
        } else {
            npm install 2>&1 | Out-Null
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "npm failed in $name"
            exit 1
        }
        Write-Host "  OK"
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "Done. IDE tsconfig errors in components should be resolved."
Write-Host "datalens-backend is Python; use venv/pip if you develop there."
