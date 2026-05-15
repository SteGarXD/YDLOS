# Сводная таблица: стилизация через платформу

## Источник правды — бэкенд

Внешний вид сводной (цвет шапки и футера, выравнивание колонок «Рейс» и «Напр-е») задаётся **на бэкенде** через:

- **`cell.css`** — в данных каждой ячейки (head/rows/footer): `backgroundColor`, `color`, `text-align` и т.д.
- **Константы** в `server/modes/charts/plugins/constants/misc.ts`: `TABLE_HEADER_FOOTER_BG`, `TABLE_TOTALS_STYLES`, `TABLE_BODY_COLUMN_*`.

Фронт **только применяет** переданные стили в `getCellCustomStyle()` (см. `utils.ts`): читает `cell.css`, при необходимости `custom.trafficLightPercent` / `custom.turquoiseMeasure`, и не подставляет свои цвета для шапки/футера поверх данных.

## Где что править

- **Шапка:** `backend-pivot-table/table-head-generator.ts` — всегда серый фон (`TABLE_TOTALS_STYLES` поверх палитры), чёрные границы, `textAlign: 'center'` для первых двух колонок (и в column head, и в row head — в row передаётся `headerColumnIndex` из `table-rows-generator.ts`).
- **Футер:** `backend-pivot-table/helpers/backgroundColor.ts` — единый серый фон для всего блока ИТОГО и колонки с названиями метрик через `TABLE_HEADER_FOOTER_BG`.
- **Тело:** `backend-pivot-table/helpers/backgroundColor.ts` — выравнивание по центру для колонок 0 и 1 (Рейс, Напр-е) через `cell.css['text-align']`.

Тема дашборда для таблицы не используется: вид сводной задаётся только данными с бэкенда. При необходимости расширять константы и логику в `backend-pivot-table`, не добавляя переопределений в тему дашборда.

## Раскраска тела и пресеты

- Пресеты «Светофор %» и «Бирюзовый», заливка по полю, градиент — по-прежнему задаются на бэкенде (`backgroundColor.ts`, `color.ts`); фронт применяет их через `getCellCustomStyle()`.

## Объединение ячеек и структура футера

- Логику объединения первой ячейки «ИТОГО» (colSpan и т.д.) оставляет фронт в `usePreparedTableData`; цвета и фон футера приходят только из данных (бэкенд).

## Ширины «Рейс» и «Напр-е» (`usePreparedTableData` + `cell-width.ts`)

- Константы **`MIN_COL_REYS` / `MIN_COL_NAPR`** — целевая ширина; для колонок **0 и 1** задаётся **`fixed`** (см. `ColWidthInput` в `cell-width.ts`), чтобы они **не раздувались коэффициентом `k`** в `getCellsWidth` при широком виджете.
- Раньше большой **MIN** у «Напр-е» (например 108px) не позволял колонке стать уже этого значения даже при узком контенте.
- **`cellMinSizes` из `BackgroundTable`** для колонок **0 и 1 не используется**: замер идёт по таблице **без** `dl-table_prepared`, плюс минимумы в `BackgroundTable` только **растут**.

## Вёрстка: цифры не «вылезают» из ячеек

- В `Table.scss` у ячеек и `.dl-table__cell-content` заданы **`min-width: 0`**, **`overflow: hidden`**, у тела таблицы — **`white-space: nowrap`** + **`text-overflow: ellipsis`**, чтобы при `display: grid`/`flex` длинные значения не ломали сетку.
- Обёртка таблицы — **`overflow-x: auto`** (класс `no-h-scroll` не включаем): при сумме колонок больше ширины виджета виден горизонтальный скролл; в `usePreparedTableData` после `enforceMinsWithinBudget` при необходимости вызывается повторный **`fitColumnWidthsToBudget`**, чтобы сумма треков не превышала контейнер.

## Граница «Напр-е» | Measure names (одна линия)

Сетка рисуется **только** `border-right` + `border-bottom` у ячеек (без `border-left`, кроме первой колонки). Между **Напр-е** (логический индекс **1**) и **Measure names** нужна **ровно одна** вертикаль: иначе `border-right` у Напр-е **и** `border-left` у Measure names дают **двойную/толстую** серую линию.

**Правило:** у ячейки с **`data-col-start="1"`** снимаем `border-right`; у **`.td_measure-names` / `.th_measure-names`** оставляем один **`border-left: 1px`** цвета `--dl-table-body-grid-color` (тело) / `#000` (шапка/футер).

**Важно:** нельзя ориентироваться на **`:nth-child(2)`** — при **rowspan** у «Рейс»/«Напр-е» в следующих строках в `<tr>` **нет** первых `<td>`, и «второй» дочерний элемент — это уже **не** колонка Напр-е, а другая логическая колонка; стили границ тогда попадают не туда и ломают колонки 2–4.
