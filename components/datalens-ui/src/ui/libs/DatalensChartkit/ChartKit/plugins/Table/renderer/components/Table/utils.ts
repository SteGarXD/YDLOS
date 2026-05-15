import type * as React from 'react';

import type {DateTimeInput} from '@gravity-ui/date-utils';
import {dateTimeUtc} from '@gravity-ui/date-utils';
import type {
    ColumnDef,
    DisplayColumnDef,
    GroupColumnDef,
    SortingFnOption,
} from '@tanstack/react-table';
import {createColumnHelper} from '@tanstack/react-table';
import {ascending, rgb} from 'd3';
import type {Primitive, RGBColor} from 'd3';
import get from 'lodash/get';
import round from 'lodash/round';
import {
    type TableCellVeticalAlignment,
    type TableCellsRow,
    type TableCommonCell,
    type TableRow,
    type TableTitle,
    isMarkupItem,
} from 'shared';

import {markupToRawString} from '../../../../../../modules/table';
import type {TableWidgetData} from '../../../../../../types';
import {camelCaseCss} from '../../../../../components/Widget/components/Table/utils';
import {getTreeCellColumnIndex, getTreeSetColumnSortAscending} from '../../utils';

import type {TData, TFoot, THead} from './types';

function getSortingFunction(args: {
    th: THead;
    columnIndex: number;
    rows?: TableRow[];
}): SortingFnOption<TData> {
    const {th, columnIndex, rows} = args;
    const hasTreeCell = getTreeCellColumnIndex(rows?.[0] as TableCellsRow) !== -1;
    if (hasTreeCell) {
        return getTreeSetColumnSortAscending(columnIndex, rows ?? []);
    }

    const columnType: TableCommonCell['type'] = get(th, 'type');
    if (columnType === 'date') {
        return function (row1, row2) {
            const cell1Value = row1.original[columnIndex].value as DateTimeInput;
            const cell2Value = row2.original[columnIndex].value as DateTimeInput;

            // Intentionally set incorrect input for null cell values, because `new Date(null)`
            // gives the correct date, but we do not want this to preserve the old sorting behavior.
            const date1 = dateTimeUtc({input: cell1Value === null ? 'invalid' : cell1Value});
            const date2 = dateTimeUtc({input: cell2Value === null ? 'invalid' : cell2Value});

            if (date1 > date2 || (date1.isValid() && !date2.isValid())) {
                return 1;
            }

            if (date2 > date1 || (date2.isValid() && !date1.isValid())) {
                return -1;
            }

            return 0;
        };
    }

    return function (row1, row2) {
        const nullReplacement = columnType === 'number' ? -Infinity : '';
        const a = getSortAccessor(row1.original[columnIndex].value, nullReplacement);
        const b = getSortAccessor(row2.original[columnIndex].value, nullReplacement);

        return ascending(a as Primitive, b as Primitive);
    };
}

function getSortAccessor(value: unknown, nullReplacement?: Primitive) {
    if (isMarkupItem(value)) {
        return markupToRawString(value);
    }

    if (value === null && typeof nullReplacement !== 'undefined') {
        return nullReplacement;
    }

    return value as Primitive;
}

export function getColumnId(headCell: THead) {
    return `${headCell.id}__${headCell.index}`;
}

function createColumn(args: {
    headCell: THead;
    rows?: TableRow[];
    footerCell?: TFoot;
    index: number;
    size?: number;
}) {
    const {headCell, footerCell, index, size, rows} = args;
    const {width, cell, ...columnOptions} = headCell;
    const options = {
        ...columnOptions,
        id: getColumnId(headCell),
        meta: {
            width,
            footer: footerCell,
            head: headCell,
        },
        size,
        minSize: 0,
        sortingFn: getSortingFunction({th: headCell, columnIndex: index, rows}),
    } as ColumnDef<TData>;

    if (cell) {
        options.cell = (context) => {
            const originalCellData = context.row.original[index];
            return cell(originalCellData);
        };
    }

    return options;
}

