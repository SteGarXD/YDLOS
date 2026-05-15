# Устранение неполадок (Aeronavigator BI / форк akrasnov87)

Платформа основана на форке [akrasnov87/datalens](https://github.com/akrasnov87/datalens). В `docker-compose.yaml` используются образы **aeronavigatorbi** (сборка: `.\build-all-images.ps1`). Ниже — типичные ошибки и что проверить.

## Как у akrasnov87 устроен запуск и авторизация (README)

Чтобы не менять основную логику платформы, ориентируемся на [README форка](https://github.com/akrasnov87/datalens):

- **Запуск с авторизацией (как у akrasnov87):** из каталога `datalens` выполните:
  ```bash
  docker compose -f docker-compose.demo.yaml --env-file=./.env up
  ```
  Demo-файл расширяет базовый `docker-compose.yaml`, добавляет порты (в т.ч. UI на 8080, us-auth на 8088). Не используйте только `docker-compose.yaml` без demo, если нужна авторизация «из коробки» — набор сервисов и порты совпадают с форком.
- **Важно:** в `.env` не должно быть `AUTH_ENABLED=false` для входа. В `docker-compose.yaml` у сервиса `ui` по умолчанию `AUTH_ENABLED=true`.
- **.env:** `POSTGRES_PASSWORD`, `US_MASTER_TOKEN`, `CONTROL_API_CRYPTO_KEY`, `HC=1`, `APP_ENV=prod`, `NODE_RPC_URL` (по умолчанию в списке переменных: `http://us-auth/demo/rpc`), при необходимости `HC_ENDPOINT`, `HC_PROTOCOL` и др.
- **Пользователи в БД (схема `core`):** master, admin, user — пароль по умолчанию у всех **qwe-123**.
- **Компонент авторизации:** [datalens-auth](https://github.com/akrasnov87/datalens-auth) (us-auth), RPC по пути `/demo/rpc`, REST-авторизация под путём `/demo/` (в т.ч. `POST /demo/auth` с телом `UserName`, `Password` в basic-авторизации).
- **Структура БД:** схема `core`, таблицы `pd_users`, `pd_roles`, `pd_accesses` и др.; создание пользователя: `SELECT core.sf_create_user('master', 'qwe-123', '', '["master", "admin"]');`.

У нас та же логика: вход через gateway → us-auth, контракт signin → `POST /auth` с `UserName`/`Password`, при успехе выставляются куки на UI-сервере. Запросы **refreshTokens** проксируются в us-auth на `/refresh`. Используется **готовый образ akrasnov87** (под тегом aeronavigatorbi/datalens-auth:0.2.6, pull+tag в `build-all-images.ps1`) — свою сборку auth делать не обязательно. Если в этом образе есть `/demo/refresh`, продление сессии работает без повторного логина. Если по refresh приходит 404 — см. [BUILD-AUTH.md](../components/datalens-auth/BUILD-AUTH.md) (сборка из исходников).

## Почему у akrasnov87 всё работало, а у меня нет (один и тот же форк)

- **У akrasnov87:** он собирает **datalens-ui** из своего репозитория и использует образ **datalens-auth** с контрактом `POST /demo/auth`, тело `{ UserName, Password }`, ответ `{ token, user, projectId }`. UI изначально написан под этот контракт: запрос входа идёт на `/auth` (относительно `AUTH_ENDPOINT`), куки при необходимости выставляются на стороне UI-сервера или клиента. Один автор — один контракт, всё совпадает.
- **У нас (YDL OS):** мы берём тот же форк, но:
  1. **Образ UI** может быть собран из нашего кода (`.\build-all-images.ps1` → сборка из `components/datalens-ui`) или при падении сборки — подтянут и ретаргнут с `akrasnov87/datalens-ui`. Если образ собран **до** правок авторизации (signin → `/auth`, body `UserName`/`Password`, cookie-handler на UI-сервере), то в браузере по-прежнему будут запросы на `/signin`/`refresh` и 404 или «Gateway request error».
  2. **Образ us-auth** в основном `docker-compose.yaml` указан как `akrasnov87/datalens-auth:0.2.6` (рабочий, с node_modules). У него **нет** маршрутов `/signin` и `/refresh` — только `/demo/auth`. Поэтому UI **должен** вызывать именно `/auth` с полями `UserName` и `Password`, иначе вход не работает.
- **Что сделать:** чтобы в браузере увидеть рабочий вход:
  1. Убедиться, что в коде UI: signin → path `'/auth'`, body `{ UserName, Password }`, и что при успешном ответе с `token` серверный auth-gateway-handler выставляет куки `auth` и `auth_exp`.
  2. **Пересобрать образ UI** из текущих исходников (см. ниже) и перезапустить сервисы `ui` и `ui-api`, чтобы контейнеры поднялись с новым образом. Без пересборки образ содержит старый код и изменений в браузере не будет.

## 401 после входа (Коллекции не грузятся, «Unauthorized access»)

- Запросы к gateway (`getStructureItems`, `getRootCollectionPermissions` и т.д.) проходят через **api-auth**: нужен либо заголовок **x-rpc-authorization**, либо кука **auth**. В коде: после signin токен пишется в localStorage и в заголовок через `prepareRequestOptions`; кука выставляется сервером в формате `{ accessToken: token }`. Для backend (getAuthArgs) пользователь кладётся в `req.ctx` и `req.originalContext`.
- **Один и тот же хост:** заходите всегда с одного адреса — только **http://localhost:8080** или только **http://127.0.0.1:8080**. Кука привязана к хосту: если вход был с localhost, а потом открыли 127.0.0.1 (или наоборот), кука не уйдёт и будет 401. После смены хоста заново войдите (master / qwe-123).
- Если 401 сохраняется: в DevTools → Application → Cookies проверьте наличие куки `auth`; во вкладке Network у запроса с 401 проверьте Request Headers — есть ли `x-rpc-authorization` или `Authorization: Bearer <token>`.
- **Как у akrasnov87:** в их api-auth используется **только кука** (без заголовка x-rpc-authorization); токен всегда верифицируется как JWT. У нас дополнительно поддерживаются заголовки `x-rpc-authorization` и `Authorization: Bearer`, а также неподписанный/opaque токен из us-auth. После входа клиент отправляет токен и в заголовках (localStorage + prepareRequestOptions), и сервер выставляет куку — так запросы к gateway должны проходить даже если кука по какой-то причине не уходит.

## Режим dev и prod (APP_ENV)

**Важно:** После перехода с prod на dev (или наоборот) всё может «полететь», если эндпоинты и конфиг подставлялись по-разному для разных режимов.

- В коде эндпоинты теперь **единые** для dev и prod: всегда используются переменные окружения (`US_ENDPOINT`, `AUTH_ENDPOINT` и т.д.), а при их отсутствии — имена сервисов Docker (`us:8080`, `us-auth:5000`). Локальный localhost в дефолтах не используется, поэтому при переключении `APP_ENV=development` в Docker запросы по-прежнему уходят на контейнеры.
- Для выбора набора эндпоинтов: при `APP_ENV=production`, `prod`, `preprod`, `staging` берётся production-набор; при `APP_ENV=development` или `dev` — development. В обоих наборах для opensource одни и те же fallback (имена сервисов).
- **Рекомендация:** В Docker всегда задавайте `APP_ENV=production` (или `prod`) в compose/.env. Для локальной разработки (UI на хосте, сервисы в Docker) задайте в `.env` явно: `US_ENDPOINT=http://localhost:ПОРТ_US`, `AUTH_ENDPOINT=http://localhost:ПОРТ_AUTH` и т.д.

### Запуск UI в dev-режиме (npm run dev) — как в prod

Чтобы конфиг и поведение совпадали с prod (нет падений по getSourcesByEnv/chartsEngineConfig, отображается версия на странице входа), задайте те же переменные, что и у сервиса `ui` в docker-compose:

- `APP_INSTALLATION=opensource`
- `APP_ENV=development`
- `RELEASE_VERSION=2.7.0-night` (или актуальная строка)

Пример (PowerShell, из каталога `components/datalens-ui`):

```powershell
$env:APP_INSTALLATION="opensource"; $env:APP_ENV="development"; $env:RELEASE_VERSION="2.7.0-night"; $env:APP_MODE="full"; $env:DEV_CLIENT_PORT="8080"; $env:DEV_SERVER_PORT="3030"; npm run dev
```

Либо создайте в `components/datalens-ui` файл `.env` из `.env.example` (см. там переменные для dev) и запускайте `npm run dev` — dotenv подхватит их.

**`dist/server` vs `dist/public` — это не причина «пустого» превью.** В dev страница и JS идут с **Rspack** (порт `DEV_CLIENT_PORT`, на Windows часто **3031**), а не из `dist/public/build`. **Express** собирается в **`dist/server`** и слушает **`DEV_SERVER_PORT`** (на Windows по умолчанию **3040**); запросы `/gateway/...` проксируются с клиентского dev-сервера на этот backend. **Превью датасета** (`getPreview`) — это **API** (gateway → data-api → US), а не отдача статики: если ошибка `ERR.DS_API.US` / 500, смотрите **логи data-api**, **`US_MASTER_TOKEN`** в `datalens/.env` и `components/datalens-ui/.env`, и что backend реально перезапущен после правок. Запускайте `npm run dev` из каталога **`components/datalens-ui`**, чтобы `.env` рядом с пакетом подхватился (в коде есть поиск `.env` по нескольким путям).

**Ошибка «Gateway config error. Endpoint has been not found in service "us"»:** возникает, когда UI в dev запущен один, а сервисы us/us-auth не доступны по дефолтным адресам. Задайте в `.env` (или в переменных перед `npm run dev`): `US_ENDPOINT=http://localhost:ПОРТ_US`, `AUTH_ENDPOINT=http://localhost:ПОРТ_AUTH` — порты, на которых у вас подняты United Storage и авторизация (например, из docker-compose.demo.yaml).

**getAuth 500 / universalService 500:** те же причины — gateway не может достучаться до US. 1) Запустите бэкенд (например из каталога `datalens`: `docker compose -f docker-compose.demo.yaml --env-file=./.env up`). 2) В каталоге `components/datalens-ui` создайте `.env` из `.env.example` и **раскомментируйте** (или задайте явно) `US_ENDPOINT=http://localhost:8030` и `AUTH_ENDPOINT=http://localhost:8088` (порты из docker-compose.demo.yaml). 3) Перезапустите `npm run dev`.

