# Манифест кастомизации YDL OS (Aeronavigator)

Цель: **спокойно обновляться** с [datalens-tech/datalens](https://github.com/datalens-tech/datalens), не теряя свои доработки, и **понимать**, что именно «ваше», а что — апстрим.

## 1. Где живёт кастом (источник правды)

| Зона | Назначение |
|------|------------|
| **`components/datalens-ui/`** | UI: вход, брендинг, i18n, layout, эндпоинты, flight-groups и др. |
| **`components/datalens-auth/`** | Своя логика авторизации при необходимости. |
| **`components/datalens-us/`** | Правки United Storage. |
| **`datalens/`** | Compose, nginx, `.env.example`, скрипты деплоя, документация под ваш стек. |

Официальный апстрим **не копируется целиком** в корень ydl-os: сравнение и перенос — по файлам (см. `PLATFORM_SYNC_UPSTREAM.md`).

## 2. Как помечать свои правки в коде

Рекомендуемый префикс в комментариях:

`// YDL-OS:` или `/* YDL-OS: … */`

Пример уже в коде: ветка входа в `src/ui/datalens/index.tsx` для opensource vs облачный `auth-layout`.

При переносе кусков из нового upstream ищите по репозиторию **`YDL-OS`**, чтобы не потерять смысл.

## 3. Почему в браузере был «чужой» DataLens, а не ваш

Развёрнутый **Docker-образ UI** должен быть **собран из этого репозитория** (`components/datalens-ui`). Если образ старый или «ванильный», вы увидите стандартный интерфейс.

Дополнительно исправлена логика: при **`authPageSettings.isAuthPage`** (ответ SSR для `/auth/signin`) для **`installationType === opensource`** больше **не** поднимается облачная страница registry, а остаётся ваш **`CustomAuthPage` / `CustomSignin`** (заголовок из `SERVICE_NAME` / `window.DL.serviceName`, лого, OIDC).

## 4. Выкат без локальной сборки у агента (скрипт)

Из каталога **`datalens/datalens`**:

```bash
# Только compose/nginx/docs → /opt/ydl-os и restart
bash scripts/ydl-os/deploy.sh

# Плюс полный монорепозиторий (components/) на сервер в ~/datalens — чтобы вы могли собрать образ там же
SYNC_MONOREPO=1 bash scripts/ydl-os/deploy.sh
```

После **вашей** сборки `datalens-ui` и публикации тега: при необходимости `PULL=1 bash scripts/ydl-os/deploy.sh` (если образы в registry).

## 5. Сборка UI на сервере (Linux / CI)

На **`192.168.201.40`** образ собирается так (контекст — `components/datalens-ui`):

```bash
cd ~/datalens/components/datalens-ui
docker build -t akrasnov87/datalens-ui:0.3498.0 .
cd /opt/ydl-os
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d --force-recreate ui ui-api nginx
```

Особенности репозитория (исправлено в коде):

- **`Dockerfile`**: не требуется предварительный `dist/` на хосте; копируется **`scripts/`** для `npm run build`; **`chmod +x /etc/nginx/entrypoint.sh`** после `COPY deploy/nginx`.
- **Highcharts**: внешние скрипты с CDN **не** подключаются; при сборке образа **нет** шага загрузки HC в `dist/public`. Подробности и про npm-зависимость — в **`./CHARTS_AND_LICENSES.md`**.
- **`docker-compose.production.yaml`**: у сервиса **`ui`** volumes сброшены (**`volumes: !reset []`**), чтобы **не** монтировать `./nginx/nginx.conf` поверх образа — иначе внутренний nginx падает (read-only, логи).

## 6. Как не ломать прод при обновлении

1. **Тег образа = результат сборки** из текущего коммита `development` (или SHA в теге), а не «последний с Docker Hub», если вы не контролируете его содержимое.
2. Перед сменой версий: **дамп Postgres** (метаданные, дашборды).
3. Сверка с upstream: **`bash datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh`** (отчёт в `datalens/datalens/reports/`, см. `PLATFORM_SYNC_UPSTREAM.md`) и при необходимости `git show upstream/main:docker-compose.yaml` / `versions-config.json`.
4. После обновления зависимостей UI: **прогон сборки** (`build-all-images` / CI) и смоук: `/auth`, вход, коллекция, MSSQL.

## 7. AW vs YDL (кратко)

**AW (Analytic Workspace)** — другой продукт и другой порт/процесс (у вас исторически **8088**).  
**YDL** — Docker-стек DataLens: снаружи **HTTP 80** на хосте до `ydl-os-nginx`, внутри UI на **8080**. Внешний nginx сисадмина по HTTPS проксирует на **`http://<IP-YDL>:80`**, не на 8088.

Поведение URL (`/auth`, `/auth/signin`) — от DataLens, не от AW; кастом задаётся **образом UI** и **переменными** в compose.

## 8. Расширенный список отличий от чужого development

Детальный diff по файлам см. **`DIFF-VS-AERONAVIGATOR-DEVELOPMENT.md`** в корне репозитория (при необходимости обновляйте его после крупных вливаний).