export function createTableColumns(args: {head?: THead[]; rows?: TableRow[]; footer?: TFoot[]}) {
    const {head = [], rows = [], footer = []} = args;
    const columnHelper = createColumnHelper<TData>();

    let lastColumnIndex = 0;
    const createHeadColumns = (cells: THead[], defaultWidth = 0): ColumnDef<TData>[] => {
        return cells.map((headCell) => {
            const cellIndex = headCell.columns?.length ? -1 : lastColumnIndex;
            const footerCell = footer?.[cellIndex];
            const columnWidth =
                typeof headCell.width === 'number' ? Number(headCell.width) : defaultWidth;
            const options = createColumn({
                headCell: {
                    ...headCell,
                    enableSorting: headCell.enableSorting && rows.length > 1,
                    width: columnWidth > 0 ? columnWidth : undefined,
                    index: cellIndex,
                },
                footerCell,
                index: cellIndex,
                rows,
            });

            if (headCell.columns?.length) {
                const childDefaultWidth =
                    columnWidth > 0 ? columnWidth / headCell.columns?.length : 0;
                return columnHelper.group({
                    ...options,
                    columns: createHeadColumns(headCell.columns || [], childDefaultWidth),
                } as GroupColumnDef<TData>);
            } else {
                lastColumnIndex++;
            }

            return columnHelper.accessor((row) => {
                const cellData = row[cellIndex];

                return cellData.formattedValue ?? cellData.value;
            }, options as DisplayColumnDef<TData>);
        });
    };

    return createHeadColumns(head);
}

export function getTableTitle(config: TableWidgetData['config']): TableTitle | undefined {
    if (typeof config?.title === 'string') {
        return {text: config.title};
    }

    return config?.title;
}

