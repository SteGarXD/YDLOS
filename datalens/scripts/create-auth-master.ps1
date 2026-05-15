# Создание пользователей авторизации (master, admin, user) в core.pd_users.
# Запуск из папки datalens: .\scripts\create-auth-master.ps1
# Требуется: Docker, контейнер postgres запущен. Если таблицы core.pd_users нет — сначала примените auth-data.sql (см. вывод скрипта).

$ErrorActionPreference = "Stop"
$datalensRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envDir = $datalensRoot
$envFile = Join-Path $envDir ".env"
$appEnv = "prod"
$pgUser = "pg-user"
$pgDb = "pg-us-db"
$pgPass = "postgres"
if (Test-Path $envFile) {
    # foreach (не ForEach-Object): присваивания в том же scope, иначе PSScriptAnalyzer считает переменные «неиспользуемыми»
    foreach ($line in Get-Content $envFile) {
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

$sqlCheck = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'pd_users');"
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
    Write-Host "Table core.pd_users does NOT exist. Create auth schema first." -ForegroundColor Yellow
    $authDataPath = Join-Path $datalensRoot "..\components\datalens-us\scripts\demo\auth-data.sql"
    $authDataPath = (Resolve-Path $authDataPath -ErrorAction SilentlyContinue).Path
    if (-not $authDataPath -or -not (Test-Path $authDataPath)) {
        $authDataPath = "components/datalens-us/scripts/demo/auth-data.sql"
        Write-Host "From repo root, apply: Get-Content $authDataPath | docker exec -i $containerName psql -U $pgUser -d $pgDb -v ON_ERROR_STOP=1" -ForegroundColor Cyan
    } else {
        Write-Host "Apply schema (from datalens folder):" -ForegroundColor Cyan
        Write-Host "  Get-Content '$authDataPath' | docker exec -i $containerName psql -U $pgUser -d $pgDb -v ON_ERROR_STOP=1" -ForegroundColor White
    }
    Write-Host "Or set INIT_DB_AUTH=1 in .env and recreate postgres volume, then run this script again." -ForegroundColor Gray
    exit 0
}

$createUsers = @"
SELECT core.sf_create_user('master', 'qwe-123', '', '[\"master\", \"admin\"]', 'datalens-demo');
SELECT core.sf_create_user('admin', 'qwe-123', '', '[\"admin\"]', 'datalens-demo');
SELECT core.sf_create_user('user', 'qwe-123', '', '[\"datalens\"]', 'datalens-demo');
"@
Write-Host "Creating auth users (master, admin, user) in $containerName / $pgDb ..." -ForegroundColor Cyan
docker exec -e PGPASSWORD=$pgPass $containerName psql -U $pgUser -d $pgDb -v ON_ERROR_STOP=1 -c $createUsers 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "One or more users may already exist (duplicate login). Try login: master / qwe-123" -ForegroundColor Yellow
    exit 0
}
Write-Host "Done. You can log in with master / qwe-123" -ForegroundColor Green
