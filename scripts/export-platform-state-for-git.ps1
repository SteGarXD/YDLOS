#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Полный экспорт логического состояния PostgreSQL стека DataLens в Git-безопасные файлы.

.DESCRIPTION
  Дампы pg_dump + scripts/sanitize-pg-dump.cjs (--mode strict по умолчанию).
  Охват: US, meta-manager, auth, demo, compeng (схема + опционально данные), temporal (схема).

  Результат: exports/platform-state/sanitized/

.PARAMETER Minimal
  Только US + meta-manager + схема compeng (как в первой версии скрипта).

.PARAMETER IncludeCompengData
  Включить data-only дамп pg-compeng-db (может быть очень большим).

.PARAMETER SanitizeMode
  strict (по умолчанию) или standard; см. sanitize-pg-dump.cjs.

.PARAMETER SkipUs / SkipMetaManager / SkipCompengSchema
  Точечное отключение частей (для отладки).

.PARAMETER CompengDataMaxMb
  Верхний предел размера data-only дампа compeng при -IncludeCompengData (по умолчанию 200).
#>

param(
    [switch]$Minimal,
    [switch]$IncludeCompengData,
    [ValidateRange(1, 8192)]
    [int]$CompengDataMaxMb = 200,
    [ValidateSet('strict', 'standard')]
    [string]$SanitizeMode = 'strict',
    [switch]$SkipUs,
    [switch]$SkipMetaManager,
    [switch]$SkipCompengSchema
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$sanitizer = Join-Path $PSScriptRoot "sanitize-pg-dump.cjs"
$outDir = Join-Path $repoRoot "exports\platform-state\sanitized"
$datalensDir = Join-Path $repoRoot "datalens"
$envFile = Join-Path $datalensDir ".env"

if (-not (Test-Path $sanitizer)) {
    Write-Error "Not found: $sanitizer"
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required in PATH."
}

New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# Имена БД из datalens/.env или дефолты compose
$dbUs = "pg-us-db"
$dbMeta = "pg-meta-manager-db"
$dbCompeng = "pg-compeng-db"
$dbAuth = "pg-auth-db"
$dbDemo = "pg-demo-db"
$dbTemporal = "pg-temporal-db"
$dbTemporalVis = "pg-temporal-visibility-db"

if (Test-Path $envFile) {
    Get-Content $envFile -ErrorAction SilentlyContinue | ForEach-Object {
        if ($_ -match '^\s*POSTGRES_DB_US\s*=\s*(.+)\s*$') { $dbUs = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_META_MANAGER\s*=\s*(.+)\s*$') { $dbMeta = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_COMPENG\s*=\s*(.+)\s*$') { $dbCompeng = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_AUTH\s*=\s*(.+)\s*$') { $dbAuth = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_DEMO\s*=\s*(.+)\s*$') { $dbDemo = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_TEMPORAL\s*=\s*(.+)\s*$') { $dbTemporal = $matches[1].Trim().Trim('"').Trim("'") }
        if ($_ -match '^\s*POSTGRES_DB_TEMPORAL_VISIBILITY\s*=\s*(.+)\s*$') { $dbTemporalVis = $matches[1].Trim().Trim('"').Trim("'") }
    }
}

$containerName = docker ps --filter "name=datalens-postgres" --format "{{.Names}}" 2>&1 |
    Where-Object { $_ -is [string] -and $_ } |
    Select-Object -First 1

if (-not $containerName) {
    Write-Error "No running container matching name=datalens-postgres. Start the stack first."
}

function Test-PostgresDb {
    param([string]$Name)
    $safe = $Name -replace "'", "''"
    $sql = "SELECT 1 FROM pg_database WHERE datname = '$safe'"
    $r = docker exec $containerName psql -U pg-user -d postgres -tAc $sql 2>$null
    return ($r -match '^\s*1\s*$')
}

function Write-DbFootprint {
    param([string]$DbName, [string]$OutJsonPath)
    if (-not (Test-PostgresDb $DbName)) {
        return $false
    }
    $safe = $DbName -replace "'", "''"
    $q = @"
SELECT json_build_object(
  'database', current_database(),
  'public_tables', (SELECT count(*)::int FROM pg_tables WHERE schemaname = 'public'),
  'total_nontemp_tables', (SELECT count(*)::int FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema'))
);
"@
    $json = docker exec $containerName psql -U pg-user -d $DbName -tAc $q 2>$null
    if ($json -and $json.Trim().Length -gt 5) {
        $json.Trim() | Set-Content -Path $OutJsonPath -Encoding utf8
        return $true
    }
    return $false
}

function Invoke-SanitizedDump {
    param(
        [string]$BashCmd,
        [string]$OutFile,
        [int]$MinBytes = 50,
        [switch]$Optional
    )
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        docker exec $containerName bash -c $BashCmd 2>$null | Out-File -FilePath $tmp -Encoding utf8
        $len = (Get-Item $tmp).Length
        if ($len -lt $MinBytes) {
            if (-not $Optional) {
                Write-Warning "Dump empty or tiny ($len bytes), skipping: $OutFile"
            }
            return $false
        }
        & node $sanitizer --in $tmp --out $OutFile --mode $SanitizeMode
        $mb = [math]::Round((Get-Item $OutFile).Length / 1MB, 2)
        Write-Host "  OK $OutFile ($mb MB)" -ForegroundColor Green
        return $true
    } finally {
        Remove-Item -Force $tmp -ErrorAction SilentlyContinue
    }
}

Write-Host "[export-platform-state-for-git] Container: $containerName" -ForegroundColor Cyan
Write-Host "[export-platform-state-for-git] Out: $outDir | sanitize=$SanitizeMode | minimal=$Minimal" -ForegroundColor Cyan

$exportedFiles = [System.Collections.Generic.List[string]]::new()
$footprintFiles = [System.Collections.Generic.List[string]]::new()
$notes = [System.Collections.Generic.List[string]]::new()

# --- US ---
if (-not $SkipUs) {
    $usCmd = @"
pg_dump --host localhost --port 5432 --username pg-user --dbname $dbUs --inserts --column-inserts --data-only --table entries --table revisions --table workbooks --table collections --table links --on-conflict-do-nothing 2>/dev/null
"@
    $f = Join-Path $outDir "pg-us-db.sql"
    if (Invoke-SanitizedDump -BashCmd $usCmd -OutFile $f) { $exportedFiles.Add("pg-us-db.sql") }
    $fp = Join-Path $outDir "footprint-us.json"
    if (Write-DbFootprint -DbName $dbUs -OutJsonPath $fp) { $footprintFiles.Add("footprint-us.json") }
}

# --- Meta manager ---
if (-not $SkipMetaManager) {
    $mmCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbMeta --inserts --column-inserts --data-only 2>/dev/null"
    $f = Join-Path $outDir "pg-meta-manager-db.sql"
    if (Invoke-SanitizedDump -BashCmd $mmCmd -OutFile $f -MinBytes 30) { $exportedFiles.Add("pg-meta-manager-db.sql") }
    $fp = Join-Path $outDir "footprint-meta-manager.json"
    if (Write-DbFootprint -DbName $dbMeta -OutJsonPath $fp) { $footprintFiles.Add("footprint-meta-manager.json") }
}

# --- CompEng schema ---
if (-not $SkipCompengSchema) {
    $ceCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbCompeng --schema-only 2>/dev/null"
    $f = Join-Path $outDir "pg-compeng-db.schema.sql"
    if (Invoke-SanitizedDump -BashCmd $ceCmd -OutFile $f) { $exportedFiles.Add("pg-compeng-db.schema.sql") }
    $fp = Join-Path $outDir "footprint-compeng.json"
    if (Write-DbFootprint -DbName $dbCompeng -OutJsonPath $fp) { $footprintFiles.Add("footprint-compeng.json") }
}

if ($Minimal) {
    $notes.Add("Minimal mode: auth, demo, temporal, compeng data skipped.")
} else {
    # --- Auth ---
    if (Test-PostgresDb $dbAuth) {
        $authCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbAuth --inserts --column-inserts --data-only 2>/dev/null"
        $f = Join-Path $outDir "pg-auth-db.sql"
        if (Invoke-SanitizedDump -BashCmd $authCmd -OutFile $f -MinBytes 30 -Optional) { $exportedFiles.Add("pg-auth-db.sql") }
        $fp = Join-Path $outDir "footprint-auth.json"
        if (Write-DbFootprint -DbName $dbAuth -OutJsonPath $fp) { $footprintFiles.Add("footprint-auth.json") }
    } else {
        $notes.Add("Database $dbAuth not present (INIT_DB_AUTH=0?) - skipped.")
    }

    # --- Demo ---
    if (Test-PostgresDb $dbDemo) {
        $demoCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbDemo --inserts --column-inserts --data-only 2>/dev/null"
        $f = Join-Path $outDir "pg-demo-db.sql"
        if (Invoke-SanitizedDump -BashCmd $demoCmd -OutFile $f -MinBytes 30 -Optional) { $exportedFiles.Add("pg-demo-db.sql") }
        $fp = Join-Path $outDir "footprint-demo.json"
        if (Write-DbFootprint -DbName $dbDemo -OutJsonPath $fp) { $footprintFiles.Add("footprint-demo.json") }
    } else {
        $notes.Add("Database $dbDemo not present - skipped.")
    }

    # --- Temporal: только схема ---
    if (Test-PostgresDb $dbTemporal) {
        $tCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbTemporal --schema-only 2>/dev/null"
        $f = Join-Path $outDir "pg-temporal-db.schema.sql"
        if (Invoke-SanitizedDump -BashCmd $tCmd -OutFile $f -MinBytes 30 -Optional) { $exportedFiles.Add("pg-temporal-db.schema.sql") }
    } else {
        $notes.Add("Database $dbTemporal not present - skipped.")
    }

    if (Test-PostgresDb $dbTemporalVis) {
        $tvCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbTemporalVis --schema-only 2>/dev/null"
        $f = Join-Path $outDir "pg-temporal-visibility-db.schema.sql"
        if (Invoke-SanitizedDump -BashCmd $tvCmd -OutFile $f -MinBytes 30 -Optional) { $exportedFiles.Add("pg-temporal-visibility-db.schema.sql") }
    } else {
        $notes.Add("Database $dbTemporalVis not present - skipped.")
    }
}

# --- CompEng data (опционально) ---
if ($IncludeCompengData -and (Test-PostgresDb $dbCompeng)) {
    $maxMb = $CompengDataMaxMb
    $cedCmd = "pg_dump --host localhost --port 5432 --username pg-user --dbname $dbCompeng --inserts --column-inserts --data-only 2>/dev/null"
    $f = Join-Path $outDir "pg-compeng-db.data.sql"
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        docker exec $containerName bash -c $cedCmd 2>$null | Out-File -FilePath $tmp -Encoding utf8
        $szMb = [math]::Round((Get-Item $tmp).Length / 1MB, 2)
        if ($szMb -gt $maxMb) {
            $notes.Add("CompEng data dump skipped: ${szMb} MB exceeds limit ${maxMb} MB (use datalens backup for full raw dump).")
        } else {
            & node $sanitizer --in $tmp --out $f --mode $SanitizeMode
            $exportedFiles.Add("pg-compeng-db.data.sql")
            Write-Host "  OK $f ($szMb MB)" -ForegroundColor Green
        }
    } finally {
        Remove-Item -Force $tmp -ErrorAction SilentlyContinue
    }
}

# --- pg_dump --version ---
$pgVer = docker exec $containerName psql -U pg-user -d postgres -tAc "SHOW server_version;" 2>$null
$pgVer = if ($pgVer) { $pgVer.Trim() } else { "unknown" }

# --- MANIFEST.json ---
$stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"
$manifest = [ordered]@{
    exportedAt      = $stamp
    sanitizeMode    = $SanitizeMode
    minimalExport   = [bool]$Minimal
    includeCompengData = [bool]$IncludeCompengData
    compengDataMaxMb   = $CompengDataMaxMb
    postgresContainer = $containerName
    postgresVersion = $pgVer
    databases       = @{
        us                 = $dbUs
        metaManager        = $dbMeta
        compeng            = $dbCompeng
        auth               = $dbAuth
        demo               = $dbDemo
        temporal           = $dbTemporal
        temporalVisibility = $dbTemporalVis
    }
    files           = @()
    notes           = @($notes)
}

$manifestNames = @(@($exportedFiles) + @($footprintFiles) | Select-Object -Unique)
foreach ($n in $manifestNames) {
    $p = Join-Path $outDir $n
    if (-not (Test-Path $p)) { continue }
    $fi = Get-Item $p
    $h = (Get-FileHash -Path $fi.FullName -Algorithm SHA256).Hash
    $manifest.files += @{
        name   = $n
        bytes  = $fi.Length
        sha256 = $h.ToLowerInvariant()
    }
}

$manifestPath = Join-Path $outDir "MANIFEST.json"
$manifest | ConvertTo-Json -Depth 8 | Set-Content -Path $manifestPath -Encoding utf8
Write-Host "  OK $manifestPath" -ForegroundColor Green

# Совместимость: короткий EXPORT_META.txt
$metaPath = Join-Path $outDir "EXPORT_META.txt"
@"
EXPORT_TIMESTAMP=$stamp
POSTGRES_CONTAINER=$containerName
POSTGRES_VERSION=$pgVer
SANITIZE_MODE=$SanitizeMode
MINIMAL=$($Minimal.ToString().ToLowerInvariant())
MANIFEST_JSON=MANIFEST.json
NOTE=See exports/platform-state/README.md for full scope and restore.
"@ | Set-Content -Path $metaPath -Encoding utf8

Write-Host "[export-platform-state-for-git] Done." -ForegroundColor Cyan
