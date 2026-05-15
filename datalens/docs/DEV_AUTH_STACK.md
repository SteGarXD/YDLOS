# Dev UI, Docker и вход в платформу

## Два разных способа открыть интерфейс

| Режим | Что запущено | Порт | Контейнер `ui-prod` |
|-------|----------------|------|---------------------|
| **Разработка из исходников** | `npm run dev` в `components/datalens-ui` (Rspack 3031 + Express API, часто **3040**) | **3031** (страница + HMR) | **Может быть остановлен** — UI идёт с хоста, не из образа |
| **Только Docker** | Образ `datalens-ui` / сервис `ui` в compose | обычно **8080** | Должен быть **running** |

Остановленный **`ui-prod`** в Docker Desktop **не мешает** dev-сценарию на `localhost:3031`, если API (Express) проксирует запросы к тем же `us` / `auth`, что и в compose.

## Почему был `getAuth` → 500

Сервис **US** (`GET /auth`) отдавал объект `{ err: axiosError, data: null }`. У ответа axios есть **циклические ссылки** → `JSON.stringify` / прокси gateway падали с **500**.

Исправление: в `components/datalens-us/src/controllers/auth.ts` ответ сериализуется в безопасный JSON (`message`, `status`, `code`).

## Что проверить, если вход не работает

1. **`us`** и **`auth` / `us-auth`** в Docker — **running**.
2. В **`datalens/.env`** (или переменных compose): `NODE_RPC_URL` у **us** должен быть вида `http://us-auth/.../rpc` (в коде `/rpc` заменяется на `/auth` для логина).
3. Локальный dev UI: в **`components/datalens-ui/.env`** endpoint **US** / **gateway** должен указывать на доступный с хоста адрес (часто `http://localhost:8030` для US, если порт проброшен), согласованный с compose.

## FOUC на `/auth`

В плагин layout добавлены **инлайн-стили** для `.dl-signin`, чтобы до загрузки SCSS форма не выглядела «голым» HTML.

## React Refresh / WebSocket

`@gravity-ui/app-builder` по умолчанию задаёт **`webSocketPath`: `/build/sockjs-node`**. Клиент HMR и плагин React Refresh должны использовать **тот же путь**, что и `webpack-dev-server` / `@rspack/dev-server`. В `app-builder.config.ts` для YDL OS переопределено **`webSocketPath: '/ws'`** (как в webpack-dev-server@5), иначе в консоли: *React Refresh — Failed to set up the socket connection*.

Шум **`ResizeObserver loop completed…`** в dev обрабатывается ранним inline-скриптом в layout (и дублируется в `dl-main`), чтобы не открывался красный runtime-overlay.