**getAuth 401 / universalService 401 / «Ошибка авторизации»:** 1) В `components/datalens-ui/.env` задайте **`US_MASTER_TOKEN=us-master-token`** (должно совпадать с `US_MASTER_TOKEN` в `datalens/.env` для Docker). Если переменной нет, UI по умолчанию использует `us-master-token`. Gateway отправляет этот токен в заголовке `x-us-master-token` в US; при несовпадении или отсутствии US отвечает 401. 2) В `datalens/.env` для Docker задайте тот же **`US_MASTER_TOKEN=us-master-token`**. 3) При входе используйте пользователя из БД: **master** / **qwe-123** (или admin/user, пароль по умолчанию **qwe-123**). 4) Убедитесь, что схема `core` и пользователи созданы: в `datalens/.env` при первом запуске должно быть **`INIT_DB_AUTH=1`**, либо создайте пользователя: `.\scripts\create-auth-master.ps1` (из папки `datalens`). 5) Проверка пользователей: `.\scripts\list-auth-users.ps1` (из папки `datalens`). 6) После смены `.env` или кода **обязательно перезапустите** `npm run dev` в `components/datalens-ui` и при необходимости контейнеры Docker.

## Какие пользователи и пароли есть (проверка перед входом)

Пользователи авторизации хранятся в таблице **`core.pd_users`** в БД US (`POSTGRES_DB_US`, по умолчанию `pg-us-db`). Пароль — в колонке `c_password` (открытый текст) или `s_hash` (хэш).

