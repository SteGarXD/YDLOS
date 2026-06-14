# Параметры датасета (YDL OS)

## Поведение

- **`DatasetComponentAccessor.get_parameter_values`**: в словарь подстановки `{{имя}}` в SQL попадают **все** поля-параметры с `default_value` (не требуется отдельно `template_enabled` на поле — иначе возможен `TEMPLATE_INVALID: Key … not found in {}` при валидации).
- **`FormulaCompiler`**: для полей-параметров **не** применяется жёсткая проверка `value_constraint` при компиляции (совпадает с превью: даты, строки, списки через запятую для TVF).
- **`DatasetValidator`**: не выдаёт ошибку «Value constraint is required for string parameters with template enabled».

## Образы Docker

Патчи в **`datalens/build/Dockerfile.control-api`** и **`Dockerfile.data-api`** (в т.ч. `accessor.py`, `formula_compiler.py`, `validator.py`). После изменений бэкенда пересоберите **control-api** и **data-api**.

## Сохранение чарта (401 / US.AUTH.UNAUTHORIZED_ACCESS)

Запросы к United Storage из **charts-engine** (`POST /api/charts/v1/charts`) идут напрямую с UI-сервера. В **`provider.ts`** (`injectMetadata`) должен быть заголовок **`x-us-master-token`** (как в `gateway` для data-api). Без него US отвечает 401 при создании записи чарта.

## Таймауты charts-engine / pivot (`ERR.CHARTS.ALL_REQUESTS_TIMEOUT_EXCEEDED`, 424)

- Общий таймаут источников задаётся **`fetchingTimeout`** в конфиге NodeKit (`server/configs/common.ts`): по умолчанию **300 с**, одиночный запрос — **290 с** (переменные окружения **`DATA_FETCHING_TIMEOUT_MS`** и **`DATA_SINGLE_FETCHING_TIMEOUT_MS`** в секундах).
- При тяжёлых pivot-запросах к data-api увеличьте значения в `.env` при необходимости.

## Экспорт XLSX и визуал как в UI

Конвертер **`xlsx-converter.ts`** использует **ExcelJS**: границы, заголовок (жирный/серый без шаблона), выравнивание чисел, заливка по **`cell.css.backgroundColor`** из данных таблицы. Клиент **`export.js`** и серверный **`export-entries`** передают **`cellStyles`** (сетка `[строка][колонка]`) в **`chartData`**; при несовпадении размеров сетки со строками экспорта заливки отключаются (pivot/grid с развёрткой колонок). Опционально: шаблон **`table-report-headers/{widget}.xlsx`**.

## Календарь «по месяцу» (один клик)

В **`RelativeDatesPicker`**: при **диапазоне**, обе стороны **абсолютные**, шкалы **«месяцы»** (`M`) для начала и конца — календарь только в режиме **месяцев**; выбор задаёт **начало месяца** для начала периода и **конец месяца** для конца.
