# Сборка us-auth на Windows (auth включён).
# Если git.mobwal.com недоступен — сначала нужен node_modules в components/datalens-auth/app (см. README там).

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$appPath = Join-Path $root "components\datalens-auth\app"
$nodeModulesMarker = Join-Path $appPath "node_modules\args-parser\package.json"

if (Test-Path $nodeModulesMarker) {
    Write-Host "node_modules найден, собираю образ us-auth..."
    Set-Location (Join-Path $root "datalens")
    docker compose build us-auth
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Готово. Запуск: docker compose up -d"
        docker compose up -d
    }
} else {
    Write-Host "В components\datalens-auth\app нет node_modules (нет доступа к git.mobwal.com)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Варианты для Windows:"
    Write-Host "  1) Перенести папку app с node_modules с Linux/VPN (см. components/datalens-auth/README.md, раздел 'Windows локально')."
    Write-Host "  2) Загрузить готовый образ: docker load -i datalens-auth-0.2.6.tar"
    Write-Host "  3) Включить VPN до сети с git.mobwal.com и выполнить:"
    Write-Host "     cd $appPath"
    Write-Host "     npm install"
    Write-Host "     cd $root\datalens"
    Write-Host "     docker compose build us-auth"
    Write-Host ""
    exit 1
}