**Как проверить список пользователей:**

Из папки `datalens` выполните:
```powershell
.\scripts\list-auth-users.ps1
```
Скрипт подключается к контейнеру postgres и выводит логины из `core.pd_users`. Если таблицы нет — схема `core` не создана (см. ниже). Если PostgreSQL выводит предупреждение о collation version mismatch — скрипт его игнорирует и продолжает работу. Если пользователей нет, создайте их: `.\scripts\create-auth-master.ps1` (из папки `datalens`).

**Согласно README форка (актуально после создания схемы и пользователей):**

| Логин   | Пароль по умолчанию | Описание                          |
|---------|----------------------|-----------------------------------|
| master  | qwe-123              | Максимальные права                 |
| admin   | qwe-123              | Просмотр и редактирование по project_id |
| user    | qwe-123              | Только просмотр                    |

Пользователей создают функцией в БД:  
`SELECT core.sf_create_user('master', 'qwe-123', '', '["master", "admin"]');`  
(см. [components/datalens-auth/README.md](../components/datalens-auth/README.md)).

---

## Temporal unhealthy, «lookup postgres: no such host», ничего не работает

После частичных перезапусков (только ui, или другой compose) контейнеры могут оказаться в разных сетях: **temporal** не резолвит **postgres**, **ui** не резолвит **us-auth**.

**Что сделать — один раз поднять весь стек одной командой:**

Из папки `datalens`:
```powershell
.\scripts\run-demo-clean.ps1
```

Скрипт делает `docker compose -f docker-compose.demo.yaml down`, затем `up -d` с `.env`. Все сервисы создаются заново в одной сети. Подождите 15–30 секунд, при необходимости ещё раз: `docker compose -f docker-compose.demo.yaml up -d`.

Вручную то же самое:
```powershell
cd D:\YDLOS\datalens
docker compose -f docker-compose.demo.yaml down
docker compose -f docker-compose.demo.yaml --env-file=./.env up -d
```
Через 15–20 секунд проверьте: `docker compose -f docker-compose.demo.yaml ps`. Если temporal ещё `starting` — подождите или выполните `up -d` ещё раз.

**Дальше:** для пересборки только UI используйте `.\build-and-run-ui.ps1` (он перезапускает только ui/ui-api через demo compose и не трогает остальные контейнеры).

