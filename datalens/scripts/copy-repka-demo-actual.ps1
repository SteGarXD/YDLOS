# Копирует последний бэкап с Репка + OpenSource Demo в backups/us-backup-repka-demo-actual.sql
$ErrorActionPreference = "Stop"
$backupsDir = Join-Path $PSScriptRoot "..\backups"
$all = Get-ChildItem $backupsDir -Filter "us-backup-*.sql" -ErrorAction SilentlyContinue
$with = $all | Where-Object {
    $c = Get-Content $_.FullName -Raw -Encoding UTF8
    $c -match "Repka" -and ($c -match "OpenSource Demo" -or $c -match "opensourcedemo")
}
$pick = $with | Sort-Object Name -Descending | Select-Object -First 1
if ($pick) {
    Copy-Item $pick.FullName (Join-Path $backupsDir "us-backup-repka-demo-actual.sql") -Force
    Write-Host "Created us-backup-repka-demo-actual.sql from $($pick.Name)"
} else {
    Write-Host "No backup with Repka+Demo found in $backupsDir"
    exit 1
}