export function getTableSizes(table: HTMLTableElement) {
    const tableScale = round(table?.getBoundingClientRect()?.width / table?.clientWidth, 2);
    let rows: HTMLTableRowElement[] = [];

    rows = Array.from(
        table?.getElementsByTagName('thead')?.[0]?.childNodes ?? [],
    ) as HTMLTableRowElement[];

    if (!rows.length) {
        const tBodyRows = Array.from(
            table?.getElementsByTagName('tbody')?.[0]?.childNodes ?? [],
        ) as HTMLTableRowElement[];
        rows = tBodyRows.length ? [tBodyRows[0]] : [];
    }

    const colsCount = Array.from(rows[0]?.childNodes ?? []).reduce((sum, c) => {
        const colSpan = Number((c as Element).getAttribute('colSpan') || 1);
        return sum + colSpan;
    }, 0);
    const result = new Array(rows.length).fill(null).map(() => new Array(colsCount).fill(null));

    result.forEach((_r, rowIndex) => {
        const row = rows[rowIndex];
        let cellIndex = 0;
        Array.from(row.childNodes ?? []).forEach((c) => {
            const cell = c as Element;
            let rowSpan = Number(cell.getAttribute('rowSpan') || 1);
            let colSpan = Number(cell.getAttribute('colSpan') || 1);
            const cellWidth = cell.getBoundingClientRect()?.width / tableScale;

            if (result[rowIndex][cellIndex] !== null) {
                cellIndex = result[rowIndex].findIndex((val, i) => i > cellIndex && val === null);
            }

            while (rowSpan - 1 > 0) {
                rowSpan -= 1;
                result[rowIndex + rowSpan][cellIndex] = cellWidth;
            }

            if (colSpan > 1) {
                while (colSpan > 1) {
                    colSpan -= 1;
                    cellIndex += 1;
                }
            } else {
                result[rowIndex][cellIndex] = cellWidth;
            }

            cellIndex += 1;
        });
    });

    const headWidths = result.reduce<number[]>((acc, row) => {
        row.forEach((cellWidth, index) => {
            if (cellWidth !== null) {
                acc[index] = acc[index] || cellWidth;
            }
        });
        return acc;
    }, []);

    // Measure tbody and tfoot rows too: header-only measurement misses columns
    // whose header text is empty (e.g. hidden MeasureNames) and footer totals
    // whose values ("1 284", "1 621") are wider than body values ("104", "49").
    // Use data-col-start when present so rowSpan (fewer td in DOM) doesn't corrupt indices.
    const measureSection = (section: HTMLTableSectionElement | null) => {
        if (!section) return;
        const sectionRows = Array.from(section.childNodes ?? []) as HTMLTableRowElement[];
        for (const sectionRow of sectionRows) {
            let ci = 0;
            Array.from(sectionRow.childNodes ?? []).forEach((c) => {
                const cell = c as Element;
                const colSpan = Number(cell.getAttribute('colSpan') || 1);
                const dataColStart = cell.getAttribute('data-col-start');
                const parsedColStart =
                    dataColStart !== null && dataColStart !== ''
                        ? parseInt(dataColStart, 10)
                        : null;
                const start: number =
                    parsedColStart !== null &&
                    Number.isInteger(parsedColStart) &&
                    parsedColStart >= 0
                        ? parsedColStart
                        : ci;
                const w = cell.getBoundingClientRect()?.width / tableScale;
                if (start < headWidths.length) {
                    if (colSpan === 1) {
                        headWidths[start] = Math.max(headWidths[start] || 0, w);
                    } else {
                        const perCol = w / colSpan;
                        for (let k = 0; k < colSpan && start + k < headWidths.length; k++) {
                            headWidths[start + k] = Math.max(headWidths[start + k] || 0, perCol);
                        }
                    }
                }
                ci += colSpan;
            });
        }
    };
    measureSection(table?.getElementsByTagName('tbody')?.[0] ?? null);

    // Measure all tfoot rows: widest values may be in row 2 (ПКЗ), not row 1.
    // Use data-col-start on each td so we assign widths to the correct columns
    // even when rowSpan causes some cells to be omitted from DOM.
    const tfoot = table?.getElementsByTagName('tfoot')?.[0] ?? null;
    if (tfoot) {
        const footerRows = Array.from(tfoot.childNodes ?? []) as HTMLTableRowElement[];
        for (const row of footerRows) {
            Array.from(row.childNodes ?? []).forEach((c) => {
                const cell = c as Element;
                const colStart = parseInt(cell.getAttribute('data-col-start') ?? '', 10);
                if (Number.isNaN(colStart) || colStart < 0) return;
                const colSpan = Number(cell.getAttribute('colSpan') || 1);
                const w = cell.getBoundingClientRect()?.width / tableScale;
                if (colSpan === 1 && colStart < headWidths.length) {
                    headWidths[colStart] = Math.max(headWidths[colStart] || 0, w);
                } else if (colSpan > 1) {
                    const perCol = w / colSpan;
                    for (let k = 0; k < colSpan && colStart + k < headWidths.length; k++) {
                        headWidths[colStart + k] = Math.max(headWidths[colStart + k] || 0, perCol);
                    }
                }
            });
        }
    }

    return headWidths;
}

export function toSolidColor(current: string | RGBColor, background?: RGBColor) {
    const bg = background ?? rgb(getPageBgColor());
    const color = typeof current === 'string' ? rgb(varToColor(current)) : current;

    return color
        .copy({
            r: (1 - color.opacity) * bg.r + color.opacity * color.r,
            g: (1 - color.opacity) * bg.g + color.opacity * color.g,
            b: (1 - color.opacity) * bg.b + color.opacity * color.b,
            opacity: 1,
        })
        .formatRgb();
}

function varToColor(value: string) {
    if (value.startsWith('var(')) {
        const bodyStyles = window.getComputedStyle(document.body);
        return bodyStyles.getPropertyValue(value.slice(4, -1));
    }

    return value;
}

function getPageBgColor() {
    return window.getComputedStyle(document.body).getPropertyValue('background-color');
}

export function getElementBackgroundColor(el?: HTMLElement | null): string {
    if (!el) {
        return getPageBgColor();
    }

    const color = window.getComputedStyle(el).getPropertyValue('background-color');
    const rgbColor = rgb(color);

    if (el.tagName !== 'BODY') {
        if (!rgbColor.opacity) {
            return getElementBackgroundColor(el.parentElement);
        }

        if (rgbColor.opacity < 1) {
            return toSolidColor(rgbColor, rgb(getPageBgColor()));
        }
    }

    return rgbColor.toString();
}