## Постоянные сборки забивают диск

Чтобы оставить только свежие образы и освободить место:

1. **Очистка + пересборка UI + перезапуск всего стека** (рекомендуется):
   ```powershell
   cd D:\YDLOS\datalens
   .\scripts\cleanup-docker-and-rebuild.ps1
   ```
   Скрипт: останавливает контейнеры → удаляет кэш сборки Docker и все неиспользуемые образы → подтягивает базовые образы (postgres, temporal, us-auth и т.д.) → собирает UI из исходников (с фиксом куки при входе) → поднимает стек. После этого логин master / qwe-123 должен работать.

2. **Только очистка** (без пересборки):
   ```powershell
   docker compose -f docker-compose.demo.yaml down
   docker builder prune -a -f
   docker image prune -a -f
   ```
   Затем заново поднять стек (или пересобрать UI и поднять).

### Почему диск D (и C) заполнены

- **Диск D:** основную часть занимают **DockerDesktopWSL** (~124 GB) и **WSL** (~72 GB) — там хранятся образы, слои, тома и виртуальные диски WSL2. Проект YDLOS (~2.4 GB) и остальное — меньше.
- **Диск C:** обычно Windows, Program Files, Users (~95 GB в сумме); плюс Temp и кэши (npm, IDE, сборки).

**Быстро освободить место (без потери рабочих образов):**
```powershell
cd D:\YDLOS\datalens
.\scripts\free-disk-space.ps1
```
Скрипт удаляет: кэш сборки Docker (~15 GB), образ `dl-ui:local` (~6.6 GB), дубликаты `akrasnov87/*` (~2.6 GB), остановленные контейнеры и неиспользуемые сети. Образы `aeronavigatorbi/*`, нужные для стека, не трогает.

**Почему на диске D свободное место не изменилось после скрипта:** данные Docker лежат в файлах .vhdx на D: (DockerDesktopWSL, WSL). Prune освобождает место *внутри* виртуального диска, но размер файла .vhdx не уменьшается сам. Чтобы место реально вернулось на D:, нужно **сжать vhdx** (один раз, от имени администратора):
1. Закрыть Docker Desktop (трей → Quit Docker Desktop).
2. Открыть PowerShell **от имени администратора**.
3. Выполнить: `cd D:\YDLOS\datalens; .\scripts\compact-docker-vhdx.ps1`
4. Снова запустить Docker Desktop. Проверить «Этот компьютер» — свободное место на D: должно вырасти.

**Чтобы освободить ещё много на D:** в Docker Desktop → Settings → Resources можно нажать «Clean / Purge data» (удалит все образы и тома; затем снова выполните `.\build-all-images.ps1`). Папку **Temp** на C можно почистить вручную (закройте редакторы/терминалы): `Remove-Item -Recurse -Force $env:TEMP\*` (осторожно).

## Запрос signin «уходит не туда», редирект обратно на /auth, поля пустые

- **Куда должен идти запрос:** в браузере запрос идёт **только на тот же хост** — `POST http://localhost:8080/gateway/auth/auth/signin`. Снаружи «торчит» только UI (порт 8080). Сервер UI проксирует запрос внутрь Docker на `http://us-auth:80/demo/auth`. Имена `us-auth`, `us` и т.д. — внутренние имена контейнеров; с хоста к ним подключаться не нужно.
- **Порты контейнеров (как у akrasnov87):** снаружи нужен только порт **UI (8080)**. Остальные порты (8010, 8020, 8030, 3040, 3050, 8088, 7233, 5432) — для отладки или прямого доступа к сервисам; для обычного входа они не обязательны. Контейнеры общаются по сети по именам (us-auth:80, us:8080 и т.д.).
- **Редирект и пустая форма:** если us-auth вернул не JSON с токеном (например HTML после редиректа или ошибка), UI-сервер теперь отдаёт **401** вместо «успех без куки» — в интерфейсе должна появиться ошибка, а не молчаливый возврат на страницу входа. Если после обновления образа UI по-прежнему только редирект — проверьте: 1) в Network запрос к `localhost:8080/gateway/auth/auth/signin`; 2) статус и тело ответа (ожидается 200 + JSON с полем `token`); 3) логи контейнера `datalens-auth-*` и что `AUTH_ENDPOINT` в контейнере UI = `http://us-auth:80/demo`.
- В `docker-compose.demo.yaml` у сервиса `ui` добавлен `depends_on: us-auth`, чтобы UI стартовал после us-auth и мог до него достучаться.

## После «Войти» страница просто перезагружается (нет ошибок)

