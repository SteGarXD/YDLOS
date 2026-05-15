import React from 'react';

import type {ColumnDef, Row, SortingState, TableOptions} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getGroupedRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import {
    TRANSPARENT_COLOR_HEX,
    type TableCell,
    type TableCellsRow,
    type TableCommonCell,
    type TableHead,
    isMarkupItem,
} from 'shared';
import {i18n} from 'ui/libs/DatalensChartkit/ChartKit/modules/i18n/i18n';
import {getRandomCKId} from 'ui/libs/DatalensChartkit/helpers/helpers';

import type {TableData} from '../../../../../../types';
import type {TableDataMapped} from '../../utils/migrate-to-old-format';
import {hasGroups} from '../../../../../components/Widget/components/Table/utils';
import type {WidgetDimensions} from '../../types';
import {mapHeadCell} from '../../utils/renderer';
import {markupToRawString} from '../../../../../../modules/table';
import {enforceMinsWithinBudget, fitColumnWidthsToBudget, getCellsWidth} from './cell-width';
import type {
    BodyCellViewData,
    BodyRowViewData,
    FooterCellViewData,
    FooterRowViewData,
    HeadRowViewData,
    TData,
    TFoot,
    THead,
    TableViewData,
} from './types';
import {
    createTableColumns,
    getCellCustomStyle,
    getColumnId,
    getElementBackgroundColor,
    toSolidColor,
} from './utils';

/** Горизонтальный inset отключён: иначе таблица всегда уже контейнера и виден «белый хвост» справа. */
const TABLE_LAYOUT_HORIZONTAL_INSET_PX = 0;

/**
 * Ширина для раскладки колонок.
 *
 * `dimensions.width` приходит из `TableWidget` и обновляется с **debounce 100ms** (ResizeObserver на корне
 * виджета). Внутри таблицы отдельный RO на обёртке даёт актуальную ширину сразу. Раньше брали
 * `Math.min(measured, dim)` — пока `dim` отставал, бюджет колонок был **уже** реальной карточки виджета:
 * сумма треков < ширина контейнера → справа оставалась **белая полоса**, «Итого» жали в узкий хвост.
 *
 * Если уже есть замер обёртки таблицы (`measured` > 0) — доверяем ему; `dimensions` только как fallback
 * до первого замера или при нулевой ширине (SSR и т.п.).
 */
function mergeTableLayoutWidthPx(
    dimensionsWidth: number,
    layoutContainerWidth: number,
    elementClientWidth: number,
): number {
    const dim = Math.max(0, dimensionsWidth);
    const a = Math.max(0, layoutContainerWidth);
    const b = Math.max(0, elementClientWidth);
    const measured =
        a > 0 && b > 0 ? Math.min(a, b) : Math.max(a, b);

    if (measured > 0) {
        return measured;
    }
    return dim;
}

function minPositiveWidth(a: number, b: number): number {
    const aw = Math.max(0, a);
    const bw = Math.max(0, b);
    if (aw > 0 && bw > 0) {
        return Math.min(aw, bw);
    }
    return Math.max(aw, bw);
}

/**
 * Треки grid задаются целыми px. Сумма round(size) по 30+ колонкам часто ≠ budget — при width:100%
 * справа остаётся зазор без ячеек: border-right/border-bottom футера «обрываются» у края таблицы.
 * Возвращаем тот же массив, что идёт в `grid-template-columns` — им же нужно заполнять `<col>`, иначе
 * интринсик-ширина таблицы по colgroup не совпадает с сеткой и виджет «вылезает» за контейнер.
 */
function alignColTracksToBudget(colSizes: number[], budget: number): number[] {
    if (!colSizes.length) {
        return [];
    }
    const n = colSizes.length;
    const tracks = colSizes.map((size) => Math.max(1, Math.round(size)));
    const budgetRounded = Math.round(Math.max(0, budget));
    const target = Math.max(n, budgetRounded);
    let diff = target - tracks.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (diff !== 0 && guard < 10000) {
        guard += 1;
        if (diff > 0) {
            tracks[n - 1] += 1;
            diff -= 1;
        } else {
            let i = n - 1;
            while (i >= 0 && tracks[i] <= 1) {
                i -= 1;
            }
            if (i < 0) {
                break;
            }
            tracks[i] -= 1;
            diff += 1;
        }
    }
    return tracks;
}

/** Многоуровневая шапка (сводная), не путать с group на колонке для группировки строк плоской таблицы */
function hasNestedHeaderColumns(head: TableHead[] = []) {
    return head.some(
        (col) => col && 'sub' in col && Array.isArray(col.sub) && col.sub.length > 0,
    );
}

function getNoDataRow(colSpan = 1): BodyRowViewData {
    return {
        id: '',
        index: 0,
        cells: [
            {
                id: '',
                index: 0,
                data: null,
                colSpan,
                content: i18n('chartkit-table', 'message-no-data'),
                style: {
                    background: 'var(--dl-table-no-data-bg-color)',
                },
            },
        ],
    };
}

