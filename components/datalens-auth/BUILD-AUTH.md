# Сборка образа datalens-auth (us-auth) из исходников

**Обычно достаточно готового образа akrasnov87** (у вас под тегом aeronavigatorbi/datalens-auth:0.2.6): pull+tag в `build-all-images.ps1`, свою сборку не делаем. Заглушка 401 для refresh в UI убрана — запросы идут в us-auth; если в образе есть `/demo/refresh`, продление сессии уже работает.

Сборка из исходников нужна только если по `/refresh` приходит 404 (в образе нет маршрутов datalens-auth.js) или нужны свои правки в auth.

Образ из наших исходников: **`app/app.js` подключает `routes/datalens-auth.js`** под виртуальным префиксом (`/demo/...`), поэтому доступны **`POST /demo/refresh`**, **`GET /demo/logout`**, **`POST /demo/signin`** (параллельно RPC **`POST /demo/auth`** из `rpc/index.js`).

## Зависимости

В `app/package.json` есть зависимости с **git.mobwal.com**:

- `mobnius-pg-dbcontext`
- `mobnius-schema-reader`

Если при сборке образа или при `npm install` в `app/` хост не имеет доступа к git.mobwal.com, установка падает. В этом случае сборку нужно выполнять на машине с доступом (VPN, корпоративная сеть) или использовать уже собранный образ.

## Сборка образа в YDL OS (рекомендуется)

`Dockerfile` — **патч поверх базового образа** `akrasnov87/datalens-auth@sha256:…` с Docker Hub (в нём уже `node_modules`). Копируются только **`app/app.js`** и **`app/routes/datalens-auth.js`**. Полная пересборка Node-приложения внутри образа без **git.mobwal.com** не выполняется.

```bash
cd components/datalens-auth
docker build -f Dockerfile -t akrasnov87/datalens-auth:0.2.6 .
```

При обновлении базового образа на Hub смените **digest** в первой строке `Dockerfile` (команда: `docker pull akrasnov87/datalens-auth:0.2.6` и `docker inspect … --format '{{index .RepoDigests 0}}'`).

## Полная пересборка app (только при доступе к git.mobwal.com)

На хосте с доступом к git.mobwal.com:

```bash
# из корня репозитория
cd components/datalens-auth/app
npm install
cd ..
# далее нужен отдельный Dockerfile со stage COPY app + npm ci — в штатном YDL OS не используется
```

## После сборки

- В **docker-compose** используйте образ `aeronavigatorbi/datalens-auth:0.2.6` (или свой тег).
- В UI заглушка 401 для `refreshTokens` убрана: запросы на обновление токена проксируются в us-auth. Если в образе есть `/demo/refresh`, продление сессии будет работать «как у akrasnov87».
- Пересоберите UI и перезапустите стек (см. `datalens/TROUBLESHOOTING.md`).