- **Проверьте запуск:** используйте тот же способ, что и у akrasnov87: `docker compose -f docker-compose.demo.yaml --env-file=./.env up`. Убедитесь, что подняты контейнеры `us-auth` и `ui`, в `.env` нет `AUTH_ENABLED=false`.
- **Пересоберите образ UI** после любых правок в коде авторизации: из каталога `datalens` выполните `.\build-and-run-ui.ps1` (или `.\build-all-images.ps1` и перезапуск `ui`/`ui-api`). Иначе в контейнере будет старый код без установки кук при signin.
- **В браузере:** откройте DevTools → вкладка Network. Нажмите «Войти» (логин `master`, пароль `qwe-123`). Должен появиться запрос **POST** на `.../gateway/auth/auth/signin` (или `/gateway/.../signin`). Если его нет — запрос с клиента не уходит (проверьте консоль на ошибки). Если POST есть и статус 200 — в ответе должны быть заголовки **Set-Cookie** (`auth`, `auth_exp`). После редиректа следующий запрос (GET `/` или `/collections`) должен уходить уже с этими куками.
- **Куки:** для `localhost:8080` убедитесь, что в Application → Cookies нет старых/битых кук для этого хоста; при необходимости очистите их и попробуйте войти снова.

## Ошибка авторизации (401, «SDK request error», «войти не могу»)

- **Что происходит:** при нажатии «Войти» запрос идёт **POST** на `.../gateway/auth/auth/signin` → UI-сервер проксирует в **us-auth** `POST /demo/auth` с телом `{ UserName, Password }`. Ответ **401** и красное «SDK request error» означают, что **us-auth отклонил вход**: пользователя нет в БД, неверный пароль или отсутствует таблица `core.pd_users`. Это **не** Keycloak: форма «Войти» использует встроенную авторизацию (us-auth + БД). Кнопка «Авторизация через сервис Keycloak» — отдельный поток (OIDC); настройка Keycloak для тестового сайта и платформы описана в **D:\meridian-demo** (KEYCLOAK_SETUP.md, docker-compose.keycloak.yml).
- **Чем мы отличаемся от akrasnov87:** наша форма вызывает **auth.signin()** (gateway → us-auth, JSON). Куки выставляет UI при 200. У akrasnov87 мог использоваться **us.getAuth()** (US → us-auth, FormData) — образ us-auth ожидает JSON, поэтому мы перевели на auth.signin().
- **Что проверить:**
  1. Есть ли пользователи: из папки `datalens` выполните `.\scripts\list-auth-users.ps1`. Если таблицы `core.pd_users` нет — см. раздел «Почему сломалось после перехода prod → dev» ниже.
  2. Создать пользователей: если таблица есть, но пользователя `master` нет, выполните `.\scripts\create-auth-master.ps1` (создаёт master, admin, user с паролем `qwe-123`). Если таблицы нет — скрипт подскажет, как применить `auth-data.sql`.
  3. **Пользователи есть, но 401 остаётся:** пароль в БД хранится в виде хеша (s_hash). Если хеш был создан с другим паролем или на другой кодировке, ввод `qwe-123` не пройдёт. Сбросьте пароль: `.\scripts\reset-auth-password.ps1` (по умолчанию master → qwe-123) или `.\scripts\reset-auth-password.ps1 master qwe-123`.
  3. В us-auth используется БД US (`POSTGRES_DB_US`). Схема `core` создаётся при применении `components/datalens-us/scripts/demo/auth-data.sql` или при инициализации с `INIT_DB_AUTH=1`.
  4. Порт us-auth: в compose заданы `AUTH_ENDPOINT=http://us-auth:80/demo`, `NODE_RPC_URL=http://us-auth:80/demo/rpc`. Образ слушает порт **80**.
  5. Логи контейнера `datalens-auth-*`: при запросе на `/demo/auth` там будет сообщение «Пользователь не авторизован» при неверных данных или отсутствии пользователя в БД. Просмотр: `docker logs datalens-auth-prod` (или имя по вашему `APP_ENV`).
  6. **Тело запроса:** образ us-auth ожидает `UserName` и `Password`. В коде UI перед проксированием на auth запрос нормализуется: если в body приходят `login`/`password`, подставляются `UserName`/`Password`. Достаточно **пересобрать и перезапустить только UI** (без сборки us-auth). Сборка us-auth из исходников возможна только при доступе к git.mobwal.com (см. `components/datalens-auth/BUILD-AUTH.md`).

## Почему сломалось после перехода prod → dev и как наверняка исправить

**Возможные причины:**

1. **Эндпоинты** — раньше при `APP_ENV=development` в коде могли подставляться localhost:8088 (auth), localhost:8083 (US) и т.д. В Docker эти адреса недоступны, поэтому авторизация «висит» или даёт 401/504. Сейчас дефолты унифицированы (имена сервисов), но если в `.env` остались старые значения для dev — замените их на `http://us-auth:80`, `http://us:8080` или уберите, чтобы использовались дефолты из compose.