function getFooterRows(args: {
    data: TableData;
    leftPositions: (number | undefined)[];
    columns: ColumnDef<TData>[];
    measureNamesColIndex: number;
}) {
    const {data, leftPositions, columns, measureNamesColIndex} = args;
    const footerRows = (data.footer ?? []) as TableCellsRow[];

    return footerRows.reduce<FooterRowViewData[]>((acc, rowData, rowIndex) => {
        const cells = rowData.cells.map<FooterCellViewData>((footerCellData, cellIndex) => {
            // Backward compat: colSpan/isColSpanCovered optional (pivot only); other tables unchanged
            const cellData = footerCellData as TableCommonCell & {
                colSpan?: number;
                isColSpanCovered?: boolean;
                rowSpan?: number;
                isRowSpanCovered?: boolean;
            };
            const col = findColumn(columns, (column) => get(column, 'index') === cellIndex);
            const originalHeadData = col?.meta?.head;
            const pinned = Boolean(originalHeadData?.pinned);
            let content = null;
            if (
                !get(cellData, 'isPlaceholder') &&
                !get(cellData, 'isColSpanCovered') &&
                !get(cellData, 'isRowSpanCovered')
            ) {
                const formattedValue = get(cellData, 'formattedValue', String(cellData.value));
                content = originalHeadData?.cell
                    ? originalHeadData?.cell(cellData)
                    : formattedValue;
            }

            // Стили футера: передаём columnHead, чтобы trafficLightPercent/turquoiseMeasure
            // нашлись (ЗПК % должен окрашиваться светофором и в ИТОГО).
            const cellStyle: React.CSSProperties = getCellCustomStyle(
                cellData,
                undefined,
                originalHeadData,
            );
            const isFirstCellItogo =
                rowIndex === 0 &&
                cellIndex === 0 &&
                /^итого$/i.test(
                    String(get(cellData, 'value', get(cellData, 'formattedValue', ''))).trim(),
                );

            // CSS is the sole authority for footer borders; strip any leftover inline border props
            delete cellStyle.border;
            delete cellStyle.borderTop;
            delete cellStyle.borderBottom;
            delete cellStyle.borderLeft;
            delete cellStyle.borderRight;
            delete cellStyle.borderWidth;
            delete cellStyle.borderStyle;
            delete cellStyle.borderColor;
            if (isFirstCellItogo) {
                cellStyle.display = 'flex';
                cellStyle.justifyContent = 'center';
                cellStyle.alignItems = 'center';
                cellStyle.alignSelf = 'stretch';
            }
            if (pinned) {
                cellStyle.left = leftPositions[originalHeadData?.index ?? -1];
            }
            const contentStyle = getCellCustomStyle(cellData, undefined, originalHeadData);
            if (isFirstCellItogo) {
                contentStyle.justifyContent = 'center';
                contentStyle.alignItems = 'center';
                contentStyle.textAlign = 'center';
            }
            const isMeasureNamesFooterCol =
                cellIndex === measureNamesColIndex && measureNamesColIndex >= 0;
            if (isMeasureNamesFooterCol) {
                cellStyle.paddingLeft = 2;
                contentStyle.paddingLeft = 1;
                contentStyle.justifyContent = 'flex-start';
                contentStyle.textAlign = 'left';
            }

            // Нижний ИТОГО: бэкенд присылает colSpan=2 (первые два столбца); fallback на 2, если нет.
            const isFirstRowFirstCell = rowIndex === 0 && cellIndex === 0;
            const isFirstRowSecondCell = rowIndex === 0 && cellIndex === 1;
            const firstCellValue = isFirstRowSecondCell
                ? String(get(rowData.cells[0] as TableCommonCell, 'value', '')).trim()
                : '';
            const isItogoLabel =
                isFirstRowFirstCell &&
                /^итого$/i.test(
                    String(get(cellData, 'value', get(cellData, 'formattedValue', ''))).trim(),
                );
            const resolvedColSpan =
                cellData.colSpan && cellData.colSpan > 1
                    ? cellData.colSpan
                    : isItogoLabel
                      ? 2
                      : undefined;
            const isColSpanCovered =
                cellData.isColSpanCovered ||
                (isFirstRowSecondCell && /^итого$/i.test(firstCellValue));

            return {
                id: get(cellData, 'id', String(cellIndex)),
                style: cellStyle,
                contentStyle,
                pinned,
                measureNamesColumn: cellIndex === measureNamesColIndex && measureNamesColIndex >= 0,
                type: get(originalHeadData, 'type'),
                content,
                colSpan: resolvedColSpan && resolvedColSpan > 1 ? resolvedColSpan : undefined,
                isColSpanCovered,
                rowSpan: cellData.rowSpan,
                isRowSpanCovered: cellData.isRowSpanCovered,
            };
        });

        if (cells.some((c) => c.content || c.rowSpan)) {
            acc.push({
                id: String(rowIndex),
                cells,
            });
        }

        return acc;
    }, []);
}

/** Сводная: group по head — сравниваем «как текст», иначе markup/объекты ломают isEqual и ИТОГО не сливается в rowSpan. */
function cellValueForRowGroupCompare(cell: unknown): string {
    if (cell == null || typeof cell !== 'object') {
        return String(cell ?? '');
    }
    const c = cell as TableCommonCell;
    const v = c.value;
    if (v != null && v !== '') {
        if (typeof v === 'object' && isMarkupItem(v)) {
            return markupToRawString(v).trim();
        }
        if (typeof v === 'string') {
            return v.trim();
        }
        return String(v);
    }
    const fv = c.formattedValue;
    return fv != null && fv !== '' ? String(fv).trim() : '';
}

function shouldGroupRow(args: {
    currentRow: TData;
    prevRow: TData;
    cellIndex: number;
    startIndex?: number;
}) {
    const {currentRow, prevRow, cellIndex, startIndex = 0} = args;
    const current = currentRow
        .slice(startIndex, cellIndex + 1)
        .map((cell) => cellValueForRowGroupCompare(cell));
    const prev = prevRow.slice(startIndex, cellIndex + 1).map((cell) => cellValueForRowGroupCompare(cell));

    return isEqual(prev, current);
}

function findColumn(
    cols: ColumnDef<TData>[],
    predicate: (col: ColumnDef<TData>) => boolean,
): ColumnDef<TData> | undefined {
    for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        if (predicate(col)) {
            return col;
        }

        const subColumns = get(col, 'columns', []);
        if (subColumns.length) {
            const subCol = findColumn(subColumns, predicate);
            if (subCol) {
                return subCol;
            }
        }
    }

    return undefined;
}

function findCell(
    cols: ColumnDef<TData>[],
    predicate: (col: ColumnDef<TData>) => boolean,
): THead | undefined {
    const col = findColumn(cols, predicate);
    return col?.meta?.head;
}

