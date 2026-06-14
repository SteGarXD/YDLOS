# Сброс пароля пользователей авторизации. Дефолтный пароль: qwe-123.
# Запуск из папки datalens:
#   .\scripts\reset-auth-password.ps1              — сбросить пароль для master, admin, user на qwe-123
#   .\scripts\reset-auth-password.ps1 master      — сбросить только master на qwe-123
#   .\scripts\reset-auth-password.ps1 master xxx   — сбросить master на пароль xxx

$ErrorActionPreference = "Stop"
$envDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $envDir ".env"
$appEnv = "prod"
$pgUser = "pg-user"
$pgDb = "pg-us-db"
$pgPass = "postgres"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*APP_ENV\s*=\s*(.+)$') { $appEnv = $Matches[1].Trim() }
        if ($_ -match '^\s*POSTGRES_USER\s*=\s*(.+)$') { $pgUser = $Matches[1].Trim() }
        if ($_ -match '^\s*POSTGRES_DB_US\s*=\s*(.+)$') { $pgDb = $Matches[1].Trim() }
        if ($_ -match '^\s*POSTGRES_PASSWORD\s*=\s*(.+)$') { $pgPass = $Matches[1].Trim() }
    }
}
if ($env:POSTGRES_USER) { $pgUser = $env:POSTGRES_USER }
if ($env:POSTGRES_DB_US) { $pgDb = $env:POSTGRES_DB_US }
if ($env:POSTGRES_PASSWORD) { $pgPass = $env:POSTGRES_PASSWORD }
$containerName = "datalens-postgres-$appEnv"

$defaultPassword = "qwe-123"
# Режим: без аргументов — все три пользователя на qwe-123; иначе один пользователь
$logins = @()
$newPassword = $defaultPassword
if ($args.Count -eq 0) {
    $logins = @("master", "admin", "user")
} elseif ($args.Count -ge 1) {
    $logins = @($args[0])
    if ($args.Count -ge 2) { $newPassword = $args[1] }
}

# Экранирование одинарных кавычек в пароле для psql
$passEscaped = $newPassword -replace "'", "''"

Write-Host "Container=$containerName DB=$pgDb" -ForegroundColor Cyan
foreach ($login in $logins) {
    $sql = "SELECT core.sf_reset_pwd('$login', '$passEscaped');"
    Write-Host "Resetting password for '$login' ..." -ForegroundColor Gray
    $out = docker exec -e PGPASSWORD=$pgPass $containerName psql -U $pgUser -d $pgDb -t -A -c $sql 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error for '$login': $out" -ForegroundColor Red
    } else {
        Write-Host "  $login -> OK" -ForegroundColor Green
    }
}
Write-Host ""
if ($logins.Count -eq 3) {
    Write-Host "Done. All users now have password: $defaultPassword. Log in with master / $defaultPassword (or admin, user)." -ForegroundColor Green
} else {
    Write-Host "Done. Log in with $($logins[0]) / $newPassword" -ForegroundColor Green
}
