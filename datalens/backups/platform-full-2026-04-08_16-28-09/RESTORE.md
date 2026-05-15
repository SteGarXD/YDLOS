# Platform Restore Guide (snapshot 2026-04-08_16-28-09)

Этот документ восстанавливает платформу из snapshot, зафиксированного в git.

## 0) Что нужно

- Docker + Docker Compose
- Git
- Доступ к репозиторию `https://git.aeronavigator.ru/Aeronavigator/ydl-os.git`
- Файл snapshot в репозитории: `datalens/backups/platform-full-2026-04-08_16-28-09`

## 1) Восстановить кодовую базу

Вариант A (обычный):

```powershell
git clone https://git.aeronavigator.ru/Aeronavigator/ydl-os.git
cd ydl-os
git checkout development
```

Вариант B (из bundle офлайн):

```powershell
cd <папка_с_snapshot>/git
git clone ydl-os-all-2026-04-08_16-28-09.bundle ydl-os-restored
cd ydl-os-restored
git checkout development
```

## 2) Восстановить env

```powershell
Copy-Item "datalens/backups/platform-full-2026-04-08_16-28-09/env/.env" "datalens/.env" -Force
```

Если `.env` отсутствует в snapshot, вручную заполнить `datalens/.env` по `env/.env.example`.

## 3) Восстановить Docker volume данные

Snapshot содержит архив volume:
- `datalens/backups/platform-full-2026-04-08_16-28-09/volumes/datalens-volume-prod.tar.gz`

Создать volume и развернуть данные:

```powershell
docker volume create datalens-volume-prod

docker run --rm `
  -v datalens-volume-prod:/volume `
  -v ${PWD}/datalens/backups/platform-full-2026-04-08_16-28-09/volumes:/backup `
  alpine sh -c "cd /volume && tar -xzf /backup/datalens-volume-prod.tar.gz"
```

## 4) Проверить/сверить Docker конфиг

Эталон resolved compose лежит в:
- `datalens/backups/platform-full-2026-04-08_16-28-09/docker/docker-compose.resolved.yaml`

Сверка:

```powershell
docker compose -f datalens/docker-compose.yaml -f datalens/docker-compose.own-images.yaml config > current.resolved.yaml
```

Сравнить `current.resolved.yaml` и `.../docker-compose.resolved.yaml`.

## 5) Запустить платформу

```powershell
cd datalens
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d
```

## 6) Проверка после запуска

```powershell
docker ps
```

Проверить ключевые сервисы (как минимум):
- `ui`
- `ui-api`
- `control-api`
- `data-api`
- `auth`
- БД/сторадж контейнеры проекта

## 7) Диагностика при расхождении

В snapshot сохранены инспекты:
- `datalens/backups/platform-full-2026-04-08_16-28-09/docker/inspects/*.json`

Сравнивать с текущими:

```powershell
docker inspect <container_or_image_or_volume_or_network>
```

## 8) Что именно гарантирует этот snapshot

Snapshot покрывает:
- Полный git history (bundle)
- Точный набор файлов на момент фиксации
- Docker metadata (compose resolved + inspect)
- Архив volume данных
- env-файлы, присутствовавшие на момент экспорта

Это достаточный набор для полного технического восстановления платформы в том же состоянии.
