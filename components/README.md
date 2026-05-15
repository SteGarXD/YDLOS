# Исходный код компонентов YDL OS

Код здесь — **тот же код, что и в запущенных контейнерах**: те же версии (теги образов из `datalens/docker-compose`). В Docker работает **образ этой версии + патчи из `datalens/patches`**. Любые изменения в `components/` — это изменения **текущей версии и сборки BI-платформы**; чтобы они попали в работающий Docker — пересобрать образ или использовать `docker-compose.dev.yaml` с монтированием из `../components/`.

## Структура (после клонирования)

```
components/
├── datalens-ui/           # Фронтенд + Node.js BFF (версия = образ datalens-ui)
├── datalens-backend/      # control-api + data-api (версия = образ control-api/data-api)
├── datalens-us/           # United Storage
├── datalens-auth/         # Авторизация RPC
└── datalens-meta-manager/ # Экспорт/импорт воркбуков
```

Версии задаются в `scripts/component-versions-from-compose.ps1` (теги образов akrasnov87/*).

## Как заполнить / синхронизировать с контейнерами

Из **корня репозитория**:

- **Первый раз** — клонировать исходники на нужных версиях:
  ```powershell
  .\scripts\clone-components.ps1
  ```
- **Уже есть components/** — переключить на версии образов:
  ```powershell
  .\scripts\sync-components-to-container-versions.ps1
  ```

После этого `components/` отражает ту же базу, что и запущенные образы; отличия от «ванильной» платформы задаются в **datalens/patches** (dl_core, data-api-mssql, UI-патчи и т.д.).

## Зависимости для IDE и локальной разработки

В клонированных компонентах по умолчанию **нет** `node_modules`. Из-за этого IDE может показывать ошибки вроде **«File '@gravity-ui/tsconfig/tsconfig' not found»** в `datalens-ui` (и в других компонентах с TypeScript).

Установите зависимости в нужных компонентах (из корня репозитория):

```powershell
.\scripts\install-components-deps.ps1
```

Или вручную только для UI:

```powershell
cd components/datalens-ui
$env:HUSKY = "0"   # иначе prepare/husky падает: .git в корне YDLOS, не в datalens-ui
npm install
```

Скрипт `.\scripts\install-components-deps.ps1` выставляет `HUSKY=0` сам.

После установки зависимостей ошибки tsconfig в IDE исчезнут.

**IDE (VS Code и др.):** Если открыт корень репозитория (YDLOS), TypeScript может искать пакеты в корне и показывать «File '@gravity-ui/tsconfig/tsconfig' not found». Решения: добавить в workspace папку `components/datalens-ui` (File → Add Folder to Workspace) или открывать для правок UI отдельно папку `components/datalens-ui`.

**Примечание:** В `datalens-auth/app` есть зависимости из приватных git-репозиториев (`git.mobwal.com`). Без доступа к ним `npm install` там завершится с ошибкой; для разработки UI/бэкенда/остальных сервисов это не требуется.

## Сборка и запуск

- **Только Docker:** из `datalens/` — `docker compose up -d`. Образы с Docker Hub + патчи через тома.
- **Разработка с локальным кодом:** см. [docs/CODEBASE-MAP.md](../docs/CODEBASE-MAP.md) и [datalens/docker-compose.dev.yaml](../datalens/docker-compose.dev.yaml) — монтирование из `../components/`.

## Проверка проекта

Из корня репозитория можно убедиться, что версии компонентов совпадают с compose и все патчи на месте:

```powershell
.\scripts\verify-project.ps1
```

## Git

Папка **components/** в `.gitignore`. Свои изменения в компонентах можно вести отдельными коммитами и при необходимости держать в форках.