2. **Схема `core` и пользователи** — таблица `core.pd_users` создаётся при первой инициализации Postgres, если задано **`INIT_DB_AUTH=1`** (или `true`). В `docker-compose` по умолчанию стоит `INIT_DB_AUTH=0`. Если при первом поднятии у вас был `INIT_DB_AUTH=1`, пользователи появились. После перехода на dev вы могли:
   - пересоздать контейнеры с новым `.env`, где `INIT_DB_AUTH=0`;
   - или пересоздать volume БД (тогда старые данные, включая `core`, пропали).

3. **Разные имена контейнеров** — имена содержат `APP_ENV` (например `datalens-postgres-prod` и `datalens-postgres-development`). Скрипт `list-auth-users.ps1` подставляет текущий `APP_ENV` из `.env`; убедитесь, что подключаетесь к тому контейнеру, который реально используется (тот же, что в `docker ps`).

**Как наверняка исправить:**

1. **Проверить пользователей:** из папки `datalens` выполните `.\scripts\list-auth-users.ps1`. Если таблицы нет — переходите к п. 2.
2. **Восстановить схему и пользователей:**
   - В `.env` задайте `INIT_DB_AUTH=1`.
   - Если не хотите терять данные в БД: примените схему auth и создайте пользователей. Из корня репозитория:  
     `Get-Content components/datalens-us/scripts/demo/auth-data.sql | docker exec -i datalens-postgres-<APP_ENV> psql -U pg-user -d pg-us-db -v ON_ERROR_STOP=1`  
     (подставьте из `.env`: `APP_ENV`, `POSTGRES_USER`, `POSTGRES_DB_US`). Либо выполните скрипт `.\scripts\create-auth-master.ps1` — он создаст master/admin/user (если таблица уже есть) или выведет команду для применения auth-data.sql.
   - Если данные БД не нужны: остановите контейнеры, удалите volume postgres (`docker volume rm ... db-postgres` или аналог), в `.env` установите `INIT_DB_AUTH=1`, снова запустите `docker compose up -d`. После первого старта схема и пользователи появятся (если образ postgres/init-скрипты это предусматривают).
3. **Проверить эндпоинты:** в `.env` для Docker не должно быть `AUTH_ENDPOINT`/`NODE_RPC_URL` с localhost, если только вы не поднимаете us-auth отдельно на хосте. Образ us-auth: nginx слушает порт **80**. Базовый путь для REST-авторизации UI — **/demo**. Задайте:
   `AUTH_ENDPOINT=http://us-auth:80/demo`, `NODE_RPC_URL=http://us-auth:80/demo/rpc`.
   **Важно:** эндпоинты `/demo/signin`, `/demo/refresh`, `/demo/logout` есть в исходниках `components/datalens-auth` (роуты для контракта DataLens UI). Готовый образ `aeronavigatorbi/datalens-auth:0.2.6` может их не содержать — тогда при входе будет 404 на signin/refresh. Соберите образ из исходников: `docker compose build us-auth` (при ошибке NodeSource GPG в Dockerfile — обновите скрипт установки Node или используйте образ с уже добавленными роутами).
4. **Рекомендуемый режим в Docker:** задайте `APP_ENV=production` в `.env`, чтобы не путать с локальной разработкой.

После этого снова выполните `.\scripts\list-auth-users.ps1` (убедитесь, что master есть) и входите с логином **master** и паролем **qwe-123**. Быстрое создание пользователей: `.\scripts\create-auth-master.ps1`.

## 504 Gateway Timeout или 404 на refreshTokens

- Запрос идёт с UI на us-auth по адресу из `AUTH_ENDPOINT`. 504 — таймаут; **404** — на стороне us-auth нет **`POST /demo/refresh`** (в старых образах не был подключён `datalens-auth.js` или UI слал путь `/refresh` без префикса `/demo`). В текущем форке: UI шлёт **`/demo/refresh`**, в **`components/datalens-auth/app/app.js`** роутер **`routes/datalens-auth.js`** монтируется под виртуальным префиксом — пересоберите образ **us-auth** из этого репозитория.
- **Что проверить:**
  1. Образ us-auth собран из исходников с **datalens-auth.js** (есть `/demo/refresh`). См. [components/datalens-auth/BUILD-AUTH.md](../components/datalens-auth/BUILD-AUTH.md).
  2. Порт в `AUTH_ENDPOINT` совпадает с тем, на котором реально слушает us-auth (по умолчанию в compose — **80**).
  3. Контейнер us-auth запущен: `docker ps | findstr auth`.
  4. При необходимости увеличьте таймаут прокси/шлюза перед us-auth.

## Иконка вкладки браузера (favicon)

