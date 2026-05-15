# Выравнивание под ожидаемую логику и отклик форка akrasnov87: PDF и Excel

## 1. PDF — ожидания akrasnov87 и как подстроиться

### Контракт API (одинаковый у baseline и у вас)

| Элемент | Значение |
|--------|----------|
| **Метод и URL** | `POST /print-entry` |
| **Заголовок** | `x-rpc-authorization: <токен>` |
| **Body** | `links` (string[]), `host` (string), `options` (Puppeteer PDF options), `params` (any, опционально) |

### Ожидаемый отклик

- **Успех:** HTTP 200, `Content-Type: application/pdf`, тело — бинарный PDF (один файл, первый чарт из `links`).
- **Ошибка:** 404 / 500 / 503 с текстом или JSON `message` (у вас — JSON).

### Что нужно для идеального совпадения с форком

1. **Сохранять контракт:** не менять URL, метод, имена полей body и заголовок авторизации.
2. **Ответ при успехе:** отдавать именно PDF buffer с `Content-Type: application/pdf`; у вас дополнительно задаётся `Content-Disposition` — это расширение, не ломает клиент.
3. **Сервер:** в образе/на хосте должен быть Chrome/Chromium (как в baseline: `which google-chrome-stable`, путь в коде или `PUPPETEER_EXECUTABLE_PATH`). Без браузера PDF в этой схеме не работает.
4. **Токен в URL превью:** в baseline токен передаётся в query как `x-rpc-authorization=...`; у вас он кодируется через `encodeURIComponent` — правильно и безопаснее.

Итог: по PDF вы уже совместимы с ожидаемой логикой и откликом akrasnov87; достаточно не менять контракт и документировать требование Chromium.

---

## 2. Excel (export-entries) — ожидания akrasnov87 и отличия

### Контракт API (одинаковый)

| Элемент | Значение |
|--------|----------|
| **Метод и URL** | `POST /export-entries` |
| **Заголовок** | `x-rpc-authorization: <токен>` |
| **Body** | `links`, `host`, `formSettings` (format: `"csv"` и др.), `lang`, `outputFormat` (`"xlsx"` или `"csv"`), `exportFilename`, `params` (опционально) |

### Ожидаемый отклик

- **outputFormat === 'csv':** 200, `Content-Type: text/csv; charset=utf-8`, тело — CSV (один или несколько блоков с подзаголовками листов).
- **outputFormat === 'xlsx':** 200, тело — бинарный xlsx. Baseline **не** задаёт `Content-Type` и `Content-Disposition` явно; браузер всё равно скачивает как файл. У вас задаётся `Content-Type: application/vnd.openxmlformats-...` и `Content-Disposition` — это улучшение, клиент не ломается.

### Что в baseline (akrasnov87) по стилям Excel

- В **baseline** нет:
  - `getCellStyles` / извлечения стилей из данных чарта;
  - `apply_xlsx_styles.py`;
  - поля `styles_data_name` в метаданных.
- Экспорт дашборда: данные чартов → CSV → **dash2sheets.py** (IservMultiTabReportsLib) → один xlsx с листами. **Стили (фоны, шрифты, границы) в xlsx не проставляются** — только данные и структура листов.

То есть «ожидаемая логика» форка по Excel — это **данные и листы без гарантии стилей**. Полноценные фоны/шрифты/границы/цвета в baseline не заложены.

### Что у вас сверх baseline

- Учёт табличных чартов без `extra.datasets` (проверка `chart.data.type === 'table'` / `head` / `rows`).
- Извлечение фона ячеек из `chart.data` (`getCellStyles`: `cell.cell`, `cell.css`, `backgroundColor` и т.д.) и применение через **apply_xlsx_styles.py** (openpyxl) — только **заливка ячеек** (PatternFill). Шрифты, границы, выравнивание, цвет текста в скрипте не обрабатываются.

---

## 3. Excel: как сделать «всё на 100%» (фоны, шрифты, границы, цвета)

Чтобы выгрузка в Excel была с фонами, шрифтами, границами, раскраской и цветами «на сто процентов» и корректно обрабатывалась:

### 3.1. Что уже есть в данных чарта (таблица)

