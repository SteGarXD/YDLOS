#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Полный цикл: логические дампы БД (санитизированные) + опционально архив тома Postgres.

.EXAMPLE
  .\scripts\export-full-platform-for-git.ps1

.EXAMPLE
  .\scripts\export-full-platform-for-git.ps1 -IncludeCompengData -ArchiveVolume -VolumeColdSnapshot
#>

param(
    [switch]$Minimal,
    [switch]$IncludeCompengData,
    [int]$CompengDataMaxMb = 200,
    [ValidateSet('strict', 'standard')]
    [string]$SanitizeMode = 'strict',
    [switch]$ArchiveVolume,
    [switch]$VolumeColdSnapshot
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot

& (Join-Path $here "export-platform-state-for-git.ps1") `
    -Minimal:$Minimal `
    -IncludeCompengData:$IncludeCompengData `
    -CompengDataMaxMb $CompengDataMaxMb `
    -SanitizeMode $SanitizeMode

if ($ArchiveVolume) {
    & (Join-Path $here "archive-postgres-data-volume-for-git.ps1") -AllowDowntime:$VolumeColdSnapshot
}

Write-Host "[export-full-platform-for-git] All steps finished." -ForegroundColor Cyan
