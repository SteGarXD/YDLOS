# ============================================================
# YDL OS - clone component sources at VERSIONS FROM DOCKER-COMPOSE
# so components/ matches what runs in containers (images; backend overrides from components/datalens-backend).
# Run from repo root: .\scripts\clone-components.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$BaseUrl = "https://github.com/akrasnov87"
$RepoRoot = Split-Path $PSScriptRoot -Parent
$ComponentsDir = Join-Path $RepoRoot "components"

# Versions = image tags from datalens/docker-compose (akrasnov87/name:TAG)
. (Join-Path $PSScriptRoot "component-versions-from-compose.ps1")

$Repos = @(
    @{ Name = "datalens-ui";           Url = "$BaseUrl/datalens-ui.git" },
    @{ Name = "datalens-backend";     Url = "$BaseUrl/datalens-backend.git" },
    @{ Name = "datalens-us";          Url = "$BaseUrl/datalens-us.git" },
    @{ Name = "datalens-auth";        Url = "$BaseUrl/datalens-auth.git" },
    @{ Name = "datalens-meta-manager"; Url = "$BaseUrl/datalens-meta-manager.git" }
)

if (-not (Test-Path $ComponentsDir)) {
    New-Item -ItemType Directory -Path $ComponentsDir -Force | Out-Null
    Write-Host "Created: $ComponentsDir"
}

foreach ($repo in $Repos) {
    $targetPath = Join-Path $ComponentsDir $repo.Name
    $tag = Get-ComponentVersion -Name $repo.Name
    if (-not $tag) {
        Write-Warning "No version for $($repo.Name); using main."
        $tag = "main"
    }
    if (Test-Path $targetPath) {
        Write-Host "[SKIP] $($repo.Name) - already exists at $targetPath (sync with sync-components-to-container-versions.ps1 to switch version)"
        continue
    }
    Write-Host "[CLONE] $($repo.Name) @ $tag from $($repo.Url) ..."
    & git clone --depth 1 --branch $tag $repo.Url $targetPath 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  branch/tag '$tag' failed, trying 'v$tag'..."
        & git clone --depth 1 --branch "v$tag" $repo.Url $targetPath 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Clone failed for $($repo.Name) at $tag. Check tag exists (e.g. $tag or v$tag) and network."
        exit 1
    }
    Write-Host "  -> $targetPath @ $tag"
}

Write-Host ""
Write-Host "Done. Components match container image versions. Override mounts backend from components/datalens-backend."
Write-Host "See components\README.md and sync-components-to-container-versions.ps1 to refresh versions."