/** YDL OS: ЗПК % — утверждённые пороги (тело и итоги). Низкий / средний / высокий. */
const TRAFFIC_LIGHT_PERCENT_THRESHOLDS = [
    {max: 59, backgroundColor: '#f08080'},
    {max: 79, backgroundColor: '#f0e68c'},
    {max: 1000, backgroundColor: '#98fb98'},
];

/** YDL OS: цвет метрик в теле и в строке ИТОГО (заброн, ПКЗ, Млн. р и т.д.). */
export const PIVOT_TURQUOISE_COLOR = '#afeeee';

/** YDL OS: фон шапки и футера сводной — задаём в коде, чтобы тема дашборда не перебивала (inline-стили не переопределяются CSS). */
export const PIVOT_HEADER_FOOTER_GRAY = '#d3d3d3';

function getTrafficLightBackground(value: unknown): string | undefined {
    const num = typeof value === 'number' && !Number.isNaN(value) ? value : Number(value);
    if (Number.isNaN(num)) return undefined;
    const t = TRAFFIC_LIGHT_PERCENT_THRESHOLDS.find((x) => num <= x.max);
    return t?.backgroundColor;
}

/** YDL OS: серый фон — заменяем на #cbe0ff в колонке ИТОГО тела. d3d3d3, f5f5f5, e8e8e8 и др. */
function isBodyTotalColumnGray(color: string | undefined): boolean {
    if (!color || typeof color !== 'string') return false;
    const lower = color.toLowerCase();
    const grayHex = ['#d3d3d3', '#f5f5f5', '#e8e8e8', '#eeeeee', '#e0e0e0', '#ebebeb'];
    if (grayHex.includes(lower)) return true;
    try {
        const c = rgb(color);
        const g = c.r; // серые: r≈g≈b, 200–250
        return c.g === g && c.b === g && g >= 200 && g <= 250;
    } catch {
        return false;
    }
}

/** П.3: белый/пустой фон в колонке ИТОГО тела — тоже заменяем на #cbe0ff (Млн.р 0,00 и др.). */
function isBodyTotalColumnWhiteOrEmpty(color: string | undefined): boolean {
    if (!color || typeof color !== 'string') return true;
    const lower = color.toLowerCase().trim();
    if (lower === '' || lower === 'transparent') return true;
    const whiteHex = ['#ffffff', '#fff', 'white'];
    if (whiteHex.includes(lower)) return true;
    try {
        const c = rgb(color);
        return c.r >= 250 && c.g >= 250 && c.b >= 250;
    } catch {
        return false;
    }
}

/**
 * Стили ячейки (окраска ЗПК %, бирюзовый и т.д.) берутся из cell.custom / columnHead.custom,
 * которые задаются на бэкенде (backend-pivot-table/helpers/backgroundColor.ts).
 * Чарт и дашборд используют один и тот же код и один и тот же TableWidget; разницы в рендере нет.
 * Если на дашборде окраски нет — сравните ответ API (например /api/run) при открытии чарта и виджета на дашборде:
 * в обоих ответах в data.head/data.rows/data.footer должны быть cell.custom.trafficLightPercent / turquoiseMeasure.
 */