- По умолчанию для opensource используется `/favicorn.svg` (файл из `datalens/assets/favicorn.svg`, при сборке копируется в `dist/public/` скриптом copy-public-assets.js). Чтобы использовать свою иконку: положите SVG в `datalens/assets/favicorn.svg` либо задайте в конфиге UI `faviconUrl` (например через переменную окружения, если поддерживается).
  3. Перезапустите UI. Убедитесь, что в образе/статике этот файл доступен по указанному пути.

## Предпросмотр датасета: 500, ERR.DS_API.US, «не удалось загрузить данные для предпросмотра»

- **Куда идёт запрос:** предпросмотр (`getPreview`) проксируется на **data-api** (`POST .../api/data/v1/.../preview`), не на control-api. В demo-compose снаружи это **порт 8020** (`BI_DATA_ENDPOINT`). Проверка датасета (`validateDataset`) идёт в **control-api** (8010) — поэтому валидация может быть **200**, а предпросмотр — **500**: разные сервисы.
- **Что значит ERR.DS_API.US:** ответ сформировал **data-api**; при обработке превью он обратился к **United Storage** и получил ошибку (или не смог корректно разобрать ответ US). Исходники data-api в этом форке — в **`components/datalens-backend`** (приложение `dl_data_api`); в логах **US** часто видно **401** на `GET /v1/entries/...` без `x-us-master-token`, если data-api ходит в US только с **RPC** (режим Native/Zitadel). В коде **добавлена** передача **`US_MASTER_TOKEN`** в исходящие заголовки «regular» US-клиента (вместе с пользовательским RPC), чтобы совпадать с поведением compose, где master задан везде. Пересоберите образ/обновите контейнер **data-api** после правок. Детали — в **логах** data-api и US.

**Что проверить по порядку:**

1. **Логи data-api:**  
   `docker logs datalens-data-api-<APP_ENV>`  
   (подставьте `APP_ENV` из `datalens/.env`, чаще `prod`). Там будет traceback или сообщение US/SQL — это главный источник правды.

2. **Одинаковый master-токен:** `US_MASTER_TOKEN` в `datalens/.env` должен совпадать у сервисов **us**, **data-api**, **ui** / **ui-api**. При `npm run dev` в `components/datalens-ui/.env` задайте тот же токен (см. раздел про getAuth 401 выше).

3. **Ключ шифрования подключений:** в `docker-compose.yaml` у **data-api** и **control-api** используется `CONTROL_API_CRYPTO_KEY` / `DL_CRY_KEY_VAL_ID_KEY`. Если ключи когда-то разъехались между сервисами, секреты подключений могут не расшифровываться на стороне data-api → ошибки при превью. Задайте один и тот же `CONTROL_API_CRYPTO_KEY` в `.env` и пересоздайте контейнеры.

4. **Доступ data-api к US:** внутри Docker `US_HOST` у data-api = `US_ENDPOINT` (по умолчанию `http://us:8080`). С хоста для отладки US — `http://localhost:8030`. Убедитесь, что контейнер **us** здоров: `docker compose ps`.

## Валидация датасета (`validateDataset` 400) при рабочем превью

- **validateDataset** идёт в **control-api** (порт **8010** в demo), **preview** — в **data-api** (8020). Логика параметров и SQL-шаблонов должна быть в обоих образах.
- Ошибки **`TEMPLATE_INVALID` / `Key … not found in {}`** и **`PARAMETER_VALUE_INVALID`** для строк параметров (даты, списки через запятую) устранены в форке: см. **`datalens/PARAMETERS-YDL-OS.md`**, код в `dl_core` (`accessor`), `dl_query_processing` (`formula_compiler`), `dl_api_lib` (`dataset/validator`).
- После обновления кода бэкенда пересоберите **оба** образа: `docker build -f datalens/build/Dockerfile.control-api …` и `Dockerfile.data-api …` (или `datalens/build-all-images.ps1`), затем `docker compose up -d --force-recreate control-api data-api`.

5. **Локальный UI (dev):** в `.env` обязательно **`BI_DATA_ENDPOINT=http://localhost:8020`** (как в demo), иначе клиент может стучаться на неверный порт (см. обновлённые дефолты в `shared/endpoints/constants/opensource.ts`).

6. **Внешняя БД (MSSQL и т.д.):** data-api выполняет запрос к источнику; если сеть/firewall/учётные данные недоступны **из контейнера** data-api, в логах будет ошибка драйвера/SQL.

### MSSQL на том же ПК, что и Docker (типично Windows)

