# Проверка пользователей авторизации (core.pd_users в БД US).
# Запуск из папки datalens: .\scripts\list-auth-users.ps1
# Требуется: Docker, контейнер postgres должен быть запущен.

$ErrorActionPreference = "Stop"
$envDir = Join-Path $PSScriptRoot ".."
$envFile = Join-Path $envDir ".env"
$appEnv = "prod"
$pgUser = "pg-user"
$pgDb = "pg-us-db"
$pgPass = "postgres"
if (Test-Path $envFile) {
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        if ($line -match '^\s*APP_ENV\s*=\s*(.+)$') { $appEnv = $Matches[1].Trim() }
        if ($line -match '^\s*POSTGRES_USER\s*=\s*(.+)$') { $pgUser = $Matches[1].Trim() }
        if ($line -match '^\s*POSTGRES_DB_US\s*=\s*(.+)$') { $pgDb = $Matches[1].Trim() }
        if ($line -match '^\s*POSTGRES_PASSWORD\s*=\s*(.+)$') { $pgPass = $Matches[1].Trim() }
    }
}
if ($env:POSTGRES_USER) { $pgUser = $env:POSTGRES_USER }
if ($env:POSTGRES_DB_US) { $pgDb = $env:POSTGRES_DB_US }
if ($env:POSTGRES_PASSWORD) { $pgPass = $env:POSTGRES_PASSWORD }
$containerName = "datalens-postgres-$appEnv"
# Use all parsed values so PSScriptAnalyzer sees they are used
$connectionInfo = "Container=$containerName DB=$pgDb User=$pgUser"

$query = @"
SELECT
  id,
  c_login AS login,
  CASE WHEN b_disabled THEN 'disabled' ELSE 'active' END AS status,
  CASE WHEN c_password IS NOT NULL AND c_password != '' THEN 'plain' ELSE '' END AS pwd_type,
  CASE WHEN s_hash IS NOT NULL AND s_hash != '' THEN 'hash' ELSE '' END AS hash_type
FROM core.pd_users
WHERE sn_delete = false
ORDER BY id;
"@

Write-Host $connectionInfo -ForegroundColor Cyan
Write-Host ""

$sqlCheck = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'pd_users');"
try {
    # psql may write WARNING (e.g. collation mismatch) to stderr; avoid script failure from ErrorActionPreference=Stop
    $prevErrAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $check = docker exec -e PGPASSWORD=$pgPass $containerName psql -U $pgUser -d $pgDb -t -A -c $sqlCheck 2>&1 | Where-Object { $_ -is [string] } | Select-Object -First 1
    $ErrorActionPreference = $prevErrAction
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: container or psql failed. Is postgres running? (docker ps | findstr postgres)" -ForegroundColor Red
        exit 1
    }
    $exists = ($check.Trim() -eq 't')
    if (-not $exists) {
        Write-Host "Table core.pd_users does NOT exist." -ForegroundColor Yellow
        Write-Host "Auth schema is created when INIT_DB_AUTH=1 at first postgres init, or by loading auth-data.sql." -ForegroundColor Yellow
        Write-Host "See TROUBLESHOOTING.md and README.md (Auth section)." -ForegroundColor Yellow
        Write-Host "Default users (after schema exists): master, admin, user. Default password: qwe-123" -ForegroundColor Gray
        exit 0
    }
    Write-Host "Auth users in core.pd_users:" -ForegroundColor Green
    docker exec -e PGPASSWORD=$pgPass $containerName psql -U $pgUser -d $pgDb -c $query
    Write-Host ""
    Write-Host "Password: stored as plain (c_password) or hash (s_hash). Default password from README: qwe-123" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
