# Документация Yandex DataLens OpenSource и лимиты платформы

## Официальная документация

**Базовый URL:** [https://datalens.ru/opensource/docs/ru/](https://datalens.ru/opensource/docs/ru/)

Содержимое главной страницы документации (разделы и краткое описание) прочитано и зафиксировано. Внутренние ссылки ведут к якорям или маршрутам SPA на том же домене; отдельные URL подразделов (например `/limits`) на этом сайте не открываются как отдельные страницы — актуальная структура приведена ниже.

Разделы (на главной):
- **Начало работы** — как начать работать с DataLens
- **Подключения** — подключение к источникам данных
- **Датасеты** — описание структуры данных
- **Вычисляемые поля** — формулы и поля
- **Чарты** — визуализации на основе датасета
- **Дашборды** — чарты на одной странице
- **Управление доступом**
- **Администратору DataLens**
- **Решение проблем**
- **Квоты и лимиты** — технические и организационные ограничения сервиса

Использовать эту документацию как основной справочник по возможностям и заявленным ограничениям облачного/опенсорс продукта.

---

## Реестр лимитов в коде YDL-OS (до ослабления)

Лимиты, которые были в платформе и ослаблены для снятия ограничений без потери стабильности.

### Backend (datalens-backend)

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `dl_core/constants.py` | `DatasetConstraints.FIELD_COUNT_LIMIT_SOFT` | 1200 | 10000 | Мягкий лимит полей в датасете |
| `dl_core/constants.py` | `DatasetConstraints.FIELD_COUNT_LIMIT_HARD` | 1250 | 10500 | Жёсткий лимит полей |
| `dl_core/constants.py` | `DatasetConstraints.FIELD_UI_SETTINGS_MAX_SIZE` | 32 KB | 256 KB | Макс. размер UI-настроек поля |
| `dl_core/constants.py` | `DatasetConstraints.OVERALL_UI_SETTINGS_MAX_SIZE` | 1.4 MB | 16 MB | Общий размер UI-настроек |
| `dl_core/constants.py` | `DataAPILimits.DEFAULT_SUBQUERY_LIMIT` | 100_000 | 10_000_000 | Лимит подзапросов |
| `dl_core/constants.py` | `DataAPILimits.DEFAULT_SOURCE_DB_LIMIT` | 1_000_000 | 10_000_000 | Лимит строк по умолчанию |
| `dl_core/constants.py` | `DataAPILimits.PREVIEW_ROW_LIMIT` | 1000 | 100_000 | Строк в превью датасета |
| `dl_core/constants.py` | `DataAPILimits.PREVIEW_API_DEFAULT_ROW_COUNT_HARD_LIMIT` | 100_000 | 10_000_000 | Превью API |
| `dl_core/constants.py` | `DataAPILimits.DATA_API_DEFAULT_ROW_COUNT_HARD_LIMIT` | 1_000_000 | 10_000_000 | Data API |
| `dl_core/constants.py` | `DataAPILimits.PIVOT_API_DEFAULT_ROW_COUNT_HARD_LIMIT` | 100_000 | 10_000_000 | Pivot API |
| `dl_core/data_source/base.py` | `default_chunk_row_count` | 10_000 | 100_000 | Размер чанка при стриминге данных |

### UI — charts-engine (datalens-ui)

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `server/components/charts-engine/constants/index.ts` | `ALL_REQUESTS_SIZE_LIMIT` | 1000 MB | 8000 MB | Суммарный объём ответов |
| `server/components/charts-engine/constants/index.ts` | `REQUEST_SIZE_LIMIT` | 500 MB | 4000 MB | Объём одного ответа |
| `server/components/charts-engine/constants/index.ts` | `CONCURRENT_REQUESTS_LIMIT` | 10 | 50 | Параллельные запросы к источникам |
| `server/components/charts-engine/constants/index.ts` | `DEFAULT_FETCHING_TIMEOUT` | 100 с | 300 с | Общий таймаут |
| `server/components/charts-engine/constants/index.ts` | `DEFAULT_SINGLE_FETCHING_TIMEOUT` | 95 с | 290 с | Таймаут одного запроса |

### UI — wizard / shared

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `shared/constants/wizard.ts` | `MAX_SEGMENTS_NUMBER` | 25 | 200 | Макс. сегментов в графике (линиях и т.д.) |
| `ui/constants/misc.ts` | `DEFAULT_PAGE_ROWS_LIMIT` | 100 | 10000 | Строк на странице таблицы по умолчанию |
| `ui/units/wizard/components/Dialogs/Settings/LimitInput/LimitInput.tsx` | `MAX_ROW_LIMIT` | 100000 | 10000000 | Макс. значение лимита строк в настройках |
| `ui/units/wizard/.../VisualizationLayersControl.tsx` | `MAX_LAYERS_COUNT` | 5 | 20 | Слоёв на карте |
| `ui/units/wizard/components/ValuesList/ValuesList.tsx` | `MAX_VALUES_COUNT` | 100 | 2000 | Показываемых значений в списке |
| `ui/units/wizard/components/ValuesList/ValuesList.tsx` | `VALUES_LOAD_LIMIT` | 1000 | 10000 | Лимит загрузки значений для селектора |
| `ui/units/datasets/.../ColorsDialog.tsx` | `VALUES_LOAD_LIMIT` | 1000 | 10000 | Лимит загрузки значений в диалоге цветов |
| `ui/components/ValuesList/ValuesList.tsx` | `MAX_VALUES_COUNT` | 100 | 2000 | То же (общий компонент) |

### UI — датасеты

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `ui/units/datasets/.../PreviewHeader/constants.ts` | `ROWS_MAX_COUNT` | 1000 | 100000 | Макс. строк в превью (ввод пользователя) |

### UI — дашборд и подключения

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `ui/units/dash/.../MaxConnection.tsx` | `MAX_CONCURRENT_REQUESTS` | 6 | 24 | Одновременных запросов виджетов |
| `ui/units/connections/store/actions/file.ts` | `FILE_MAX_SIZE` | 200 MB | 2048 MB | Макс. размер загружаемого файла |

### UI — Chartkit (axios, data-provider)

| Место | Константа | Было | Стало | Назначение |
|-------|-----------|------|-------|------------|
| `ui/libs/DatalensChartkit/.../axiosConcurrency.ts` | `MAX_CONCURRENT` | 10 | 50 | Параллельные HTTP-запросы чарткита |

### Не менялись (оставлены как есть)

- **MAX_ENTRY_DESCRIPTION_LENGTH** (36_000 символов) — достаточно для описаний.
- **Таймауты/статусы** (420, 408, 422 и т.д.) — только коды ответов, не лимиты.
- **MIN_ROW_LIMIT** (1) — смысловой минимум.
- **E2E_MAX_WORKERS / E2E_MAX_FAILURES** — настройки тестов, не продуктивные лимиты.
- **Визуальные константы** (шрифты, размеры плиток) — не ограничения объёма данных.

---

## После изменений

После применения правок по этому реестру платформа имеет существенно повышенные лимиты; типичное использование не упирается в ограничения. При необходимости дополнительно поднять или ослабить конкретный лимит — править только указанные константы и пересобрать/перезапустить соответствующий компонент (UI или backend).

Официальная документация по квотам и лимитам: [Квоты и лимиты](https://datalens.ru/opensource/docs/ru/) (раздел на главной).
