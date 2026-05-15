# Прод: сборка, образы и запуск (Aeronavigator BI)

## Идея

- **Всё в исходниках:** брендинг, сводная таблица (окраска колонок, скрытый Measure Names, ЗПК %, Млн. р) и иконки — в `components/datalens-ui`. В образ попадают и **фронт** (dist/public/build), и **сервер** (dist/server), иначе окраска сводной не работает.
- **Патчи к бандлу не используются.** Контейнеру `ui` монтируется только `./nginx/nginx.conf`.

**Текущий вариант сборки (откат):** в образ попадает только **фронт** (dist/public/build). В `.dockerignore` снова исключены `dist/server` и `dist/shared` — в контейнере работает **базовый** сервер из образа. Таблица и данные должны отображаться; окраски колонок/ЗПК/скрытого Measure Names не будет. Чтобы вернуть окраску: в `components/datalens-ui/.dockerignore` закомментировать строки `dist/server` и `dist/shared`, пересобрать образ и перезапустить ui/ui-api.

---

## Полный цикл для UI (рекомендуемый)

Из папки **datalens**:

```powershell
.\build-and-run-ui.ps1
```

Скрипт по шагам:

1. **Сборка UI** в `components/datalens-ui`: очистка `dist`, `i18n:prepare`, `app-builder build`, `copy-public-assets`. В итоге в `dist` есть:
   - `dist/public/build` — фронт (манифест, чанки, статика);
   - `dist/server` — Node-сервер (в т.ч. окраска сводной: `backend-pivot-table/helpers/backgroundColor.ts`, `constants/misc.ts`).
2. **Проверка:** наличие `dist/public/build/build-info.txt` и `dist/server`.
3. **Сборка образа** `aeronavigatorbi/dl-ui:local` по `Dockerfile.ui.from-host` (контекст = `components/datalens-ui`). В образ копируются `dist` (включая server и public) и `dist/public` → `/opt/app/public`.
4. **Тег** `aeronavigatorbi/datalens-ui:0.3498.0`.
5. **Перезапуск** контейнеров `ui` и `ui-api` через compose (docker-compose.yaml + docker-compose.own-images.yaml).

Проверка после запуска: http://localhost:8080/build/build-info.txt — должно быть «Aeronavigator BI custom build».

---

## Запуск всего стека (prod)

1. Собрать образы (один раз или после изменений бэкенда/UI):
   - **Только UI:** `.\build-and-run-ui.ps1`
   - **Все образы (в т.ч. postgres, temporal, control-api, data-api, us, auth, meta-manager):** из корня репо `.\datalens\build-all-images.ps1` (UI там собирается по Dockerfile.ui; при ошибке EOF на Windows — использовать build-and-run-ui.ps1 для UI).
2. Запуск: из папки datalens выполнить `.\run-own-images.ps1` (поднимает все сервисы на образах aeronavigatorbi, APP_ENV=prod).
3. Открыть http://localhost:8080.

Перезапуск только UI после правок в datalens-ui: снова `.\build-and-run-ui.ps1` (он пересобирает и перезапускает ui, ui-api).

---

## Где реализована окраска сводной

| Что | Где в коде |
|-----|------------|
| Цвета колонок (Рейс, Напр-е, Measure Names, Итого справа), ЗПК % (светофор), Млн. р (бирюзовый) | `components/datalens-ui/src/server/modes/charts/plugins/constants/misc.ts` |
| Применение фона к ячейкам сводной | `components/datalens-ui/src/server/modes/charts/plugins/datalens/preparers/backend-pivot-table/helpers/backgroundColor.ts` |
| Передача config с backgroundSettings в run | `components/datalens-ui/src/ui/libs/DatalensChartkit/modules/data-provider/charts/index.ts` (комментарий YDL OS) |

Чтобы это работало в контейнере, в образ должен попадать **dist/server** (в .dockerignore для from-host не исключаем dist/server и dist/shared).

---

## Если превью сводной без окраски или без данных

- Убедиться, что используется образ с нашей сборкой: http://localhost:8080/build/build-info.txt.
- Пересобрать с включённым server: `.\build-and-run-ui.ps1` (и что в .dockerignore не исключены dist/server и dist/shared).
- В настройках полей сводной для мер заданы «Пресет заливки ячеек» (Светофор для ЗПК %, Бирюзовый для Млн. р и т.д.) — иначе сервер не применит цвета по пресетам.

## Если в сводной отображается «Нет данных»

Сообщение «Нет данных» выводится, когда в ответе сервера у таблицы пустой `head` (нет заголовков). Для сводной это происходит, когда **data-api** возвращает пустой результат по pivot-запросу: `pivot_data.rows` и `pivot_data.columns` пустые (см. `backend-pivot-table/index.ts`: при `rows.length === 0 && columns.length === 0` возвращается `head: []`).

Что проверить:
- Логи **data-api**: `docker logs datalens-data-api-prod --tail 100` — ошибки, таймауты, отказ подключения к БД.
- Подключение и датасет: источник датасета «Сводная (Repka)», что за запрос/таблица, есть ли данные в источнике.
- Коннектор и БД: для MSSQL — правки в data-api (backend-patches), доступность БД из контейнера.

---

## Если превью сводной полностью пустое (белый экран)

Сервер при этом может отдавать 200 (в логах ui: `POST /api/run` → 200, PROCESSED_SUCCESSFULLY). Тогда проблема на стороне фронта при разборе или отрисовке ответа.

1. **Консоль браузера (F12 → Console):** есть ли красные ошибки после загрузки визарда (например, при рендере таблицы или разборе данных).
2. **Сеть (F12 → Network):** запрос `POST .../api/run` — статус 200, размер ответа. Если ответ большой и без ошибок, а превью пустое — ошибка в клиентском коде (ChartKit/таблица).
3. **Временный откат:** если пустой экран появился после добавления в образ dist/server, можно снова исключить в .dockerignore строки `dist/server` и `dist/shared`, пересобрать образ и перезапустить. Превью должно снова показывать данные (без нашей окраски колонок/ЗПК). После этого можно искать причину в формате ответа или во фронте.
