# ============================================================
# YDL OS - switch existing components/ to same versions as container images
# Run from repo root: .\scripts\sync-components-to-container-versions.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$ComponentsDir = Join-Path $RepoRoot "components"
. (Join-Path $PSScriptRoot "component-versions-from-compose.ps1")

$Repos = @("datalens-ui", "datalens-backend", "datalens-us", "datalens-auth", "datalens-meta-manager")
$failed = @()

foreach ($name in $Repos) {
    $targetPath = Join-Path $ComponentsDir $name
    if (-not (Test-Path $targetPath)) {
        Write-Host "[SKIP] $name - not cloned. Run .\scripts\clone-components.ps1 first."
        continue
    }
    $tag = Get-ComponentVersion -Name $name
    if (-not $tag) { $tag = "main" }
    Push-Location $targetPath
    try {
        & git fetch origin --tags 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { & git fetch origin 2>&1 | Out-Null }
        $ref = $null
        & git rev-parse --verify "refs/tags/$tag" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $ref = $tag }
        if (-not $ref) {
            & git rev-parse --verify "refs/tags/v$tag" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { $ref = "v$tag" }
        }
        if (-not $ref) {
            Write-Warning "Tag $tag / v$tag not found in $name"
            $failed += $name
        } else {
            & git checkout $ref 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Could not checkout $ref in $name"
                $failed += $name
            } else {
                Write-Host "[OK] $name -> $ref"
            }
        }
    } finally {
        Pop-Location
    }
}

if ($failed.Count -gt 0) {
    Write-Warning "Failed: $($failed -join ', '). Check tags (e.g. 0.3498.0 or v0.3498.0) in GitHub."
    exit 1
}
Write-Host ""
Write-Host "Components now match container image versions. Override mounts backend from components/datalens-backend."