export const usePreparedTableData = (props: {
    tableContainerRef: React.MutableRefObject<HTMLDivElement | null>;
    /** Обёртка с overflow-y и вертикальным скроллом — её clientWidth уже минус полоса прокрутки. */
    tableLayoutMeasureRef?: React.RefObject<HTMLDivElement | null>;
    dimensions: WidgetDimensions;
    data: TableDataMapped;
    manualSorting: boolean;
    onSortingChange?: (column: TableHead | undefined, sortOrder: 'asc' | 'desc') => void;
    getCellAdditionStyles?: (cell: TableCell, row: TData) => React.CSSProperties;
    cellMinSizes: number[] | null;
    sortingState?: SortingState;
    backgroundColor?: string;
    preserveWhiteSpace?: boolean;
    disableCellFormatting?: boolean;
    /** Плоское дерево рейсов: до первого +/- rowSpan нет — виртуализация ломает сетку/клики по +. */
    disableBodyVirtualization?: boolean;
    /** Спец-оформление только для отчёта 5 «Загрузка рейса по классам». */
    isFlightLoadByClassReport?: boolean;
}): TableViewData => {
    const {
        dimensions,
        tableContainerRef,
        tableLayoutMeasureRef,
        manualSorting,
        onSortingChange,
        data,
        getCellAdditionStyles,
        cellMinSizes,
        sortingState,
        backgroundColor,
        preserveWhiteSpace,
        disableCellFormatting,
        disableBodyVirtualization = false,
        isFlightLoadByClassReport = false,
    } = props;

    const flightLoadByClassColumnRole = React.useMemo(() => {
        const roleByIndex = new Map<number, 'date' | 'class' | 'total' | 'diff'>();
        if (!isFlightLoadByClassReport) {
            return roleByIndex;
        }
        const leafHeaders = (data.head ?? []) as TableHead[];
        leafHeaders.forEach((h, idx) => {
            const title = String(h.name ?? '').trim().toLowerCase();
            if (title === 'дата') {
                roleByIndex.set(idx, 'date');
                return;
            }
            if (title === 'всего') {
                roleByIndex.set(idx, 'total');
                return;
            }
            if (title === 'прирост') {
                roleByIndex.set(idx, 'diff');
                return;
            }
            roleByIndex.set(idx, 'class');
        });
        return roleByIndex;
    }, [data.head, isFlightLoadByClassReport]);
    const [shouldResize, resize] = React.useState<string | null>(null);
    /** Реальная ширина контейнера (дашборд меняет размер без window.resize; dimensions из TableWidget может быть 0) */
    const [layoutContainerWidth, setLayoutContainerWidth] = React.useState(0);

    React.useLayoutEffect(() => {
        const measureEl = tableLayoutMeasureRef?.current ?? null;
        const viewportEl = tableContainerRef.current;
        const observed = [measureEl, viewportEl].filter(Boolean) as HTMLDivElement[];
        if (!observed.length || typeof ResizeObserver === 'undefined') {
            return undefined;
        }
        const update = () => {
            /*
             * Ширина таблицы должна считаться по viewport со скроллом, а не только по внутренней обёртке:
             * иначе при появлении вертикальной полосы правая часть сетки («Итого») обрезается.
             */
            const measureWidth = measureEl?.clientWidth ?? 0;
            let viewportWidth = viewportEl?.clientWidth ?? 0;
            if (viewportWidth < 2 && viewportEl?.parentElement) {
                viewportWidth = viewportEl.parentElement.clientWidth;
            }
            let w = minPositiveWidth(measureWidth, viewportWidth);
            if (w < 2 && measureEl?.parentElement) {
                w = measureEl.parentElement.clientWidth;
            }
            setLayoutContainerWidth((prev) => (Math.abs(w - prev) > 0.5 ? w : prev));
        };
        update();
        const ro = new ResizeObserver(update);
        observed.forEach((el) => ro.observe(el));
        return () => ro.disconnect();
    }, [tableContainerRef, tableLayoutMeasureRef]);

    const onRenderCell = React.useCallback(
        debounce(() => {
            resize(getRandomCKId());
        }),
        [],
    );

    const measureEl = tableLayoutMeasureRef?.current ?? null;
    const viewportEl = tableContainerRef.current;
    const layoutViewportWidth = minPositiveWidth(
        measureEl?.clientWidth ?? 0,
        viewportEl?.clientWidth ?? 0,
    );
    const tableWidthForLayout = mergeTableLayoutWidthPx(
        dimensions?.width ?? 0,
        layoutContainerWidth,
        layoutViewportWidth,
    );

    const columns = React.useMemo(() => {
        const headData = data.head?.map((th) =>
            mapHeadCell({
                th,
                tableWidth: tableWidthForLayout || dimensions.width,
                onRenderCell,
                disableCellFormatting,
            }),
        );
        const footerData = ((data.footer?.[0] as TableCellsRow)?.cells ?? []) as TFoot[];
        return createTableColumns({head: headData, rows: data.rows, footer: footerData});
    }, [data, dimensions.width, tableWidthForLayout, disableCellFormatting, onRenderCell]);

    const initialSortingState = React.useMemo(() => {
        return (sortingState ?? []).reduce<SortingState>((acc, s) => {
            const thead = findCell(columns, (col) => col.meta?.head?.id === s.id);
            if (thead) {
                acc.push({
                    id: getColumnId(thead),
                    desc: s.desc,
                });
            }
            return acc;
        }, []);
    }, [columns, sortingState]);
    const [sorting, setSorting] = React.useState<SortingState>(initialSortingState);

    const tableRowsData = React.useMemo(() => {
        return data.rows.map<TData>((r) => get(r, 'cells', []));
    }, [data.rows]);

    const hasBodyRowSpan = React.useMemo(() => {
        if (!data.rows?.length) {
            return false;
        }
        for (const r of data.rows) {
            const cells = get(r, 'cells', []) as TableCommonCell[];
            for (const c of cells) {
                if (
                    get(c, 'isRowSpanCovered') ||
                    (typeof c.rowSpan === 'number' && c.rowSpan > 1)
                ) {
                    return true;
                }
            }
        }
        return false;
    }, [data.rows]);
    const table = useReactTable({
        data: tableRowsData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        sortDescFirst: true,
        manualSorting,
        manualPagination: true,
        state: {
            sorting,
        },
        isMultiSortEvent: (event: React.MouseEvent<HTMLElement, MouseEvent>) =>
            event.ctrlKey || event.metaKey,
        onSortingChange: (updater) => {
            setSorting(updater);

            if (!manualSorting) {
                return;
            }

            const updates = typeof updater === 'function' ? updater(sorting) : updater;
            const {id, desc} = updates[0] || {};
            const headCellData = findCell(columns, (col) => col.id === id) as TableHead;
            const sortOrder = desc ? 'desc' : 'asc';

            if (onSortingChange) {
                onSortingChange(headCellData, sortOrder);
            }
        },
    } as TableOptions<TData>);

    const headers = table.getHeaderGroups();
    const tableRows = table.getRowModel().rows;

    const rowMeasures = React.useMemo<Record<string, number>>(() => {
        return {};
    }, [data, dimensions, cellMinSizes, shouldResize]);

    const rowVirtualizer = useVirtualizer({
        count: tableRows.length,
        estimateSize: () => {
            return 60;
        },
        getScrollElement: () => tableContainerRef.current,
        measureElement: (el) => {
            const rowIndex = Number(el.getAttribute('data-index')) ?? -1;
            const row = tableRows[rowIndex] as Row<TData>;
            const rowId = row?.id ?? -1;

            const getRowHeight = () => {
                const cells = Array.from(el?.getElementsByTagName('td') || []);
                const simpleCell = cells.find((c) => {
                    const rowSpan = Number(c.getAttribute('rowspan')) || 0;
                    return rowSpan <= 1;
                });

                return simpleCell?.offsetHeight ?? 0;
            };

            if (rowId && typeof rowMeasures[rowId] === 'undefined') {
                rowMeasures[rowId] = getRowHeight();
            }

            return rowMeasures[rowId];
        },
        overscan: 100,
    });

    const disableVirtualizationForExport = React.useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        const qs = new URLSearchParams(window.location.search || '');
        const fromQuery = qs.get('_no_virtual') === '1';
        const fromUserAgent = (window.navigator.userAgent || '').includes('StatScreenshooter');
        return fromQuery || fromUserAgent;
    }, []);
    const virtualItems = disableVirtualizationForExport
        ? tableRows.map((_, index) => ({index, start: 0}))
        : rowVirtualizer.getVirtualItems();

    const leafHeaders = headers[headers.length - 1]?.headers ?? [];
    // Сводная: сжимаем только колонки дней (1–31). Рейс, Напр-е, Measure names и ИТОГО — свои размеры.
    const lastIdx = leafHeaders.length - 1;
    /*
     * Колонка measure names — это листовая колонка с пустым заголовком в начале сводной.
     * В некоторых формах pinnedCount=2 (Рейс, Напр-е), но отдельная колонка имён метрик всё равно есть.
     * Поэтому не привязываемся к pinnedCount>=3; ограничиваемся «ранним» пустым заголовком.
     */
    const measureNamesColIndex = leafHeaders.findIndex((h, i) => {
        const name = String(get(h.column.columnDef.meta?.head, 'name', '')).trim();
        return name === '' && i >= 2 && i <= 3;
    });
    const effectiveMeasureNamesIdx = measureNamesColIndex >= 0 ? measureNamesColIndex : -1;
    /*
     * Раскладка ширин для сводной (Рейс/Напр-е фикс, «дни», ИТОГО) не подходит для обычной плоской таблицы:
     * там колонки 0/1 — не обязательно короткие рейс/направление, средние — не «дни месяца».
     * hasGroups() включает column.group (группировка строк) — для плоской таблицы это не сводная.
     */
    const isPivotStyleColumnLayout =
        effectiveMeasureNamesIdx >= 0 || hasNestedHeaderColumns(data.head);
    /** Матрица «предпродажа / классы» (сервер кладёт id pre_sale_*); иначе nested header ошибочно включает сводный layout и убивает rowSpan. */
    const isPreSalePeriodMatrixHead =
        Array.isArray(data.head) &&
        data.head.some((h) => String(get(h, 'id', '')).startsWith('pre_sale_'));
    const effectivePivotColumnLayout = isPivotStyleColumnLayout && !isPreSalePeriodMatrixHead;
    // Pivot с группировкой/rowspan часто даёт заметный промежуточный кадр до домера высот.
    // Для UX показываем сразу финальную раскладку без "сырого" состояния.
    const disableVirtualizationForPivot = effectiveMeasureNamesIdx >= 0 && effectivePivotColumnLayout;
    const disableVirtualization =
        disableVirtualizationForExport ||
        disableVirtualizationForPivot ||
        hasBodyRowSpan ||
        disableBodyVirtualization;
    const activeVirtualItems = disableVirtualization
        ? tableRows.map((_, index) => ({index, start: 0}))
        : virtualItems;
    const dataIndices: number[] = [];
    leafHeaders.forEach((h, i) => {
        const pinned = Boolean(h.column.columnDef.meta?.head?.pinned);
        const isMeasureNames = i === effectiveMeasureNamesIdx && effectiveMeasureNamesIdx >= 0;
        // Дни = только колонки после Рейс/Напр-е (индексы >= 2), кроме Measure names и ИТОГО.
        // Иначе первые 2 колонки ошибочно выравниваются/сжимаются как дни.
        if (!pinned && i >= 2 && i < lastIdx && !isMeasureNames) {
            dataIndices.push(i);
        }
    });
    const containerWidth = mergeTableLayoutWidthPx(
        dimensions?.width ?? 0,
        layoutContainerWidth,
        layoutViewportWidth,
    );
    const tableColumnBudgetPx = Math.max(0, containerWidth - TABLE_LAYOUT_HORIZONTAL_INSET_PX);
    /** Абсолютный минимум для пустой колонки имён метрик; иначе ширины — из cellMinSizes / meta */
    const MIN_MEASURE_NAMES_WIDTH = 39;
    /*
     * Рейс / Напр-е: фиксированная ширина (fixed в cell-width), не участвуют в k-масштабировании.
     * Иначе min×k даёт «лишнее» растягивание при широком контейнере, а большой MIN (раньше 108 у Напр-е)
     * вообще не давал колонке стать уже этого порога.
     */
    const MIN_COL_REYS = 66;
    // NOTE: Grid track sizes are rounded to integer px later, so subpixel (0.1px)
    // tweaks are effectively lost. Keep +1px here to prevent wrapping in "Напр-е".
    const MIN_COL_NAPR = 84;
    /** Совпадает с min: одна целевая ширина, без отдельного «потолка» flex. */
    const CAP_COL_REYS = MIN_COL_REYS;
    const CAP_COL_NAPR = MIN_COL_NAPR;
    const CAP_COL_MEASURE_NAMES = 51;
    /** ИТОГО справа: max + cap на min — чуть сильнее сжимаем, остаток в колонки дней */
    const CAP_COL_ITOGO = 47;

    /**
     * Верхняя граница min на колонку дня: без общего Math.max по всем дням — один завышенный замер
     * (шапка/футер) раздувал min для всех колонок и ломал раскладку.
     * Индекс в cellMinSizes = порядок листовых колонок i (совпадает с getTableSizes).
     */
    // Дни (1..31): слишком высокий min забирает бюджет у Рейс/Напр-е.
    // Снижаем, чтобы первые 2 колонки оставались шире в авто-раскладке.
    const CAP_DAY_COLUMN_MIN = 28;

    const cols = leafHeaders.map<{min: number; fixed?: number; max?: number}>((h, i) => {
        const rawMin = cellMinSizes?.[i] ?? cellMinSizes?.[h.index] ?? 0;
        const fixedWidth = h.column.columnDef.meta?.width;
        const isBodyDataCol = dataIndices.indexOf(i) !== -1;
        const isMeasureNamesCol = i === effectiveMeasureNamesIdx && effectiveMeasureNamesIdx >= 0;

        if (!effectivePivotColumnLayout) {
            const headMeta = h.column.columnDef.meta?.head as
                | {type?: string; custom?: Record<string, unknown>}
                | undefined;
            const raw = Math.max(1, rawMin || 1);
            const isGroupBookingsProfileColumn =
                get(headMeta, 'custom.profileGroupBookingsColumn') === true;
            if (isGroupBookingsProfileColumn) {
                const weight = Math.max(
                    1,
                    Number(get(headMeta, 'custom.profileGroupBookingsWeight')) || 1,
                );
                const GROUP_BOOKINGS_BASE_MIN = 54;
                const min = Math.max(1, Math.round(GROUP_BOOKINGS_BASE_MIN * weight));
                return {
                    min,
                    fixed: undefined,
                };
            }
            const profileCompactWidth = get(headMeta, 'custom.profileCompactWidth') === true;
            if (profileCompactWidth && typeof fixedWidth === 'number' && fixedWidth > 0) {
                return {
                    min: 1,
                    max: fixedWidth,
                };
            }
            /* Числовые колонки: не раздувать min из‑за длинного заголовка («Групп» vs «F») */
            const FLAT_NUMBER_COL_MAX_MIN = isPreSalePeriodMatrixHead ? 26 : 42;
            const min =
                headMeta?.type === 'number' ? Math.min(raw, FLAT_NUMBER_COL_MAX_MIN) : raw;
            return {
                min,
                // Плоская таблица: не фиксируем width из меты, чтобы auto-fit мог ужимать/распределять ширины
                // под текущий контейнер без горизонтального скролла.
                fixed: undefined,
            };
        }

        if (isMeasureNamesCol) {
            const w = Math.min(
                CAP_COL_MEASURE_NAMES,
                Math.max(MIN_MEASURE_NAMES_WIDTH, rawMin || MIN_MEASURE_NAMES_WIDTH),
            );
            return {min: w, max: CAP_COL_MEASURE_NAMES};
        }
        if (i === 0) {
            /*
             * Не подмешиваем rawMin из BackgroundTable: там таблица без dl-table_prepared (без grid),
             * замер по getBoundingClientRect не совпадает с финальной сеткой; плюс в BackgroundTable
             * минимумы только растут — после этого правки MIN/CAP «не доезжали» до визуала.
             * Рейс/Напр-е: fixed — не растут от k в getCellsWidth (см. cell-width.ts).
             */
            return {min: MIN_COL_REYS, max: CAP_COL_REYS, fixed: MIN_COL_REYS};
        }
        if (i === 1) {
            return {min: MIN_COL_NAPR, max: CAP_COL_NAPR, fixed: MIN_COL_NAPR};
        }
        if (!isBodyDataCol && i < lastIdx && i >= 2 && !isMeasureNamesCol) {
            return {min: Math.max(1, rawMin || 0)};
        }
        if (i === lastIdx) {
            const widthHint =
                fixedWidth !== undefined && fixedWidth !== null ? Number(fixedWidth) : rawMin;
            const min = Math.min(CAP_COL_ITOGO, Math.max(1, Math.floor(widthHint || rawMin || 1)));
            const stretchToFillContainer = dataIndices.length === 0;
            if (stretchToFillContainer) {
                return {min, fixed: undefined};
            }
            /* max: лишняя ширина виджета уходит в дни (remainderSplitIndices), а не в ИТОГО */
            return {min, max: CAP_COL_ITOGO, fixed: undefined};
        }
        // Колонки дней: свой min по замеру, с потолком — 30/31 не уходят шире остальных из‑за одного max по всем
        const min = isBodyDataCol ? Math.min(CAP_DAY_COLUMN_MIN, Math.max(1, rawMin || 0)) : rawMin;
        return {
            min,
            fixed: fixedWidth !== undefined && fixedWidth !== null ? Number(fixedWidth) : undefined,
        };
    });

    const colSizeRef = React.useRef<number[]>();

    const colSizes = React.useMemo(() => {
        const remainderSplitIndices =
            effectivePivotColumnLayout && dataIndices.length > 0 ? dataIndices : undefined;
        const raw = getCellsWidth({
            cols,
            /* getCellsWidth вычитает 2px внутри — компенсируем, чтобы targetInner = tableColumnBudgetPx */
            tableMinWidth: tableColumnBudgetPx + 2,
            remainderSplitIndices,
        });
        const budget = tableColumnBudgetPx;
        let result =
            containerWidth > 0 && raw.length > 0
                ? fitColumnWidthsToBudget(raw, budget, remainderSplitIndices)
                : raw;
        if (raw.length > 0 && containerWidth > 0) {
            const colMins = cols.map((c) => c.min);
            result = enforceMinsWithinBudget(result, budget, colMins, remainderSplitIndices);
            /*
             * Если после enforce сумма > budget, НЕЛЬЗЯ повторно запускать fitColumnWidthsToBudget:
             * он масштабирует все колонки и снова «схлопывает» Рейс/Напр-е ниже целевого минимума.
             * Сжимаем только дни/хвост справа, оставляя первые pinned-колонки стабильными.
             */
            const sumW = result.reduce((a, b) => a + b, 0);
            if (!effectivePivotColumnLayout && sumW > budget + 0.5) {
                result = fitColumnWidthsToBudget(result, budget, remainderSplitIndices);
            } else if (effectivePivotColumnLayout && sumW > budget + 0.5) {
                let overflow = Math.ceil(sumW - budget);
                const shrinkOrder: number[] = [];
                // 1) Дни (основной буфер сжатия)
                for (const i of dataIndices) {
                    shrinkOrder.push(i);
                }
                // 2) Правая ИТОГО
                if (lastIdx >= 0) {
                    shrinkOrder.push(lastIdx);
                }
                // 3) Measure names (если есть)
                if (effectiveMeasureNamesIdx >= 0) {
                    shrinkOrder.push(effectiveMeasureNamesIdx);
                }
                // 4) Только в самом конце допускаем лёгкое сжатие Напр-е и Рейс
                if (1 < result.length) {
                    shrinkOrder.push(1);
                }
                if (0 < result.length) {
                    shrinkOrder.push(0);
                }

                const seen = new Set<number>();
                const uniqueShrinkOrder = shrinkOrder.filter((i) => {
                    if (seen.has(i) || i < 0 || i >= result.length) {
                        return false;
                    }
                    seen.add(i);
                    return true;
                });

                const hardFloor = (i: number) => {
                    if (i === 0) return MIN_COL_REYS;
                    if (i === 1) return MIN_COL_NAPR;
                    return 1;
                };

                while (overflow > 0) {
                    let reducedInRound = false;
                    for (const i of uniqueShrinkOrder) {
                        if (overflow <= 0) break;
                        const floor = Math.max(hardFloor(i), Math.floor(colMins[i] ?? 1));
                        if ((result[i] ?? 0) > floor) {
                            result[i] = (result[i] ?? 0) - 1;
                            overflow -= 1;
                            reducedInRound = true;
                        }
                    }
                    if (!reducedInRound) {
                        break;
                    }
                }
            }
        }
        /*
         * Дни месяца должны быть визуально одной ширины.
         * При integer-rounding и остатках бюджетов раньше края (1,2 и 30,31) получали лишние px.
         */
        if (effectivePivotColumnLayout && dataIndices.length > 2 && result.length > 0) {
            const sortedDayIdx = [...dataIndices].sort((a, b) => a - b);
            const daySum = sortedDayIdx.reduce((acc, i) => acc + (result[i] ?? 0), 0);
            const base = Math.max(1, Math.floor(daySum / sortedDayIdx.length));
            let remainder = Math.max(0, Math.round(daySum - base * sortedDayIdx.length));
            const next = [...result];
            sortedDayIdx.forEach((i) => {
                next[i] = base;
            });
            const mid = (sortedDayIdx.length - 1) / 2;
            const distributionOrder = [...sortedDayIdx]
                .map((idx, pos) => ({idx, pos, dist: Math.abs(pos - mid)}))
                .sort((a, b) => (a.dist === b.dist ? a.pos - b.pos : a.dist - b.dist))
                .map((x) => x.idx);
            let orderIndex = 0;
            while (remainder > 0 && distributionOrder.length > 0) {
                const targetIdx = distributionOrder[orderIndex % distributionOrder.length];
                next[targetIdx] = (next[targetIdx] ?? 0) + 1;
                remainder -= 1;
                orderIndex += 1;
            }
            result = next;
        }

        /*
         * Дашборд 7 (предпродажа, flat-профиль): когда не хватает места справа, колонка "Итого"
         * визуально страдает первой (переносы/обрез). Локально перетягиваем несколько px из колонки
         * "Номер рейса" (индекс 1) в последнюю колонку — без глобального изменения раскладки.
         */
        if (!effectivePivotColumnLayout && isPreSalePeriodMatrixHead && result.length > 1) {
            const totalIdx = Math.max(0, lastIdx);
            const donorIdx = 1;
            const totalTargetMin = 56;
            const donorHardFloor = 28;
            const secondaryDonorIdx = 0;
            const secondaryDonorHardFloor = 42;

            const currentTotal = result[totalIdx] ?? 0;
            let need = Math.max(0, totalTargetMin - currentTotal);

            if (need > 0 && donorIdx < result.length) {
                const donorCurrent = result[donorIdx] ?? 0;
                const donorFloor = Math.max(
                    donorHardFloor,
                    Math.min(60, Math.floor(cols[donorIdx]?.min ?? donorHardFloor)),
                );
                const available = Math.max(0, donorCurrent - donorFloor);
                const take = Math.min(need, available);
                if (take > 0) {
                    result[donorIdx] = donorCurrent - take;
                    result[totalIdx] = (result[totalIdx] ?? 0) + take;
                    need -= take;
                }
            }

            if (need > 0 && secondaryDonorIdx < result.length) {
                const donorCurrent = result[secondaryDonorIdx] ?? 0;
                const donorFloor = Math.max(
                    secondaryDonorHardFloor,
                    Math.min(72, Math.floor(cols[secondaryDonorIdx]?.min ?? secondaryDonorHardFloor)),
                );
                const available = Math.max(0, donorCurrent - donorFloor);
                const take = Math.min(need, available);
                if (take > 0) {
                    result[secondaryDonorIdx] = donorCurrent - take;
                    result[totalIdx] = (result[totalIdx] ?? 0) + take;
                }
            }
        }

        /* Страховка: rounding / equalize по дням не должны оставлять сумму треков > budget (обрез колонок справа). */
        const finalBudget = tableColumnBudgetPx;
        const finalSum = result.reduce((a, b) => a + b, 0);
        if (raw.length > 0 && containerWidth > 0 && finalSum > finalBudget + 0.5) {
            result = fitColumnWidthsToBudget(result, finalBudget, remainderSplitIndices);
        }

        if (!isEqual(result, colSizeRef.current)) {
            colSizeRef.current = result;
        }

        return colSizeRef.current ?? [];
    }, [cols, containerWidth, tableColumnBudgetPx]);

    /* Совпадает с grid-template-columns и <col> — иначе pinned и край таблицы расходятся с бюджетом. */
    const alignedColTracks = React.useMemo(() => {
        return alignColTracksToBudget(colSizes, tableColumnBudgetPx);
    }, [colSizes, tableColumnBudgetPx]);

    const leftPositionsRef = React.useRef<(number | undefined)[]>([]);
    const leftPositions = React.useMemo(() => {
        const newValue = (headers[headers.length - 1]?.headers ?? []).map<number | undefined>(
            (h) => {
                const headData = h.column.columnDef.meta?.head;
                if (!headData?.pinned) {
                    return undefined;
                }

                const cellIndex = headData?.index ?? -1;
                return alignedColTracks.reduce(
                    (sum, _s, i) => (i < cellIndex ? sum + alignedColTracks[i] : sum),
                    1,
                );
            },
        );

        if (!isEqual(newValue, leftPositionsRef.current)) {
            leftPositionsRef.current = newValue;
        }

        return leftPositionsRef.current;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alignedColTracks, data.head]);

    const tableBgColor =
        backgroundColor && !['transparent', TRANSPARENT_COLOR_HEX].includes(backgroundColor)
            ? toSolidColor(backgroundColor)
            : getElementBackgroundColor(tableContainerRef.current);

    const whiteSpace = preserveWhiteSpace ? 'pre-wrap' : 'normal';

    const headerRows = React.useMemo(() => {
        return headers
            .map((headerGroup) => {
                if (!headerGroup.headers.length) {
                    return null;
                }

                const cells = headerGroup.headers
                    .map((header) => {
                        if (header.column.depth !== headerGroup.depth) {
                            return null;
                        }

                        const originalCellData = header.column.columnDef.meta?.head;
                        const rowSpan = header.isPlaceholder
                            ? headers.length - headerGroup.depth
                            : undefined;
                        const leafHeaderCount = header.getLeafHeaders().length;
                        const colSpan =
                            leafHeaderCount > 1
                                ? leafHeaderCount
                                : header.colSpan > 1
                                  ? header.colSpan
                                  : undefined;
                        const sortable = header.column.getCanSort();
                        const pinned = Boolean(originalCellData?.pinned);
                        const measureNamesColumn =
                            (originalCellData?.index ?? header.index) === effectiveMeasureNamesIdx &&
                            effectiveMeasureNamesIdx >= 0;
                        const cellStyle: React.CSSProperties = getCellCustomStyle(
                            originalCellData,
                            tableBgColor,
                        );

                        if (pinned) {
                            cellStyle.left = leftPositions[originalCellData?.index ?? -1];
                        }
                        // Сводная: стили только с бэкенда (cell.css). Обычные таблицы без css — fallback на переменную темы.
                        if (!cellStyle.backgroundColor && !get(originalCellData, 'css')) {
                            cellStyle.backgroundColor = 'var(--dl-table-header-bg-color)';
                        }

                        if (typeof originalCellData?.width !== 'undefined') {
                            cellStyle.whiteSpace = cellStyle.whiteSpace ?? whiteSpace;
                            cellStyle.wordBreak = cellStyle.wordBreak ?? 'break-word';
                        }
                        if (measureNamesColumn) {
                            cellStyle.paddingLeft = 2;
                        }

                        if (!isPivotStyleColumnLayout) {
                            cellStyle.whiteSpace = 'nowrap';
                            cellStyle.wordBreak = 'normal';
                            /* Иначе border из cell.css шапки (часто #000) перебивает сетку light-header */
                            delete cellStyle.border;
                            delete cellStyle.borderTop;
                            delete cellStyle.borderBottom;
                            delete cellStyle.borderLeft;
                            delete cellStyle.borderRight;
                            delete cellStyle.borderColor;
                            delete cellStyle.borderWidth;
                            delete cellStyle.borderStyle;
                        }

                        /* Отчёт по классам: фон/текст шапки по роли колонки */
                        if (isFlightLoadByClassReport) {
                            const role = flightLoadByClassColumnRole.get(
                                originalCellData?.index ?? header.index,
                            );
                            cellStyle.fontWeight = 700;
                            if (role === 'class') {
                                cellStyle.backgroundColor = '#9eb6e4';
                                cellStyle.color = '#4a6088';
                            } else if (role === 'total' || role === 'diff') {
                                cellStyle.backgroundColor = '#7292cc';
                                cellStyle.color = '#ffffff';
                            } else {
                                cellStyle.backgroundColor = '#4c68a2';
                                cellStyle.color = '#ffffff';
                            }
                        }

                        /* Групповые колонки в createTableColumns имеют meta.head.index === -1; для CSS Grid
                         * нужна позиция первого листа под группой (совпадает с колонкой тела таблицы). */
                        const firstLeafHeader = header.getLeafHeaders()[0];
                        const columnStartIndex =
                            typeof originalCellData?.index === 'number' &&
                            originalCellData.index >= 0
                                ? originalCellData.index
                                : typeof firstLeafHeader !== 'undefined'
                                  ? firstLeafHeader.index
                                  : undefined;

                        return {
                            id: header.id,
                            index: header.index,
                            columnStartIndex,
                            rowSpan,
                            colSpan,
                            headerTextAlign: effectivePivotColumnLayout ? 'center' : 'left',
                            sortable,
                            pinned,
                            measureNamesColumn,
                            style: cellStyle,
                            verticalAlignment: originalCellData?.verticalAlignment,
                            sorting: header.column.getIsSorted(),
                            content: flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                            ),
                            onClick: header.column.getToggleSortingHandler(),
                        };
                    })
                    .filter(Boolean);

                return {
                    id: headerGroup.id,
                    cells,
                };
            })
            .filter(Boolean) as HeadRowViewData[];
    }, [
        columns,
        leftPositions,
        sorting,
        tableBgColor,
        effectiveMeasureNamesIdx,
        isPivotStyleColumnLayout,
        effectivePivotColumnLayout,
        isFlightLoadByClassReport,
        flightLoadByClassColumnRole,
    ]);

    const colgroup = alignedColTracks.map((size) => ({width: `${size}px`}));
    const gridTemplateColumns = alignedColTracks.map((w) => `${w}px`).join(' ');
    const header = {
        rows: headerRows,
        style: {
            gridTemplateColumns,
            /* Фон только у ячеек th, не у thead — иначе серый уходит правее границы последней ячейки. */
        },
    };

    const rows = React.useMemo(() => {
        if (!activeVirtualItems.length) {
            const colSpan = headers[headers.length - 1]?.headers?.length;
            return [getNoDataRow(colSpan)];
        }

        const prevCells = new Array(tableRows[0]?.getVisibleCells()?.length);
        return activeVirtualItems.reduce<BodyRowViewData[]>((rowsAcc, virtualRow) => {
            const row = tableRows[virtualRow.index] as Row<TData>;
            const rowMeasuredHeight = rowMeasures[row.id];
            const visibleCells = row.getVisibleCells();
            let groupingStartIndex = 0;
            const cells = visibleCells.reduce<BodyCellViewData[]>((acc, cell, index) => {
                const originalHeadData = cell.column.columnDef.meta?.head;
                const enableRowGrouping = get(originalHeadData, 'group', false);
                /* Сводная: как в development — значение по порядку visibleCells; позиция колонки по meta.head.index */
                const originalCellData = cell.row.original[index] ?? {value: ''};
                const pinned = Boolean(originalHeadData?.pinned);

                if (get(originalCellData, 'isRowSpanCovered')) {
                    return acc;
                }

                if (enableRowGrouping) {
                    if (typeof prevCells[index] !== 'undefined') {
                        const prevCellRow = rowsAcc[prevCells[index]];
                        const prevCell = prevCellRow?.cells?.find((c) => c.index === index);
                        if (
                            typeof prevCell?.rowSpan !== 'undefined' &&
                            shouldGroupRow({
                                currentRow: cell.row.original,
                                prevRow: tableRows[prevCellRow?.index]?.original,
                                cellIndex: index,
                                startIndex: groupingStartIndex,
                            })
                        ) {
                            prevCell.rowSpan += 1;
                            if (prevCell.maxHeight && rowMeasuredHeight) {
                                prevCell.maxHeight += rowMeasuredHeight;
                            }

                            return acc;
                        }
                    }
                } else {
                    groupingStartIndex = index + 1;
                }

                const additionalStyles = getCellAdditionStyles
                    ? getCellAdditionStyles(originalCellData as TableCell, row.original)
                    : {};

                // ИТОГО (#cbe0ff и др.) — только у сводной с многоуровневой шапкой.
                // Плоская таблица с column.group (merge строк) даёт hasGroups=true, но это не колонка «ИТОГО» сводной.
                const isTotalColumn =
                    hasNestedHeaderColumns(data.head) &&
                    hasGroups(data.head) &&
                    index === visibleCells.length - 1;
                const baseCellStyle = getCellCustomStyle(
                    originalCellData,
                    tableBgColor,
                    originalHeadData,
                    isTotalColumn,
                );
                const cellStyle: React.CSSProperties = {
                    ...baseCellStyle,
                    ...additionalStyles,
                };
                // YDL OS: колонка ИТОГО — фон с бэкенда (#cbe0ff для Млн. р и др.) не перезатирать actionParams/drill-down
                if (isTotalColumn && baseCellStyle.backgroundColor) {
                    cellStyle.backgroundColor = baseCellStyle.backgroundColor;
                }

                if (pinned) {
                    cellStyle.left = leftPositions[originalHeadData?.index ?? -1];

                    if (!cellStyle.backgroundColor) {
                        cellStyle.backgroundColor = tableBgColor;
                    }
                    // Рейс, Напр-е: без переноса, в одну строку (перебиваем cell.css и width/wordBreak)
                    cellStyle.whiteSpace = 'nowrap';
                    cellStyle.wordBreak = 'normal';
                } else if (typeof originalHeadData?.width !== 'undefined') {
                    cellStyle.whiteSpace = whiteSpace;
                    cellStyle.wordBreak = 'break-word';
                }

                const cellColumnIndex =
                    typeof originalHeadData?.index === 'number' ? originalHeadData.index : index;
                if (isFlightLoadByClassReport) {
                    const role = flightLoadByClassColumnRole.get(cellColumnIndex);
                    if (role === 'date') {
                        cellStyle.backgroundColor = '#9eb6e4';
                        cellStyle.color = '#4a6088';
                        cellStyle.fontWeight = 700;
                        cellStyle.textAlign = 'left';
                        cellStyle.justifyContent = 'flex-start';
                        cellStyle.paddingLeft = 3;
                    } else if (role === 'total' || role === 'diff') {
                        cellStyle.backgroundColor = '#7292cc';
                        cellStyle.color = '#ffffff';
                        cellStyle.fontWeight = 700;
                    } else if (role === 'class') {
                        cellStyle.backgroundColor = '#ffffff';
                        cellStyle.color = '#1a1a2e';
                        cellStyle.fontWeight = 400;
                    }
                    cellStyle.display = 'flex';
                    cellStyle.alignItems = 'center';
                    cellStyle.verticalAlign = 'middle';
                }
                const isMeasureNamesCol =
                    cellColumnIndex === effectiveMeasureNamesIdx && effectiveMeasureNamesIdx >= 0;
                const contentStyle: React.CSSProperties = {};
                if (pinned) {
                    contentStyle.whiteSpace = 'nowrap';
                }
                // width на внутреннем flex + flex:1 1 auto у .cell-content растягивает заливку на всю дорожку grid — колонки «пустые»
                if (
                    typeof originalHeadData?.width !== 'undefined' &&
                    !pinned &&
                    !isMeasureNamesCol
                ) {
                    contentStyle.width = originalHeadData.width;
                }
                if (isMeasureNamesCol) {
                    cellStyle.paddingLeft = 2;
                    contentStyle.paddingLeft = 1;
                    contentStyle.justifyContent = 'flex-start';
                    contentStyle.textAlign = 'left';
                }

                const renderCell =
                    typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell
                        : () => cell.column.columnDef.cell;
                const {verticalAlignment} = originalCellData;

                const backendRowSpan = get(originalCellData, 'rowSpan');
                const rowSpanNum =
                    typeof backendRowSpan === 'number' && backendRowSpan > 1 ? backendRowSpan : 1;
                /* Сводная как в development: rowSpan в td всегда 1 (иначе CSS grid ломает ширины). Плоская / row-tree — с бэкенда. */
                const resolvedBodyRowSpan =
                    effectivePivotColumnLayout && !hasBodyRowSpan
                        ? 1
                        : rowSpanNum > 1
                          ? rowSpanNum
                          : undefined;

                const cellData: BodyCellViewData = {
                    id: cell.id,
                    index,
                    columnStartIndex: cellColumnIndex,
                    style: cellStyle,
                    contentStyle,
                    verticalAlignment,
                    content: renderCell(cell.getContext()),
                    type: get(originalCellData, 'type', get(originalHeadData, 'type')),
                    contentType: originalCellData?.value === null ? 'null' : undefined,
                    pinned,
                    measureNamesColumn: isMeasureNamesCol,
                    className:
                        typeof originalCellData?.className === 'function'
                            ? originalCellData?.className()
                            : originalCellData?.className,
                    rowSpan: resolvedBodyRowSpan,
                    data: originalCellData,
                    maxHeight:
                        enableRowGrouping && rowMeasuredHeight ? rowMeasuredHeight : undefined,
                };

                prevCells[index] = rowsAcc.length;
                acc.push(cellData);
                return acc;
            }, []);

            rowsAcc.push({
                id: row.id,
                index: virtualRow.index,
                cells,
                y: virtualRow.start,
                /*
                 * Для вложенной строки сегмента первая pinned-ячейка "Рейс" часто скрыта rowSpan-ом,
                 * поэтому надёжнее определять сегмент по отсутствию колонки с логическим индексом 0.
                 */
                isSegmentRow:
                    cells.length > 0 &&
                    !cells.some((c) => {
                        const start =
                            typeof c.columnStartIndex === 'number' ? c.columnStartIndex : c.index;
                        return start === 0;
                    }),
                isLastBeforeFooter:
                    // Футер уже рендерится только когда конец данных достигнут (hasFooter ниже).
                    // Привязка к isViewportAtDataEnd здесь давала флап на некоторых DPI/zoom:
                    // класс не ставился, и на стыке body/tfoot появлялась «вторая» линия.
                    virtualRow.index === tableRows.length - 1 && Boolean(data.footer?.length),
            });

            return rowsAcc;
        }, []);
    }, [
        tableRows,
        activeVirtualItems,
        getCellAdditionStyles,
        tableRowsData,
        rowVirtualizer,
        effectiveMeasureNamesIdx,
        isPivotStyleColumnLayout,
        effectivePivotColumnLayout,
        hasBodyRowSpan,
        data.footer,
        isFlightLoadByClassReport,
        flightLoadByClassColumnRole,
    ]);

    const transform =
        !disableVirtualization && typeof rows[0]?.y !== 'undefined'
            ? `translateY(${rows[0]?.y}px)`
            : undefined;
    const isEndOfPage = rows[rows.length - 1]?.index === tableRows.length - 1;
    const hasFooter = isEndOfPage && data.footer?.length > 0;

    const allFooterRows = React.useMemo(() => {
        if (!data.footer?.length) return [];
        return getFooterRows({
            data,
            columns,
            leftPositions,
            measureNamesColIndex: effectiveMeasureNamesIdx,
        });
    }, [data, columns, leftPositions, effectiveMeasureNamesIdx]);

    const footer: TableViewData['footer'] = {
        rows: hasFooter ? allFooterRows : [],
        style: {gridTemplateColumns},
    };

    return {
        /* Матрица предпродажи: nested header без «сводной» раскладки — нужен light-header и серая сетка как у тела */
        lightHeaderChrome: !effectivePivotColumnLayout,
        header,
        body: {
            rows,
            style: {gridTemplateColumns, transform},
            rowRef: (node) => {
                if (!disableVirtualization) {
                    rowVirtualizer.measureElement(node);
                }
            },
        },
        footer,
        measurementFooter: {rows: allFooterRows},
        totalSize: disableVirtualization ? undefined : rowVirtualizer.getTotalSize(),
        colgroup,
    };
};

