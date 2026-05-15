# Исходники и образы: как всё держать в коде и не ломать работающее

## 1. Ошибка 500 getUsersByIds — что сделано

**Причина:** Запросы к auth шли на хост `auth:8080`, в docker-compose сервис называется `us-auth`, из‑за этого возникала ошибка разрешения имени (EAI_AGAIN) и 500.

**Исправления:**

- В **docker-compose.yaml** для сервисов `us` и `ui` задан **AUTH_ENDPOINT: http://us-auth:8080** (явное имя сервиса).
- В **исходниках** (`components/datalens-ui/src/shared/endpoints/constants/opensource.ts`) дефолт для production заменён с `http://auth:8080` на `http://us-auth:8080`, чтобы при сборке из нашего форка без env тоже использовался корректный адрес.

После правок перезапустите стек:
```bash
docker compose -f docker-compose.yaml up -d --force-recreate
```

---

## 2. Всё в исходниках: что уже перенесено

Чтобы не зависеть от патчей при сборке из нашего кода, в репозитории сделано:

| Что | Где в исходниках | Примечание |
|-----|-------------------|------------|
| Auth URL | `shared/endpoints/constants/opensource.ts` | Дефолт production: `http://us-auth:8080`. |
| Название платформы | `server/configs/opensource/common.ts` | `serviceName: process.env.SERVICE_NAME \|\| 'Aeronavigator BI'`. |

При сборке образов (`.\build-all-images.ps1`) эти настройки заложены в образ; в compose задаются AUTH_ENDPOINT и SERVICE_NAME через env.

---

## 3. Конфигурация без папки patches

Папка **patches** удалена. Сейчас используется:

- **nginx/nginx.conf** — монтируется в контейнер UI (прокси на node, без /custom/ и инъекций).
- **backend-patches/dl_core/** — правки для control-api и data-api (параметры, значения по умолчанию); код в образах aeronavigatorbi (build-all-images.ps1).
- **backend-patches/data-api-mssql/query_compiler.py** — патч MSSQL для сводной (GROUP BY/ORDER BY → NVARCHAR).
- Брендинг (название, favicon, лого, стили) — в исходниках datalens-ui (serviceName, faviconUrl, opensource-branding.scss, public/logo.png).

---

## 4. Как использовать код из образов и править его

- **Сейчас:** все сервисы на образах aeronavigatorbi (prod). UI и backend собираются из исходников в `.\build-all-images.ps1`.
- **Исходники:** `components/datalens-ui`, `components/datalens-backend` — правки делайте там, затем пересоберите образы и запустите `.\run-own-images.ps1`.

---

## 5. Краткий чеклист после изменений

1. Перезапуск: `docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d --force-recreate` или `.\run-own-images.ps1`.
2. В браузере: жёсткое обновление (Ctrl+Shift+R).
3. Проверить: нет 500 на getUsersByIds, отображаются иконки/палитры/галочка в зависимости от того, образ или своя сборка.
