# Стратегия образов Docker: какие теги использовать

## 1. Почему у akrasnov87 другие команды запуска

В README akrasnov87 указано:
```bash
docker compose -f docker-compose.demo.yaml --env-file=./.env up
```
То есть **один** файл — `docker-compose.demo.yaml`. В нём у каждого сервиса есть `extends: file: docker-compose.yaml`, поэтому Compose сам подтягивает базовый `docker-compose.yaml` из той же папки. Фактически это **base + demo** в одной команде: образы и дефолты из `docker-compose.yaml`, порты и переопределения — из `docker-compose.demo.yaml`.

`docker compose -f docker-compose.demo.yaml config` должен завершаться без ошибок (проверка: `docker compose -f docker-compose.demo.yaml config >nul`). При необходимости можно явно указать оба файла: `-f docker-compose.yaml -f docker-compose.demo.yaml` — результат тот же.

Раньше в akrasnov87 запуск был через `docker-compose.dev.yaml` — сейчас рекомендуют `docker-compose.demo.yaml` и `.env`. Связка одна: **образы из base**, **порты и конфиг demo**, **переменные из .env**.

---

## 2. Как всё связано и функционирует

- **docker-compose.yaml** — база: все сервисы (postgres, temporal, control-api, data-api, us, ui-api, meta-manager, us-auth, ui), образы (akrasnov87/...), переменные окружения, сеть `default`.
- **docker-compose.demo.yaml** — расширяет базу: проброс портов на хост (5432, 7233, 8010, 8020, 8030, 3040, 3050, 8088, 8080), отключение TEMPORAL_AUTH для демо, логирование. Образы не меняет.
- **docker-compose.own-images.yaml** — только подменяет образы на `ydl/*` (те же версии). Используется для варианта «всё на своих тегах».
- **.env** — пароли, токены, AUTH_ENDPOINT, HC, APP_ENV и т.д. Без `--env-file .env` переменные берутся из окружения или дефолтов в compose.

Цепочка при входе: браузер → **ui** (порт 8080) → при signin запрос в **gateway** → прокси на **us-auth** (AUTH_ENDPOINT, путь /demo/auth) → us-auth дергает **postgres** (пользователи). **control-api** и **data-api** — BI и данные; **us** — метаданные (дашборды, чарты); **meta-manager** + **temporal** — фоновые задачи и воркфлоу.

**Если при входе «Gateway request error»:** убедитесь, что запущен **наш** образ UI (вариант 2: `build-all-images.ps1` + `run-demo-own-images.ps1`). В образе должны быть правки: auth-gateway-handler, signin path `/demo/auth`, AUTH_ENDPOINT. Проверьте, что контейнер **us-auth** запущен и в **ui** задано `AUTH_ENDPOINT: http://us-auth:80`, `APP_INSTALLATION: opensource`, `APP_ENV: production`.

**Keycloak / OIDC:** в `.env` задайте `OIDC=1`, `OIDC_BASE_URL=<URL страницы входа Keycloak>`, `OIDC_NAME=Keycloak` (и при необходимости OIDC_2, …). На странице входа появится блок «Или можно» и кнопка «Авторизация через сервис Keycloak».

---

## 3. Почему сейчас смешано

- **ui-prod, ui-api-prod** → при смешанном запуске использовался отдельный override только для ui/ui-api; при варианте 2 все образы задаются через `docker-compose.own-images.yaml`.
- Остальные сервисы подняты из **base + demo** без override образов → в `docker-compose.yaml` указаны образы **akrasnov87**, поэтому postgres, auth, us, control-api, data-api, meta-manager, temporal идут с тегами akrasnov87 (или datalens-tech для temporal).

Чтобы все контейнеры были с **одними и теми же** тегами, нужно выбрать один из двух вариантов.

---

## Вариант 1: Всё на akrasnov87 (только образы с Docker Hub)

**Теги:** все из `akrasnov87/*` (и при необходимости `ghcr.io/datalens-tech/datalens-temporal`).

**Как запускать:**
```powershell
cd D:\YDLOS\datalens
$env:APP_ENV = "prod"
docker compose -f docker-compose.yaml -f docker-compose.demo.yaml --env-file .env up -d
```

**Не использовать:** `docker-compose.own-images.yaml` (иначе подтянутся образы ydl).

**Плюсы:** не нужна локальная сборка, всё тянется с Hub.  
**Минусы:** в образе akrasnov87/datalens-ui нет наших правок (auth gateway → /demo/auth, брендинг, AUTH_ENDPOINT:80, обработка битой куки). Вход и интерфейс могут вести себя как «из коробки» akrasnov87, без кастомизаций.

---

## Вариант 2: Всё на ydl (рекомендуется для YDL OS)

**Теги:** все сервисы в одном стиле:
- `ydl/datalens-postgres:16`
- `ydl/datalens-temporal:1.27.2`
- `ydl/datalens-control-api:0.2396.0`
- `ydl/datalens-data-api:0.2396.0`
- `ydl/datalens-ui:0.3498.0`
- `ydl/datalens-us:0.413.0`
- `ydl/datalens-auth:0.2.6`
- `ydl/datalens-meta-manager:0.50.0`

**Шаг 1 — один раз собрать/подтянуть образы:**
```powershell
cd D:\YDLOS\datalens
.\build-all-images.ps1
```
(Собирает postgres, temporal, control-api, data-api, ui из репозитория; us, auth, meta-manager — pull akrasnov87 и ретарг в ydl.)

**Шаг 2 — запуск с demo-портами и нашими образами:**
```powershell
cd D:\YDLOS\datalens
$env:APP_ENV = "prod"
docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.own-images.yaml --env-file .env up -d
```

**Плюсы:** единые теги ydl, наш кастомный UI (вход, брендинг, правки auth), один сценарий «собрал — запустил».  
**Минусы:** первый раз нужно выполнить `build-all-images.ps1` (время сборки).

---

## Итоговая таблица тегов (вариант 2)

| Сервис       | Образ |
|--------------|--------|
| postgres     | ydl/datalens-postgres:16 |
| temporal     | ydl/datalens-temporal:1.27.2 |
| control-api  | ydl/datalens-control-api:0.2396.0 |
| data-api     | ydl/datalens-data-api:0.2396.0 |
| us           | ydl/datalens-us:0.413.0 |
| us-auth      | ydl/datalens-auth:0.2.6 |
| meta-manager | ydl/datalens-meta-manager:0.50.0 |
| ui           | ydl/datalens-ui:0.3498.0 |
| ui-api       | ydl/datalens-ui:0.3498.0 |
