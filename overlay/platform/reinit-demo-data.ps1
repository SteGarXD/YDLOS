# YDL OS: пересоздать том Postgres и заново поднять стек — демо-данные загрузятся заново.
#
# ВНИМАНИЕ: этот скрипт УДАЛЯЕТ ВСЕ ДАННЫЕ (все проекты, коллекции, чарты, виджеты, настройки).
# Использовать только на чистой установке или если вы сознательно хотите начать с нуля.
# Если нужно только добавить OpenSource Demo и НЕ терять свои данные — используйте add-opensource-demo-only.ps1
#
# Запуск из папки datalens: .\reinit-demo-data.ps1
# После запуска подождите 1–2 минуты, пока Postgres выполнит init и seed-demo-data.

$ErrorActionPreference = "Stop"
$datalensDir = $PSScriptRoot
$env:APP_ENV = "prod"
$volumeName = "datalens-volume-prod"

Set-Location $datalensDir

Write-Host "=== 1. Остановка стека ===" -ForegroundColor Cyan
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml down --remove-orphans
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose down failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== 2. Удаление тома Postgres [$volumeName] ===" -ForegroundColor Cyan
$vol = docker volume ls -q --filter "name=$volumeName"
if ($vol) {
    docker volume rm $volumeName
    if ($LASTEXITCODE -ne 0) { Write-Host "Failed to remove volume $volumeName" -ForegroundColor Red; exit 1 }
    Write-Host "Volume removed." -ForegroundColor Green
} else {
    Write-Host "Volume $volumeName not found (already removed or not created)." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== 3. Запуск стека ===" -ForegroundColor Cyan
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d
if ($LASTEXITCODE -ne 0) { Write-Host "docker compose up failed." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Done. Postgres переинициализируется и загрузит демо-данные (1–2 мин)." -ForegroundColor Green
Write-Host "Проверка: http://localhost:8080 → OpenSource Demo → DataLens Demo" -ForegroundColor Gray