- В строке подключения **`localhost` / `127.0.0.1`** с точки зрения **контейнера** — это сам контейнер, а не ваш Windows-хост. Тогда проверка подключения может «случайно» не совпадать с реальным доступом к SQL на хосте, а предпросмотр и выполнение запросов падают с ошибками FreeTDS/pyodbc в логах **control-api** / **data-api**.
- Задайте хост SQL Server так, чтобы его видели контейнеры: например **`host.docker.internal`** (Docker Desktop), или **статический IP вашего ПК в LAN**, при необходимости включите TCP/IP в конфигурации SQL Server и откройте порт (часто **1433**) в брандмауэре для подсети Docker.
- В **`docker-compose.yaml`** у сервисов **control-api** и **data-api** уже задано `extra_hosts: host.docker.internal:host-gateway`, чтобы имя `host.docker.internal` резолвилось и в Linux Engine (не только в Docker Desktop). После изменения compose перезапустите стек.

### MSSQL на отдельном сервере / по IP в LAN (например 192.168.x.x)

- Если в настройках подключения указан **реальный IP** сервера MSSQL в сети (например **`192.168.201.10`**), менять его на `host.docker.internal` **не нужно** — контейнеры data-api/control-api обращаются к этому IP по сети так же, как любой другой узел в LAN.
- Убедитесь, что с **хоста, где крутится Docker**, до этого IP есть маршрут и пинг, **на SQL Server** разрешён TCP (часто порт **1433**), а **брандмауэр** на сервере MSSQL и на промежуточных узлах пропускает трафик **из подсети Docker / с машины с DataLens** к `192.168.201.10:1433`.
- Если предпросмотр не работает, при том что с вашего ПК SSMS доходит до сервера — смотрите **`docker logs datalens-data-api-<APP_ENV>`** (и при необходимости `datalens-control-api-*`): ошибки **FreeTDS** / **pyodbc** (таймаут, login failed, TLS и т.д.).
- После смены хоста в настройках подключения **сохраните** подключение и снова откройте предпросмотр.

После исправления конфигурации перезапустите **data-api** (и при необходимости **us**):  
`docker compose -f docker-compose.demo.yaml up -d data-api`

## Локальный dev: `npm run dev` (UI на хосте) + Docker

1. Поднимите бэкенд из каталога `datalens`:  
   `docker compose -f docker-compose.demo.yaml --env-file ./.env up -d`
2. Скопируйте `components/datalens-ui/.env.example` → `.env` и задайте (порты как в demo):  
   `US_ENDPOINT=http://localhost:8030`, `BI_API_ENDPOINT=http://localhost:8010`, `BI_DATA_ENDPOINT=http://localhost:8020`, `AUTH_ENDPOINT=http://localhost:8088`, **`US_MASTER_TOKEN`** = тот же, что в `datalens/.env` (часто `us-master-token`).
3. `APP_ENV=development`, `APP_INSTALLATION=opensource`, `APP_MODE=full`.
4. В браузере открывайте **клиентский** порт dev (см. `app-builder.config` / `DEV_CLIENT_PORT`, на Windows часто **3031**), а не порт API Express.
5. Проверка: `docker compose -f docker-compose.demo.yaml ps` — контейнеры `us`, `data-api`, `control-api`, `us-auth` в статусе Up; с хоста отвечают `http://localhost:8030`, `http://localhost:8020` (можно открыть в браузере — ожидается не «connection refused»).

## Порты и переменные (кратко)

| Переменная        | Где используется | По умолчанию в compose (внутри сети) | С хоста (demo) |
|-------------------|------------------|--------------------------------------|----------------|
| US_ENDPOINT / US  | UI, data-api, …  | http://us:8080                       | localhost:**8030** |
| BI_API_ENDPOINT   | UI (control-api) | http://control-api:8080              | localhost:**8010** |
| BI_DATA_ENDPOINT  | UI (data-api)    | http://data-api:8080                 | localhost:**8020** |
| AUTH_ENDPOINT     | UI, US           | http://us-auth:80/demo               | localhost:**8088** … |
| NODE_RPC_URL      | US, meta-manager | http://us-auth:80/demo/rpc           |                  |

В образе us-auth nginx слушает порт 80; REST auth (signin/refresh/logout) — под путём /demo (при сборке из исходников `components/datalens-auth`). Если у вас другой порт, задайте в `.env` нужные значения.

## Playwright E2E-тесты (вход и дашборд)

Тесты лежат в `components/datalens-ui/tests/` (проекты `basic` и `opensource`). Запуск с авторизацией и заходом на дашборд:

1. Установите браузеры: из папки `components/datalens-ui` выполните `npx playwright install`.
2. Запустите платформу (например `docker compose up -d` из папки `datalens`).
3. Задайте переменные и запустите тесты:
   ```powershell
   $env:E2E_DOMAIN="http://localhost:8080"
   $env:E2E_USER_LOGIN="master"
   $env:E2E_USER_PASSWORD="qwe-123"
   npx playwright test --config=tests/playwright.config.ts --project=opensource opensource-suites/dash/base/loading.test.ts
   ```
   Полный прогон: `npx playwright test --config=tests/playwright.config.ts --project=opensource`.