- В UI таблица опирается на `cell.css` (и при необходимости на `cell.cell`): там могут быть `backgroundColor`, `color`, `textAlign`, `verticalAlign` и т.д. В сводных таблицах часть стилей задаётся на бэкенде (например, `backend-pivot-table/helpers/backgroundColor.ts`), в UI границы задаются через CSS, а не через объект ячейки.
- В **export-entries** вы уже читаете из `chart.data` (head, rows, footer) и передаёте в `getCellStyles` только **фон** (`getCellBg`). Остальные поля (`color`, `fontWeight`, `fontSize`, `textAlign` и т.д.) из `cell.css` / `cell.cell` не извлекаются и не попадают в JSON стилей.

### 3.2. Расширение формата стилей и скрипта

1. **Расширить структуру стилей (TypeScript):**  
   Вместо только `{ row, col, fill }` передавать, например:
   - `fill` — как сейчас (RRGGBB);
   - `fontColor` — цвет текста (RRGGBB);
   - `fontBold`, `fontItalic` — при наличии в данных;
   - `alignment` — horizontal/vertical при наличии в `cell.css` (left/center/right, top/middle/bottom);
   - `border` — при наличии границ в данных (сейчас в UI границы часто задаются через общий CSS таблицы, а не по ячейкам; если в API чарта приходят границы по ячейкам — добавить их в структуру).

2. **Читать в `getCellStyles` (или аналоге) все нужные поля** из `cell`, `cell.cell`, `cell.css`:
   - `backgroundColor` → `fill`;
   - `color` → `fontColor`;
   - `fontWeight`, `fontSize`, `textAlign`, `verticalAlign` и т.д. — в единый объект стиля на ячейку.

3. **Расширить apply_xlsx_styles.py (openpyxl):**  
   Для каждой ячейки применять не только `PatternFill`, но и при наличии:
   - `Font` (size, bold, italic, color);
   - `Alignment` (horizontal, vertical, wrap_text);
   - `Border` (left, right, top, bottom — style и color).

4. **Единый JSON стилей по листам:**  
   Формат вида массива объектов с полями `row`, `col`, `fill`, `fontColor`, `alignment`, `border` и т.д. Скрипт должен обрабатывать отсутствующие поля (не ломаться, если в baseline-режиме приходит только `fill`).

### 3.3. Обработка границ

- Если в ответе `/api/run` для таблицы **нет** поячеечных границ (только общий CSS в UI), то «границы на 100%» потребуют либо:
  - правил по умолчанию (например, обводка всех ячеек тонкой линией), либо
  - доработки бэкенда чартов, чтобы отдавать границы в данных. Сейчас в коде таблицы границы для экспорта явно вычищаются из `cellStyle` (см. `utils.ts`: «CSS is the sole authority for borders»), то есть в объекте ячейки их может не быть — это нужно учитывать при проектировании «100% границ».

### 3.4. Зависимости

- **openpyxl** уже есть в `export/requirements.txt`; он поддерживает Font, Fill, Border, Alignment — менять зависимости не обязательно, только логику в `apply_xlsx_styles.py` и формат JSON.

---

## 4. Краткие выводы

| Аспект | Подстройка под akrasnov87 | «Всё на 100%» для Excel |
|--------|---------------------------|--------------------------|
| **PDF** | Контракт и отклик уже совпадают; держать API и требование Chromium. | — |
| **Excel API** | Контракт и отклик совпадают; явные Content-Type/Disposition у вас — ок. | — |
| **Excel стили** | В baseline стилей нет; ваши фоны (getCellStyles + apply_xlsx_styles) — расширение. | Расширить структуру стилей и скрипт: font, alignment, border, fontColor; читать из cell/css все нужные поля; при необходимости задать границы по умолчанию или получать их с бэкенда. |

Идеально подстроиться под ожидаемую логику и отклик форка akrasnov87 по PDF и Excel можно, **не меняя** текущий контракт и формат ответов. Чтобы Excel «на сто процентов» выгружал фоны, шрифты, границы и цвета, нужно расширить сбор стилей в `export-entries` и применение в `apply_xlsx_styles.py` (и при необходимости — источник границ в данных чарта).