export function getCellCustomStyle(
    cellData: unknown,
    tableBgColor?: string,
    columnHead?: unknown,
    isTotalColumn?: boolean,
) {
    const css = {...camelCaseCss(get(cellData, 'css', {}))} as React.CSSProperties;
    const isTotalCell = get(cellData, 'isTotalCell') === true;
    const trafficLightPercent =
        get(cellData, 'custom.trafficLightPercent') ||
        get(columnHead, 'custom.trafficLightPercent');
    const turquoiseMeasure =
        !isTotalCell &&
        (get(cellData, 'custom.turquoiseMeasure') || get(columnHead, 'custom.turquoiseMeasure'));

    if (trafficLightPercent === true) {
        const value = get(cellData, 'value');
        const bg = getTrafficLightBackground(value);
        if (bg) {
            css.backgroundColor = bg;
            css.color = '#000000';
        }
    }
    if (turquoiseMeasure === true && !isTotalColumn) {
        const cellValue = get(cellData, 'value');
        const isEmptyValue =
            cellValue === null ||
            cellValue === undefined ||
            cellValue === '' ||
            (typeof cellValue === 'string' && cellValue.trim() === '');
        if (isEmptyValue) {
            const bg = css.backgroundColor as string | undefined;
            if (bg && (bg === PIVOT_TURQUOISE_COLOR || bg.toLowerCase() === '#afeeee')) {
                delete css.backgroundColor;
                delete css.color;
            }
        } else if (!css.backgroundColor) {
            css.backgroundColor = PIVOT_TURQUOISE_COLOR;
            css.color = '#000000';
        }
    }
    // П.3: колонка ИТОГО в теле — заброн/ПКЗ/Млн.р #cbe0ff (не серый/белый); серый только в нижнем футере.
    // Column-total ячейки (isTotalCell=true) тоже должны получить #cbe0ff — это body, не footer.
    // Footer-ячейки не затронуты: для них isTotalColumn не передаётся (undefined !== true).
    if (
        isTotalColumn === true &&
        trafficLightPercent !== true &&
        (isBodyTotalColumnGray(css.backgroundColor as string) ||
            isBodyTotalColumnWhiteOrEmpty(css.backgroundColor as string) ||
            !css.backgroundColor)
    ) {
        css.backgroundColor = '#cbe0ff';
        css.color = '#000000';
    }

    // Since the table is created with flex/grid instead of standard table layout,
    // some of styles will not work as expected - we replace them here
    if (css.verticalAlign && !css.alignItems) {
        switch (css.verticalAlign) {
            case 'top': {
                css.alignItems = 'flex-start';
                css.display = 'flex';
                break;
            }
            case 'middle': {
                css.alignItems = 'center';
                css.display = 'flex';
                break;
            }
            case 'bottom': {
                css.alignItems = 'flex-end';
                css.display = 'flex';
                break;
            }
        }
    }

    if (css.textAlign && !css.justifyContent) {
        switch (css.textAlign) {
            case 'left': {
                css.justifyContent = 'flex-start';
                break;
            }
            case 'center': {
                css.justifyContent = 'center';
                break;
            }
            case 'right': {
                css.justifyContent = 'flex-end';
                break;
            }
        }
        // YDL OS: не задаём display: flex здесь — табличные ячейки остаются table-cell, выравнивание через text-align из бэкенда, без «езды» шапки
    }

    // YDL OS: CSS is the sole authority for borders; strip ALL border props from inline styles
    delete css.border;
    delete css.borderColor;
    delete css.borderTopColor;
    delete css.borderBottomColor;
    delete css.borderRightColor;
    delete css.borderLeftColor;
    delete css.borderWidth;
    delete css.borderStyle;
    delete css.borderTop;
    delete css.borderBottom;
    delete css.borderLeft;
    delete css.borderRight;

    if (css.backgroundColor && tableBgColor) {
        css.backgroundColor = varToColor(String(css.backgroundColor));
        const rgbColor = rgb(css.backgroundColor as string);
        if (rgbColor.opacity < 1) {
            // Due to special cases like sticky row/column,
            // we cannot use cell background with alpha chanel - the content begins to "shine through"
            css.backgroundColor = toSolidColor(rgbColor, rgb(tableBgColor));
        }
    }

    // Рейс, Напр-е: всегда без переноса (перебиваем cell.css с бэкенда для всех ячеек колонки)
    if (columnHead && get(columnHead, 'pinned')) {
        css.whiteSpace = 'nowrap';
        css.wordBreak = 'normal';
    }

    return css;
}

const VERTICAL_ALIGNMENT_FLEX_MAP = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};

export function getCellVeticalAlignmentStyle<
    CT extends {verticalAlignment?: TableCellVeticalAlignment},
>(cell: CT): React.CSSProperties | null {
    const verticalAlignment = get(cell, 'verticalAlignment', null);

    if (
        typeof verticalAlignment !== 'string' ||
        !Object.keys(VERTICAL_ALIGNMENT_FLEX_MAP).includes(verticalAlignment)
    ) {
        return null;
    }

    return {
        display: 'inline-flex',
        alignItems: VERTICAL_ALIGNMENT_FLEX_MAP[verticalAlignment],
    };
}
