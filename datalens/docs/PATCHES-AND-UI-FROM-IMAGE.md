# Патчи и UI из образа

## Режим «всё в исходниках» (текущий)

**Договорённость:** все доработки UI делаются в **исходниках** (components/datalens-ui). Патчи к собранному JS и монтирование папки `patches` для UI **не используются**.

- В контейнер `ui` монтируется **только** `./nginx/nginx.conf` (см. `docker-compose.yaml`). Папки `patches/` (expresskit, common, custom, build) **не монтируются**.
- Брендинг (лого, название «Aeronavigator BI»), сводная таблица, иконки — в коде: `opensource-branding.scss`, `migrate-to-old-format.ts`, `icons.ts` и т.д. Сборка: `.\build-and-run-ui.ps1` или `.\build-all-images.ps1` (образ aeronavigatorbi/datalens-ui).
- Скрипты `apply-patches.ps1`, `build-ui.ps1` и подмена `dl-main.*.js` **не применяются** и не нужны при работе «всё в исходниках».

---

## Ошибка 500 getUsersByIds (EAI_AGAIN) — исправлено

**Причина:** В `docker-compose.yaml` у сервиса `us` указано `AUTH_ENDPOINT: http://auth:8080`, а сервис авторизации называется `us-auth`. Имя хоста `auth` в сети не резолвилось → временная ошибка разрешения имени (EAI_AGAIN) и 500.

**Исправление:** Для сервиса `us-auth` в сети `default` добавлен алиас `auth`. После изменения перезапустите стек:
```bash
docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml up -d --force-recreate
```

---

## Превью сводной таблицы: только спиннер

Если в визарде сводной таблицы справа показывается только индикатор загрузки (спиннер), а данные не приходят:

1. **Сеть (DevTools → Network):** есть ли запрос к data-api/control-api за данными графика и какой у него статус (200, 500, таймаут).
2. **Консоль (DevTools → Console):** есть ли ошибки JavaScript или сообщения об ошибках с бэкенда.
3. **Бэкенд:** подняты ли контейнеры data-api, control-api; для сводной на MSSQL нужны правки в data-api (query_compiler и т.д., см. backend-patches).

Если запрос не уходит или возвращается с ошибкой — проблема на стороне бэкенда или конфигурации датасета/подключения. Если запрос 200 и данные приходят, но таблица не рисуется — смотреть консоль и код рендерера таблицы (ChartKit Table, mapTableData).

---

## Справочно: что раньше делали патчи (сейчас не используется)

| Патч | Назначение (исторически) |
|------|---------------------------|
| `patches/expresskit.js` | Сервер: OIDC, маршруты. |
| `patches/common.js` | Конфиг: название сервиса, политика auth. |
| `patches/nginx.conf` | Nginx: раздача `/custom/`, anbi.js/anbi.css. |
| `patches/custom/` | Брендинг: logo, anbi.js, anbi.css. |
| `apply-patches.ps1` | Правка собранного dl-main.*.js (иконки, список типов в QL). |

Сейчас всё это заменено правками в исходниках и образом aeronavigatorbi/datalens-ui.
