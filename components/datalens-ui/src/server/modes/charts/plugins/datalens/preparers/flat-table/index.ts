import type {
    BarTableCell,
    Field,
    TableCell,
    TableCellsRow,
    TableCommonCell,
    TableHead,
} from '../../../../../../../shared';
import {
    DATASET_FIELD_TYPES,
    GradientNullModes,
    IS_NULL_FILTER_TEMPLATE,
    MINIMUM_FRACTION_DIGITS,
    getFormatOptions,
    isDateField,
    isDateType,
    isMarkupDataType,
    isNumberField,
    isTreeDataType,
    isUnsupportedDataType,
} from '../../../../../../../shared';
import {getTreeState} from '../../url/helpers';
import {mapAndColorizeTableCells} from '../../utils/color-helpers';
import {
    DEFAULT_DATETIMETZ_FORMAT,
    DEFAULT_DATETIME_FORMAT,
    DEFAULT_DATE_FORMAT,
} from '../../utils/constants';
import {
    findIndexInOrder,
    isNumericalDataType,
    isTableBarsSettingsEnabled,
    isTableFieldBackgroundSettingsEnabled,
} from '../../utils/misc-helpers';
import {addActionParamValue, canUseFieldForFiltering} from '../helpers/action-params';
import {getBarSettingsValue, getBarSettingsViewOptions} from '../helpers/barsSettings';
import {getColumnWidthValue} from '../helpers/columnSettings';
import {
    VisualizationCustomizationProfile,
    getVisualizationCustomizationBehaviorFlags,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import type {PrepareFunctionArgs, PrepareFunctionDataRow} from '../types';

import {
    getBackgroundColorsMapByContinuousColumn,
    getFlatTableBackgroundStyles,
} from './helpers/background-settings';
import {
    applyFlatTreeFlightColumnRowSpan,
    expandFlatTableRowsForRowTree,
    inferAutoClassTotalFromFcySequence,
    type FlatTableRowTreeRowMeta,
    type FlatTableRowTreeSettings,
} from './helpers/flat-table-row-tree';
import {getFooter} from './helpers/footer';
import {getColumnValuesByColumnWithBarSettings} from './helpers/misc';

const FLAT_TREE_HDR = {
    backgroundColor: '#4c68a2',
    color: '#ffffff',
    textAlign: 'left' as const,
    fontWeight: 'bold' as const,
};

const FLAT_TREE_SEG_BG = '#c6daf8';
/** Текст в колонке «Сегмент» на строках сегментов (не итог) */
const FLAT_TREE_SEG_COLUMN_COLOR = '#5875ac';
/** Рейс и строки «Всего» (сегмент + числа) — один цвет как в эталоне */
const FLAT_TREE_TEXT_ON_BAND = '#4c638f';
/** Числа на строках «Всего» (цветной фон итога) */
const FLAT_TREE_TOTAL_ROW_NUMBER_COLOR = '#53607e';
const FLAT_TREE_BAND_BG = '#9eb6e4';
const FLAT_TREE_MEASURE_BG = '#ffffff';
const FLAT_TREE_TEXT_ON_WHITE = '#000000';
const PROFILE_TABLE_HEADER_TEXT = '#ffffff';
const PROFILE_TABLE_LABEL_TEXT = '#4a6088';
const PROFILE_TABLE_GRID = '#d8e4f6';
/** Эталон 8-го дашборда «Групповые бронирования» */
const GB_HEADER_BG = '#4A65A0';
const GB_BORDER = '#e8e8e8';
const GB_BODY_COL1_BG = '#9eb6e4';
const GB_BODY_COL2_BG = '#c6daf8';
const GB_BODY_COL3_8_BG = '#e6eefc';
const GB_BODY_WHITE = '#ffffff';
const GB_BODY_COL1_TEXT = '#495880';
const GB_BODY_COL2_TEXT = '#5576af';
const GB_BODY_COL3_8_TEXT = '#5371b6';
const GB_BODY_NUMERIC_TEXT = '#1a1a2e';
/** Приглушённые синие ближе к эталону (менее «неон», чем прежние). */
const PRE_SALE_HEADER_BG = '#4c68a2';
const PRE_SALE_SUBHEADER_BG = '#7f9fd3';
const PRE_SALE_LABEL_BG = '#aec3e7';
const PRE_SALE_TOTAL_BG = '#dce8f7';
const PRE_SALE_TEXT = '#1f3f73';

/** Матрица предпродажи по периоду (дашборд 7): сетка как у дашборда 4 (#e8e8e8) */
const PRE_SALE_MATRIX_GRID = '#e8e8e8';
const PRE_SALE_MATRIX_BODY_BG = '#9eb6e4';
/** Строки блока при раскрытой дате (+), см. эталон */
const PRE_SALE_MATRIX_EXPANDED_BG = '#c6daf8';
/** Нижняя общая строка «Итого» */
const PRE_SALE_MATRIX_GRAND_TOTAL_BG = '#7292cc';
const PRE_SALE_MATRIX_HDR_DIM_TOP_BG = '#4c68a2';
const PRE_SALE_MATRIX_HDR_DIM_LEAF_BG = '#4c68a2';
const PRE_SALE_MATRIX_HDR_CLASS_BG = '#9eb6e4';
const PRE_SALE_MATRIX_HDR_CLASS_TEXT = '#53648a';
const PRE_SALE_MATRIX_HDR_TOTAL_TOP_BG = '#7292cc';
const PRE_SALE_MATRIX_HDR_TOTAL_LEAF_BG = '#7292cc';
/** Подписи «Итого» в измерениях (Номер рейса, порты) в строках итога по дате */
const PRE_SALE_MATRIX_BODY_INLINE_TOTAL_TEXT = '#516288';
/** Колонка «Дата рейса» — тот же цвет, что у подписей «Итого» в теле */
const PRE_SALE_MATRIX_BODY_COL1_TEXT = PRE_SALE_MATRIX_BODY_INLINE_TOTAL_TEXT;
const PRE_SALE_MATRIX_BODY_DATA_TEXT = '#5b70a6';
/** Цифры в колонках с буквами и в «Итого» справа */
const PRE_SALE_MATRIX_BODY_NUMERIC_TEXT = '#5d77ac';
/** Цифры в строках «Итого» в теле таблицы */
const PRE_SALE_MATRIX_INLINE_TOTAL_NUMERIC_TEXT = '#53688e';
const PRE_SALE_MATRIX_GRAND_TOTAL_TEXT = '#ffffff';

function getDateFormatForDashboardProfile(args: {
    customizationProfile: string;
    dataType: unknown;
    hasUserFormat?: boolean;
}): string | undefined {
    const {customizationProfile, dataType, hasUserFormat = false} = args;

    const isDashboard5or7 =
        customizationProfile === VisualizationCustomizationProfile.FlightLoadByClass ||
        customizationProfile === VisualizationCustomizationProfile.PreSalePeriod;

    if (isDashboard5or7 && hasUserFormat) {
        return undefined;
    }

    if (customizationProfile === VisualizationCustomizationProfile.GroupBookings) {
        return 'DD-MM-YYYY';
    }

    const needsHyphenDateFormat = isDashboard5or7;

    if (!needsHyphenDateFormat) {
        return undefined;
    }

    if (dataType === 'datetimetz') {
        return 'DD-MM-YYYY HH:mm:ss Z';
    }
    if (dataType === 'genericdatetime') {
        return 'DD-MM-YYYY HH:mm';
    }
    return 'DD-MM-YYYY';
}

function resolveFlatTreePresetFieldGuids(args: {
    columns: Array<Pick<Field, 'guid' | 'title'> & {fakeTitle?: string}>;
    idToTitle: Record<string, string>;
}): {flightFieldGuid: string; segmentFieldGuid: string} | undefined {
    const {columns, idToTitle} = args;
    if (!Array.isArray(columns) || columns.length < 2) {
        return undefined;
    }

    const titled = columns.map((item) => {
        const title = normalizeFlatTitle(item.fakeTitle || idToTitle[item.guid] || item.title);
        return {
            guid: String(item.guid || ''),
            title,
        };
    });

    const flight = titled.find(
        (item) => item.guid && (item.title.includes('рейс') || item.title.includes('flight')),
    );
    const segment = titled.find(
        (item) =>
            item.guid &&
            (item.title.includes('сегмент') || item.title.includes('segment')) &&
            item.guid !== flight?.guid,
    );

    if (!flight?.guid || !segment?.guid) {
        return undefined;
    }

    return {flightFieldGuid: flight.guid, segmentFieldGuid: segment.guid};
}

function normalizeFlatTitle(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/ё/g, 'е');
}

function isPreSaleCClassTitle(title: string) {
    return title === 'cclass' || title === 'класс группы' || title === 'группа класса';
}

function isPreSaleClassTitle(title: string) {
    return title === 'class' || title === 'класс';
}

function isPreSaleValueTitle(title: string) {
    const compact = title.replace(/\s+/g, '');
    return (
        compact === 'column1' ||
        compact === 'measurevalues' ||
        title.includes('measure value') ||
        title.includes('значени') ||
        title.includes('показател') ||
        title.includes('метрик')
    );
}

function findPreSaleValueColumnIndex(head: TableHead[]) {
    const titledIndex = head.findIndex((h) => isPreSaleValueTitle(normalizeFlatTitle(h.name)));
    if (titledIndex >= 0) {
        return titledIndex;
    }

    const numericIndex = head.findIndex((h) => {
        const type = normalizeFlatTitle((h as {type?: unknown}).type);
        const view = normalizeFlatTitle((h as {view?: unknown}).view);
        return type === 'number' || view === 'number';
    });

    return numericIndex;
}

function cellRawValue(cell: TableCellsRow['cells'][number]) {
    if (!cell || typeof cell === 'string') {
        return '';
    }

    return (cell as TableCommonCell).value;
}

function cellTextValue(cell: TableCellsRow['cells'][number]) {
    const value = cellRawValue(cell);
    return value === null || value === undefined ? '' : String(value);
}

function cellNumberValue(cell: TableCellsRow['cells'][number]) {
    const value = cellRawValue(cell);
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const numberValue =
        typeof value === 'string' ? Number(value.replace(/\s+/g, '').replace(',', '.')) : Number(value);
    if (!Number.isNaN(numberValue)) {
        return numberValue;
    }

    const formattedValue =
        cell && typeof cell === 'object' ? (cell as TableCommonCell).formattedValue : undefined;
    const formattedNumberValue =
        typeof formattedValue === 'string'
            ? Number(formattedValue.replace(/\s+/g, '').replace(',', '.'))
            : Number.NaN;

    return Number.isNaN(formattedNumberValue) ? 0 : formattedNumberValue;
}

function makeProfileTextCell(value: unknown, fieldId?: string): TableCommonCell {
    return {value: value === null || value === undefined ? '' : String(value), fieldId};
}

/** Нормализация даты для матрицы предпродажи с учётом формата из настройки поля. */
function normalizePreSaleMatrixDateLabel(raw: string, formatHint?: string): string {
    const t = raw.trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s][\s\S]*)?$/.exec(t);
    const dotted = /^(\d{2})\.(\d{2})\.(\d{4})(?:[T\s][\s\S]*)?$/.exec(t);
    const hint = String(formatHint ?? '').toUpperCase();

    const formatByHint = (day: string, month: string, year: string) => {
        if (hint.includes('DD.MM.YYYY')) {
            return `${day}.${month}.${year}`;
        }
        if (hint.includes('YYYY-MM-DD')) {
            return `${year}-${month}-${day}`;
        }
        // По умолчанию для матрицы предпродажи оставляем day-first с дефисом.
        return `${day}-${month}-${year}`;
    };

    if (iso) {
        return formatByHint(iso[3], iso[2], iso[1]);
    }

    if (dotted) {
        return formatByHint(dotted[1], dotted[2], dotted[3]);
    }

    return t;
}

function makeProfileMatrixDimCell(
    rawLabel: string,
    headCol: TableHead | undefined,
    opts?: {firstDimensionColumn?: boolean},
): TableCommonCell {
    const headType = String((headCol as {type?: string})?.type ?? '').toLowerCase();
    const rawStr = String(rawLabel ?? '').trim();
    const isoLike = /^\d{4}-\d{2}-\d{2}(?:[T\s]|$)/.test(rawStr);
    const asDate =
        headType === 'date' || (opts?.firstDimensionColumn === true && isoLike);
    const fieldId = headCol?.id !== undefined ? String(headCol.id) : undefined;
    const formatHint = String((headCol as {format?: unknown})?.format ?? '');
    if (!asDate) {
        return makeProfileTextCell(rawStr, fieldId);
    }
    return {
        value: normalizePreSaleMatrixDateLabel(rawStr, formatHint),
        fieldId,
        type: 'date',
    };
}

function makeProfileNumberCell(value: number | null, fieldId?: string): TableCommonCell {
    return {value, fieldId, type: 'number'};
}

type FlatTableCustomizationInput = {
    headerBg?: string;
    headerColor?: string;
    bodyBg?: string;
    bodyColor?: string;
    footerBg?: string;
    footerColor?: string;
    borderColor?: string;
    headerBorderColor?: string;
    bodyBorderColor?: string;
    footerBorderColor?: string;
    totalBorderColor?: string;
    headerFontSize?: number;
    bodyFontSize?: number;
    footerFontSize?: number;
    headerFontWeight?: string;
    bodyFontWeight?: string;
    footerFontWeight?: string;
    columnWidth?: number;
    rowHeight?: number;
    headerAlign?: 'left' | 'center' | 'right';
    bodyAlign?: 'left' | 'center' | 'right';
    footerAlign?: 'left' | 'center' | 'right';
    cellPaddingX?: number;
    showHeader?: boolean;
    showFooter?: boolean;
    showTotals?: boolean;
    zebraOddBg?: string;
    zebraEvenBg?: string;
    conditionalRules?: Array<{
        op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
        value?: string | number;
        valueTo?: string | number;
        bg?: string;
        color?: string;
        targetFields?: string[];
        targetZone?: 'header' | 'body' | 'footer' | 'total';
        targetTreeLevel?: number;
        contextContains?: string;
        contextDateFrom?: string;
        contextDateTo?: string;
        logic?: 'AND' | 'OR';
        conditions?: Array<{
            op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
            value?: string | number;
            valueTo?: string | number;
        }>;
    }>;
    columnStyles?: Record<
        string,
        {
            width?: number;
            bg?: string;
            color?: string;
            align?: 'left' | 'center' | 'right';
            fontWeight?: string;
            hide?: boolean;
            pin?: boolean;
            order?: number;
            displayTitle?: string;
        }
    >;
    columnFormats?: Record<string, 'integer' | 'percent1' | 'currency0'>;
    customNumberMasks?: Record<string, string>;
    locale?: string;
    currency?: string;
    suffix?: string;
    stylePriority?: Array<'preset' | 'zone' | 'rule' | 'column'>;
    densityProfile?: 'compact' | 'normal' | 'legacy-desktop';
    headerSkin?: 'default' | 'classic-blue' | 'flat-light';
    emptyCellPolicy?: 'blank' | 'zero' | 'dash';
    thresholdPack?: 'none' | 'zpk-traffic' | 'kpi-soft';
    semanticSlots?: Record<string, string>;
    semanticSlotStyles?: Record<
        string,
        {
            bg?: string;
            color?: string;
            fontWeight?: string;
            align?: 'left' | 'center' | 'right';
        }
    >;
};

function reorderFlatTableColumnsByCustomization(args: {
    head: TableHead[];
    rows: TableCellsRow[];
    footer?: TableCellsRow[];
    tableCustomization: FlatTableCustomizationInput;
}) {
    const {head, rows, footer, tableCustomization} = args;
    const indices = head
        .map((_, index) => index)
        .filter((idx) => !tableCustomization.columnStyles?.[String(idx)]?.hide)
        .sort((a, b) => {
            const ao = tableCustomization.columnStyles?.[String(a)]?.order;
            const bo = tableCustomization.columnStyles?.[String(b)]?.order;
            if (typeof ao === 'number' && typeof bo === 'number') {
                return ao - bo;
            }
            if (typeof ao === 'number') {
                return -1;
            }
            if (typeof bo === 'number') {
                return 1;
            }
            return a - b;
        });
    if (indices.length && indices.length !== head.length) {
        const nextHead = indices.map((i) => head[i]!);
        head.splice(0, head.length, ...nextHead);
        rows.forEach((row) => {
            row.cells = indices.map((i) => row.cells[i]).filter(Boolean) as TableCell[];
        });
        footer?.forEach((row) => {
            row.cells = indices.map((i) => row.cells[i]).filter(Boolean) as TableCell[];
        });
    }
}

function applyFlatTableHeaderVisuals(args: {
    head: TableHead[];
    tableCustomization: FlatTableCustomizationInput;
    densityDefaults: {rowHeight: number; fontSize: number; paddingX: number};
}) {
    const {head, tableCustomization, densityDefaults} = args;
    let leafIndex = 0;

    const visit = (nodes: TableHead[]) => {
        for (const cell of nodes) {
            const sub = (cell as {sub?: TableHead[]}).sub;
            if (Array.isArray(sub) && sub.length) {
                (cell as any).css = {
                    ...((cell as any).css || {}),
                    ...(tableCustomization.headerBg ? {backgroundColor: tableCustomization.headerBg} : {}),
                    ...(tableCustomization.headerColor ? {color: tableCustomization.headerColor} : {}),
                    ...(tableCustomization.borderColor ? {borderColor: tableCustomization.borderColor} : {}),
                    ...(tableCustomization.headerBorderColor
                        ? {borderColor: tableCustomization.headerBorderColor}
                        : {}),
                    ...(typeof tableCustomization.headerFontSize === 'number'
                        ? {fontSize: `${tableCustomization.headerFontSize}px`}
                        : {fontSize: `${densityDefaults.fontSize}px`}),
                    ...(tableCustomization.headerFontWeight
                        ? {fontWeight: tableCustomization.headerFontWeight}
                        : {}),
                    ...(tableCustomization.headerAlign
                        ? {textAlign: tableCustomization.headerAlign}
                        : {textAlign: 'center'}),
                    ...(typeof tableCustomization.cellPaddingX === 'number'
                        ? {
                              paddingLeft: `${tableCustomization.cellPaddingX}px`,
                              paddingRight: `${tableCustomization.cellPaddingX}px`,
                          }
                        : {
                              paddingLeft: `${densityDefaults.paddingX}px`,
                              paddingRight: `${densityDefaults.paddingX}px`,
                          }),
                    ...(tableCustomization.headerSkin === 'classic-blue'
                        ? {backgroundColor: '#2b5ba8', color: '#ffffff'}
                        : {}),
                    ...(tableCustomization.headerSkin === 'flat-light'
                        ? {backgroundColor: '#eef3fb', color: '#1f3f73'}
                        : {}),
                };
                visit(sub);
            } else {
                const colIndex = leafIndex++;
                const colStyle = tableCustomization.columnStyles?.[String(colIndex)] || {};
                (cell as any).css = {
                    ...((cell as any).css || {}),
                    ...(tableCustomization.headerBg ? {backgroundColor: tableCustomization.headerBg} : {}),
                    ...(tableCustomization.headerColor ? {color: tableCustomization.headerColor} : {}),
                    ...(tableCustomization.borderColor ? {borderColor: tableCustomization.borderColor} : {}),
                    ...(tableCustomization.headerBorderColor
                        ? {borderColor: tableCustomization.headerBorderColor}
                        : {}),
                    ...(typeof tableCustomization.headerFontSize === 'number'
                        ? {fontSize: `${tableCustomization.headerFontSize}px`}
                        : {fontSize: `${densityDefaults.fontSize}px`}),
                    ...(tableCustomization.headerFontWeight
                        ? {fontWeight: tableCustomization.headerFontWeight}
                        : {}),
                    ...(tableCustomization.headerAlign ? {textAlign: tableCustomization.headerAlign} : {}),
                    ...(typeof tableCustomization.cellPaddingX === 'number'
                        ? {
                              paddingLeft: `${tableCustomization.cellPaddingX}px`,
                              paddingRight: `${tableCustomization.cellPaddingX}px`,
                          }
                        : {
                              paddingLeft: `${densityDefaults.paddingX}px`,
                              paddingRight: `${densityDefaults.paddingX}px`,
                          }),
                    ...(tableCustomization.headerSkin === 'classic-blue'
                        ? {backgroundColor: '#2b5ba8', color: '#ffffff'}
                        : {}),
                    ...(tableCustomization.headerSkin === 'flat-light'
                        ? {backgroundColor: '#eef3fb', color: '#1f3f73'}
                        : {}),
                    ...(colStyle.bg ? {backgroundColor: colStyle.bg} : {}),
                    ...(colStyle.color ? {color: colStyle.color} : {}),
                    ...(colStyle.align ? {textAlign: colStyle.align} : {}),
                    ...(colStyle.fontWeight ? {fontWeight: colStyle.fontWeight} : {}),
                };
                if (colStyle.displayTitle) {
                    (cell as any).name = colStyle.displayTitle;
                }
                if (typeof colStyle.pin === 'boolean') {
                    (cell as any).pinned = colStyle.pin;
                }
                if (typeof colStyle.width === 'number' && colStyle.width > 0) {
                    (cell as any).width = `${colStyle.width}px`;
                } else if (
                    typeof tableCustomization.columnWidth === 'number' &&
                    tableCustomization.columnWidth > 0
                ) {
                    (cell as any).width = `${tableCustomization.columnWidth}px`;
                }
            }
        }
    };

    visit(head);
}

function wrapPreSaleMatrixDimHead(leaf: TableHead): TableHead {
    const inner = {...leaf};
    const pinned = (leaf as {pinned?: boolean}).pinned;
    return {
        id: `${String(leaf.id ?? leaf.name)}__pre_sale_dim_wrap`,
        name: '\u00a0',
        type: 'text',
        ...(pinned !== undefined ? {pinned} : {}),
        custom: {
            profilePreSalePeriodMatrixSkin: true,
            preSaleHeaderTier: 'dimTop',
        },
        sub: [
            {
                ...inner,
                ...(pinned !== undefined ? {pinned} : {}),
                custom: {
                    ...(typeof inner.custom === 'object' && inner.custom ? inner.custom : {}),
                    preSaleHeaderTier: 'dimLeaf',
                },
            },
        ],
    } as unknown as TableHead;
}

function wrapPreSaleMatrixTotalHead(total: TableHead): TableHead {
    const inner = {...total};
    return {
        id: `${String(total.id ?? 'pre_sale_total')}__pre_sale_total_wrap`,
        name: '\u00a0',
        type: 'text',
        custom: {
            profilePreSalePeriodMatrixSkin: true,
            preSaleHeaderTier: 'totalTop',
        },
        sub: [
            {
                ...inner,
                custom: {
                    ...(typeof inner.custom === 'object' && inner.custom ? inner.custom : {}),
                    preSaleHeaderTier: 'totalLeaf',
                },
            },
        ],
    } as unknown as TableHead;
}

function applyPreSalePeriodMatrixHeadStyles(head: TableHead[]): void {
    const pad = '4px';
    const visit = (cell: TableHead) => {
        const tier = (cell as {custom?: {preSaleHeaderTier?: string}}).custom?.preSaleHeaderTier;
        const base = {
            borderColor: PRE_SALE_MATRIX_GRID,
            textAlign: 'left' as const,
            paddingLeft: pad,
            paddingRight: '4px',
        };
        if (tier === 'dimTop') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_DIM_TOP_BG,
                color: PRE_SALE_MATRIX_HDR_DIM_TOP_BG,
                fontWeight: 700,
            };
        } else if (tier === 'dimLeaf') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_DIM_LEAF_BG,
                color: '#ffffff',
                fontWeight: 700,
            };
        } else if (tier === 'classParent') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_CLASS_BG,
                color: PRE_SALE_MATRIX_HDR_CLASS_TEXT,
                fontWeight: 700,
            };
        } else if (tier === 'classLeaf') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_CLASS_BG,
                color: PRE_SALE_MATRIX_HDR_CLASS_TEXT,
                fontWeight: 600,
            };
        } else if (tier === 'totalTop') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_TOTAL_TOP_BG,
                color: PRE_SALE_MATRIX_HDR_TOTAL_TOP_BG,
                fontWeight: 700,
            };
        } else if (tier === 'totalLeaf') {
            (cell as {css?: Record<string, unknown>}).css = {
                ...base,
                backgroundColor: PRE_SALE_MATRIX_HDR_TOTAL_LEAF_BG,
                color: '#ffffff',
                fontWeight: 700,
                whiteSpace: 'nowrap',
            };
        }
        const subs = (cell as {sub?: TableHead[]}).sub;
        subs?.forEach(visit);
    };
    head.forEach(visit);
}

function applyPreSalePeriodMatrixHeadWidths(head: TableHead[]): void {
    let dimIndex = 0;
    const dimWidths = ['76px', '88px', '52px', '52px'];
    const visit = (cell: TableHead) => {
        const subs = (cell as TableHead & {sub?: TableHead[]}).sub;
        const tier = (cell as {custom?: {preSaleHeaderTier?: string}}).custom?.preSaleHeaderTier;
        if (tier === 'dimTop') {
            const leaf = subs?.[0];
            if (
                leaf &&
                (leaf as {custom?: {preSaleHeaderTier?: string}}).custom?.preSaleHeaderTier ===
                    'dimLeaf'
            ) {
                (leaf as {width?: string}).width = dimWidths[dimIndex] ?? '52px';
                dimIndex += 1;
            }
        }
        if (tier === 'totalTop') {
            const leaf = subs?.[0];
            if (leaf) {
                (leaf as {width?: string}).width = '54px';
            }
        }
        if (tier === 'classLeaf') {
            (cell as {width?: string}).width = (cell as {width?: string}).width ?? '26px';
        }
        subs?.forEach(visit);
    };
    head.forEach(visit);
}

function applyPreSalePeriodMatrixBodyStyles(rows: TableCellsRow[]): void {
    let expandedTintRemaining = 0;

    rows.forEach((row) => {
        const cell0 = row.cells[0];
        const common0 =
            cell0 && typeof cell0 === 'object' ? (cell0 as TableCommonCell) : undefined;

        const isGrandTotalRow =
            Boolean(common0) &&
            !common0!.isRowSpanCovered &&
            /^итого$/i.test(cellTextValue(row.cells[0]).trim()) &&
            cellTextValue(row.cells[1]).trim() === '';

        if (isGrandTotalRow) {
            expandedTintRemaining = 0;
        } else if (
            common0?.treeNodeState === 'open' &&
            typeof common0.rowSpan === 'number' &&
            common0.rowSpan > 1
        ) {
            expandedTintRemaining = common0.rowSpan;
        }

        const rowBgTint =
            expandedTintRemaining > 0 ? PRE_SALE_MATRIX_EXPANDED_BG : PRE_SALE_MATRIX_BODY_BG;

        if (!isGrandTotalRow && expandedTintRemaining > 0) {
            expandedTintRemaining -= 1;
        }

        row.cells.forEach((cell, index) => {
            if (!cell || typeof cell === 'string') {
                return;
            }
            const common = cell as TableCommonCell;
            const isInlineTotalRow = /^итого$/i.test(cellTextValue(row.cells[1]).trim());

            const alignLeft = index <= 3;
            const padLeft = alignLeft ? '4px' : undefined;
            const padRight = !alignLeft ? '4px' : undefined;

            const bodyCellBg = (() => {
                if (index === 0) {
                    return PRE_SALE_MATRIX_BODY_BG;
                }
                if (isInlineTotalRow) {
                    return PRE_SALE_MATRIX_BODY_BG;
                }
                return rowBgTint;
            })();

            const bodyTextColor = (() => {
                if (index >= 4) {
                    return PRE_SALE_MATRIX_BODY_NUMERIC_TEXT;
                }
                if (index === 0) {
                    return PRE_SALE_MATRIX_BODY_COL1_TEXT;
                }
                return PRE_SALE_MATRIX_BODY_DATA_TEXT;
            })();

            if (isGrandTotalRow) {
                common.css = {
                    ...((common.css as Record<string, unknown>) || {}),
                    backgroundColor: PRE_SALE_MATRIX_GRAND_TOTAL_BG,
                    borderColor: PRE_SALE_MATRIX_GRID,
                    color: PRE_SALE_MATRIX_GRAND_TOTAL_TEXT,
                    fontWeight: 700,
                    textAlign: alignLeft ? 'left' : 'right',
                    paddingLeft: padLeft,
                    paddingRight: padRight,
                };
            } else if (isInlineTotalRow) {
                common.css = {
                    ...((common.css as Record<string, unknown>) || {}),
                    backgroundColor: bodyCellBg,
                    borderColor: PRE_SALE_MATRIX_GRID,
                    color:
                        index >= 4
                            ? PRE_SALE_MATRIX_INLINE_TOTAL_NUMERIC_TEXT
                            : index === 0
                              ? PRE_SALE_MATRIX_BODY_COL1_TEXT
                              : PRE_SALE_MATRIX_BODY_INLINE_TOTAL_TEXT,
                    fontWeight: 700,
                    textAlign: alignLeft ? 'left' : 'right',
                    paddingLeft: padLeft,
                    paddingRight: padRight,
                };
            } else {
                common.css = {
                    ...((common.css as Record<string, unknown>) || {}),
                    backgroundColor: bodyCellBg,
                    borderColor: PRE_SALE_MATRIX_GRID,
                    color: bodyTextColor,
                    fontWeight: 700,
                    textAlign: alignLeft ? 'left' : 'right',
                    paddingLeft: padLeft,
                    paddingRight: padRight,
                };
            }
        });
    });
}

function applyPreSalePeriodHeaderGroups(head: TableHead[]) {
    const cclassIndex = head.findIndex((h) => isPreSaleCClassTitle(normalizeFlatTitle(h.name)));
    const classIndex = head.findIndex((h) => isPreSaleClassTitle(normalizeFlatTitle(h.name)));
    if (cclassIndex < 0 || classIndex !== cclassIndex + 1) {
        return;
    }
    const cclass = head[cclassIndex]!;
    const classHead = head[classIndex]!;
    const groupHead = {
        id: `${String(cclass.id)}__${String(classHead.id)}_profile_group`,
        name: String(cclass.name || 'cclass'),
        type: 'text' as const,
        sub: [
            {...cclass, name: ''},
            classHead,
        ],
        css: {
            ...((cclass as {css?: Record<string, unknown>}).css || {}),
            backgroundColor: PRE_SALE_HEADER_BG,
            color: PROFILE_TABLE_HEADER_TEXT,
            textAlign: 'center',
            fontWeight: 700,
        },
    } as unknown as TableHead;
    head.splice(cclassIndex, 2, groupHead);
}

function applyPreSalePeriodClassMatrix(args: {
    head: TableHead[];
    rows: TableCellsRow[];
    footer?: TableCellsRow[];
}) {
    const {head, rows, footer} = args;
    const cclassIndex = head.findIndex((h) => isPreSaleCClassTitle(normalizeFlatTitle(h.name)));
    const classIndex = head.findIndex((h) => isPreSaleClassTitle(normalizeFlatTitle(h.name)));
    const valueIndex = findPreSaleValueColumnIndex(head);

    if (cclassIndex < 0 || classIndex < 0 || valueIndex < 0 || rows.length === 0) {
        return false;
    }

    const baseIndices = head
        .map((_item, index) => index)
        .filter((index) => index !== cclassIndex && index !== classIndex && index !== valueIndex)
        .slice(0, 4);
    const classKeys: Array<{cclass: string; klass: string; key: string}> = [];
    const classKeySet = new Set<string>();
    const rowGroups = new Map<
        string,
        {
            labels: string[];
            values: Map<string, number>;
        }
    >();

    rows.forEach((row) => {
        const cclass = cellTextValue(row.cells[cclassIndex]);
        const klass = cellTextValue(row.cells[classIndex]);
        if (!cclass || !klass) {
            return;
        }

        const classKey = `${cclass}\u0000${klass}`;
        if (!classKeySet.has(classKey)) {
            classKeySet.add(classKey);
            classKeys.push({cclass, klass, key: classKey});
        }

        const labels = baseIndices.map((index) => cellTextValue(row.cells[index]));
        const rowKey = labels.join('\u0000');
        const group = rowGroups.get(rowKey) ?? {labels, values: new Map<string, number>()};
        group.values.set(classKey, (group.values.get(classKey) ?? 0) + cellNumberValue(row.cells[valueIndex]));
        rowGroups.set(rowKey, group);
    });

    if (!classKeys.length || !rowGroups.size || baseIndices.length < 2) {
        return false;
    }

    /*
     * Одна группа шапки на каждый уникальный cclass (порядок — первое появление в данных).
     * Раньше группы резались при повторном cclass после другого класса → два «Y» подряд (Y…C…Y+J).
     * Колонки значений — порядок первых вхождений пар (cclass, class), внутри cclass классы склеены подписью.
     */
    const classesByCclass = new Map<string, typeof classKeys>();
    for (const item of classKeys) {
        let bucket = classesByCclass.get(item.cclass);
        if (!bucket) {
            bucket = [];
            classesByCclass.set(item.cclass, bucket);
        }
        if (!bucket.some((x) => x.key === item.key)) {
            bucket.push(item);
        }
    }
    const cclassOrder: string[] = [];
    const seenCclass = new Set<string>();
    for (const item of classKeys) {
        if (!seenCclass.has(item.cclass)) {
            seenCclass.add(item.cclass);
            cclassOrder.push(item.cclass);
        }
    }
    const groupedClassKeys = cclassOrder.map((cc) => ({
        cclass: cc,
        classes: classesByCclass.get(cc)!,
    }));
    const columnKeys = groupedClassKeys.flatMap((g) => g.classes);

    const baseHeads = baseIndices.map((index) => ({...head[index]}));
    const measureFieldId = String(head[valueIndex]?.id ?? 'column1');
    const classHeads = groupedClassKeys.map((group) => ({
        id: `pre_sale_${group.cclass}`,
        name: group.cclass,
        type: 'text' as const,
        custom: {
            profilePreSalePeriodMatrixSkin: true,
            preSaleHeaderTier: 'classParent',
        },
        sub: group.classes.map((item) => ({
            id: `pre_sale_${item.key}`,
            name: item.klass,
            type: 'number' as const,
            view: 'number' as const,
            width: '26px',
            formatter: {precision: 0},
            custom: {
                preSaleHeaderTier: 'classLeaf',
            },
        })),
    }));
    const totalHead = {
        id: 'pre_sale_total',
        name: 'Итого',
        type: 'number' as const,
        view: 'number' as const,
        width: '54px',
        formatter: {precision: 0},
    };

    const wrappedBases = baseHeads.map(wrapPreSaleMatrixDimHead);
    const wrappedTotal = wrapPreSaleMatrixTotalHead(totalHead as TableHead);

    head.splice(0, head.length, ...wrappedBases, ...classHeads, wrappedTotal);

    const classColumnCount = columnKeys.length;
    const totalValues = new Array(classColumnCount).fill(0) as number[];
    const outputRows: TableCellsRow[] = [];
    const groupsByDate = new Map<string, Array<(typeof rowGroups extends Map<string, infer V> ? V : never)>>();

    [...rowGroups.values()].forEach((group) => {
        const date = group.labels[0] ?? '';
        const list = groupsByDate.get(date) ?? [];
        list.push(group);
        groupsByDate.set(date, list);
    });

    const createMatrixCells = (labels: string[], values: Map<string, number>, isTotal = false) => {
        const valueCells = columnKeys.map((classKey, index) => {
            const value = values.get(classKey.key);
            if (!isTotal && typeof value === 'number') {
                totalValues[index] += value;
            }
            return makeProfileNumberCell(value ?? null, measureFieldId);
        });
        const total = valueCells.reduce((sum, cell) => sum + Number(cell.value || 0), 0);
        return [
            ...baseIndices.map((colIdx, positionInBase) =>
                makeProfileMatrixDimCell(labels[colIdx] ?? '', baseHeads[colIdx] as TableHead | undefined, {
                    firstDimensionColumn: positionInBase === 0,
                }),
            ),
            ...valueCells,
            makeProfileNumberCell(total, measureFieldId),
        ];
    };

    groupsByDate.forEach((dateGroups, date) => {
        const dateStartIndex = outputRows.length;
        dateGroups.forEach((group) => {
            outputRows.push({cells: createMatrixCells(group.labels, group.values)});
        });

        const dateTotals = new Map<string, number>();
        dateGroups.forEach((group) => {
            columnKeys.forEach((classKey) => {
                dateTotals.set(
                    classKey.key,
                    (dateTotals.get(classKey.key) ?? 0) + (group.values.get(classKey.key) ?? 0),
                );
            });
        });
        outputRows.push({
            cells: createMatrixCells([date, 'Итого', '', ''], dateTotals, true),
        });

        const rowSpan = outputRows.length - dateStartIndex;
        const firstDateCell = outputRows[dateStartIndex]?.cells[0] as TableCommonCell | undefined;
        if (firstDateCell && rowSpan > 1) {
            firstDateCell.rowSpan = rowSpan;
            for (let rowIndex = dateStartIndex + 1; rowIndex < outputRows.length; rowIndex++) {
                const coveredDateCell = outputRows[rowIndex]?.cells[0] as TableCommonCell | undefined;
                if (coveredDateCell) {
                    coveredDateCell.isRowSpanCovered = true;
                }
            }
        }
    });

    const grandTotalMap = new Map<string, number>();
    columnKeys.forEach((classKey, index) => grandTotalMap.set(classKey.key, totalValues[index] ?? 0));
    outputRows.push({cells: createMatrixCells(['Итого', '', '', ''], grandTotalMap, true)});

    rows.splice(0, rows.length, ...outputRows);
    footer?.splice(0, footer.length);
    return true;
}

/**
 * Дерево по дате (+/−): как flat row tree — ключ есть в params.treeState ⇒ группа развёрнута;
 * свёрнутые группы ⇒ одна строка с суммами как у строки «Итого» по дате.
 */
function applyPreSaleMatrixDateTree(args: {
    rows: TableCellsRow[];
    treeExpandedKeys: Set<string>;
}): void {
    const {rows, treeExpandedKeys} = args;
    if (!rows.length) {
        return;
    }

    const dateExpanded = (dateKey: string) => treeExpandedKeys.has(dateKey);

    const cloneStrippedMeta = (cell: TableCellsRow['cells'][number]): TableCommonCell => {
        if (!cell || typeof cell !== 'object') {
            return {value: ''};
        }
        const src = cell as TableCommonCell;
        const next = {...src};
        delete next.rowSpan;
        delete next.isRowSpanCovered;
        delete next.treeNode;
        delete next.treeOffset;
        delete next.treeNodeState;
        return next;
    };

    const nextRows: TableCellsRow[] = [];
    let i = 0;

    while (i < rows.length) {
        const row = rows[i];
        const cell0 = row.cells[0];
        const common0 =
            cell0 && typeof cell0 === 'object' ? (cell0 as TableCommonCell) : undefined;

        const isGrandTotal =
            Boolean(common0) &&
            !common0!.isRowSpanCovered &&
            /^итого$/i.test(cellTextValue(cell0).trim()) &&
            cellTextValue(row.cells[1]).trim() === '';

        if (isGrandTotal) {
            nextRows.push(row);
            i += 1;
            continue;
        }

        if (!common0 || common0.isRowSpanCovered) {
            i += 1;
            continue;
        }

        const span =
            typeof common0.rowSpan === 'number' && common0.rowSpan > 1 ? common0.rowSpan : 1;
        const slice = rows.slice(i, i + span);

        if (span < 2) {
            slice.forEach((r) => nextRows.push(r));
            i += span;
            continue;
        }

        const dateDisplay = cellTextValue(slice[0].cells[0]).trim();
        const dateKey = JSON.stringify([dateDisplay]);
        const footerRow = slice[slice.length - 1];

        if (!dateExpanded(dateKey)) {
            /*
             * Колонку даты берём из первой строки группы (как у якоря при развороте), не из строки «Итого»:
             * иначе TreeCell наследует другие meta/formattedValue/css → дата визуально смещается при +/- .
             */
            const anchorFirstCell = slice[0].cells[0] as TableCommonCell;
            const collapsedCells = footerRow.cells.map((cell, idx) => {
                if (idx === 0) {
                    const base = cloneStrippedMeta(anchorFirstCell);
                    base.treeNode = dateKey;
                    base.treeOffset = 1;
                    base.treeNodeState = 'closed';
                    base.value = dateDisplay;
                    delete base.formattedValue;
                    return base;
                }
                const base = cloneStrippedMeta(cell);
                if (idx === 1) {
                    base.value = 'Итого';
                } else if (idx === 2 || idx === 3) {
                    base.value = '';
                }
                return base;
            });
            nextRows.push({cells: collapsedCells});
            i += span;
            continue;
        }

        const anchorCell = slice[0].cells[0] as TableCommonCell;
        anchorCell.treeNode = dateKey;
        anchorCell.treeOffset = 1;
        anchorCell.treeNodeState = 'open';

        slice.forEach((r) => nextRows.push(r));
        i += span;
    }

    rows.splice(0, rows.length, ...nextRows);
}

function applyPreSalePeriodFlatProfile(args: {
    head: TableHead[];
    rows: TableCellsRow[];
    footer?: TableCellsRow[];
    treeExpandedKeys: Set<string>;
}): boolean {
    const {head, rows, footer, treeExpandedKeys} = args;
    const matrixApplied = applyPreSalePeriodClassMatrix({head, rows, footer});
    if (!matrixApplied) {
        applyPreSalePeriodHeaderGroups(head);
        head.forEach((cell, index) => {
            const title = normalizeFlatTitle((cell as {name?: string}).name);
            (cell as any).css = {
                ...((cell as any).css || {}),
                backgroundColor: PRE_SALE_HEADER_BG,
                color: PROFILE_TABLE_HEADER_TEXT,
                borderColor: PROFILE_TABLE_GRID,
                fontWeight: 700,
                textAlign: index <= 3 ? 'left' : 'center',
            };
            if (index === 0) {
                (cell as any).width = '76px';
            } else if (index === 1) {
                (cell as any).width = '88px';
            } else if (index === 2 || index === 3) {
                (cell as any).width = '52px';
            } else if (isPreSaleValueTitle(title)) {
                (cell as any).width = '56px';
            } else {
                (cell as any).width = '26px';
            }
            const subColumns = (cell as {sub?: TableHead[]}).sub;
            subColumns?.forEach((subCell) => {
                (subCell as any).css = {
                    ...((subCell as any).css || {}),
                    backgroundColor: PRE_SALE_SUBHEADER_BG,
                    color: PROFILE_TABLE_HEADER_TEXT,
                    borderColor: PROFILE_TABLE_GRID,
                    fontWeight: 700,
                    textAlign: 'center',
                };
                (subCell as any).width = (subCell as any).width ?? '26px';
            });
        });
        rows.forEach((row) => {
            row.cells.forEach((cell, index) => {
                if (!cell || typeof cell === 'string') {
                    return;
                }
                const common = cell as TableCommonCell;
                const isGrandTotalRow = /^итого$/i.test(cellTextValue(row.cells[0]).trim());
                const isDateTotalRow = /^итого$/i.test(cellTextValue(row.cells[1]).trim());
                const isTotalRow = isGrandTotalRow || isDateTotalRow;
                common.css = {
                    ...((common.css as Record<string, unknown>) || {}),
                    borderColor: PROFILE_TABLE_GRID,
                    ...(isTotalRow
                        ? {
                              backgroundColor: index <= 3 ? PRE_SALE_HEADER_BG : PRE_SALE_TOTAL_BG,
                              color: index <= 3 ? PROFILE_TABLE_HEADER_TEXT : PRE_SALE_TEXT,
                              fontWeight: 700,
                              textAlign: index <= 3 ? 'left' : 'right',
                          }
                        : index <= 3
                          ? {
                                backgroundColor: index <= 1 ? PRE_SALE_SUBHEADER_BG : PRE_SALE_LABEL_BG,
                                color: index <= 1 ? PROFILE_TABLE_HEADER_TEXT : PROFILE_TABLE_LABEL_TEXT,
                                fontWeight: 600,
                                textAlign: 'left',
                            }
                          : {
                                backgroundColor: '#ffffff',
                                color: PRE_SALE_TEXT,
                                textAlign: 'right',
                            }),
                };
            });
        });
        footer?.forEach((row) => {
            row.cells.forEach((cell) => {
                if (!cell || typeof cell === 'string') {
                    return;
                }
                const common = cell as TableCommonCell;
                common.css = {
                    ...((common.css as Record<string, unknown>) || {}),
                    backgroundColor: PRE_SALE_HEADER_BG,
                    color: PROFILE_TABLE_HEADER_TEXT,
                    borderColor: PROFILE_TABLE_GRID,
                    fontWeight: 700,
                };
            });
        });

        return matrixApplied;
    }

    applyPreSaleMatrixDateTree({rows, treeExpandedKeys});
    applyPreSalePeriodMatrixHeadStyles(head);
    applyPreSalePeriodMatrixHeadWidths(head);
    applyPreSalePeriodMatrixBodyStyles(rows);
    footer?.forEach((row) => {
        row.cells.forEach((cell) => {
            if (!cell || typeof cell === 'string') {
                return;
            }
            const common = cell as TableCommonCell;
            common.css = {
                ...((common.css as Record<string, unknown>) || {}),
                borderColor: PRE_SALE_MATRIX_GRID,
            };
        });
    });

    return matrixApplied;
}

function applyGroupBookingsTableProfile(args: {head: TableHead[]; rows: TableCellsRow[]}) {
    const {head, rows} = args;
    const rightWideColumnStart = Math.max(head.length - 2, 0);

    const cellComparableValue = (cell: TableCellsRow['cells'][number]) => {
        if (!cell || typeof cell === 'string') {
            return '';
        }
        const common = cell as TableCommonCell;
        const raw = common.value ?? common.formattedValue ?? '';
        return String(raw).trim();
    };
    const applyGroupedRowSpan = (mergeColumnCount: number) => {
        for (let columnIndex = 0; columnIndex < mergeColumnCount; columnIndex++) {
            let startRowIndex = 0;
            while (startRowIndex < rows.length) {
                const startValue = cellComparableValue(rows[startRowIndex]?.cells[columnIndex]);
                if (!startValue) {
                    startRowIndex += 1;
                    continue;
                }

                let endRowIndex = startRowIndex + 1;
                while (endRowIndex < rows.length) {
                    const nextValue = cellComparableValue(rows[endRowIndex]?.cells[columnIndex]);
                    const hasSamePrefix = Array.from({length: columnIndex}).every((_, prefixIndex) => {
                        return (
                            cellComparableValue(rows[startRowIndex]?.cells[prefixIndex]) ===
                            cellComparableValue(rows[endRowIndex]?.cells[prefixIndex])
                        );
                    });

                    if (nextValue !== startValue || !hasSamePrefix) {
                        break;
                    }
                    endRowIndex += 1;
                }

                const span = endRowIndex - startRowIndex;
                if (span > 1) {
                    const firstCell = rows[startRowIndex]?.cells[columnIndex] as TableCommonCell;
                    if (firstCell) {
                        firstCell.rowSpan = span;
                    }
                    for (let rowIndex = startRowIndex + 1; rowIndex < endRowIndex; rowIndex++) {
                        const coveredCell = rows[rowIndex]?.cells[columnIndex] as TableCommonCell;
                        if (coveredCell) {
                            coveredCell.isRowSpanCovered = true;
                        }
                    }
                }

                startRowIndex = endRowIndex;
            }
        }
    };

    head.forEach((cell, index) => {
        const title = normalizeFlatTitle((cell as {name?: string}).name);
        const isDateColumn = title === 'дата' || title === 'date' || title === 'column1';
        const isRightWideColumn = index >= rightWideColumnStart;
        const isTicketsColumn = index === head.length - 2;
        const isTotalPassengersColumn = index === head.length - 1;
        const columnWidthWeight = isTicketsColumn ? 1.39 : isTotalPassengersColumn ? 1.08 : 1;
        const headerPadLeft = index === 0 ? '5px' : '4px';
        (cell as any).css = {
            ...((cell as any).css || {}),
            backgroundColor: GB_HEADER_BG,
            color: PROFILE_TABLE_HEADER_TEXT,
            borderColor: GB_BORDER,
            fontWeight: 700,
            textAlign: isRightWideColumn ? 'right' : 'left',
            paddingLeft: headerPadLeft,
            paddingRight: isRightWideColumn ? '5px' : '6px',
            verticalAlign: 'middle',
        };
        (cell as any).custom = {
            ...((cell as any).custom || {}),
            profileGroupBookingsSkin: true,
            profileGroupBookingsColumn: true,
            profileGroupBookingsWeight: columnWidthWeight,
            profileGroupBookingsDateColumn: isDateColumn,
            profileGroupBookingsRightWideColumn: isRightWideColumn,
        };
        if (!isRightWideColumn) {
            (cell as any).group = true;
        }
    });

    applyGroupedRowSpan(rightWideColumnStart);

    rows.forEach((row) => {
        row.cells.forEach((cell, index) => {
            if (!cell || typeof cell === 'string') {
                return;
            }
            const isRightWideColumn = index >= rightWideColumnStart;
            const common = cell as TableCommonCell;
            const rowSpanNum =
                typeof common.rowSpan === 'number' && common.rowSpan > 1 ? common.rowSpan : 1;
            /*
             * Объединённые по вертикали ячейки 1–4 колонок: middle растягивает текст по всей высоте блока.
             * top + paddingTop подгоняет базовую линию к одной строке с колонками 5–10 на первой строке группы.
             */
            const mergedLeadColumn = index <= 3 && rowSpanNum > 1;
            const bg =
                index === 0
                    ? GB_BODY_COL1_BG
                    : index === 1
                      ? GB_BODY_COL2_BG
                      : index >= 2 && index <= 7
                        ? GB_BODY_COL3_8_BG
                        : GB_BODY_WHITE;
            const bodyTextColor =
                index === 0
                    ? GB_BODY_COL1_TEXT
                    : index === 1
                      ? GB_BODY_COL2_TEXT
                      : index >= 2 && index <= 7
                        ? GB_BODY_COL3_8_TEXT
                        : GB_BODY_NUMERIC_TEXT;
            common.css = {
                ...((common.css as Record<string, unknown>) || {}),
                borderColor: GB_BORDER,
                verticalAlign: mergedLeadColumn ? 'top' : 'middle',
                ...(isRightWideColumn
                    ? {
                          backgroundColor: GB_BODY_WHITE,
                          color: bodyTextColor,
                          fontWeight: 400,
                          textAlign: 'right',
                          justifyContent: 'flex-end',
                          paddingLeft: '6px',
                          paddingRight: '6px',
                      }
                    : {
                          backgroundColor: bg,
                          color: bodyTextColor,
                          fontWeight: 700,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          paddingLeft: '4.5px',
                          paddingRight: '6px',
                          ...(mergedLeadColumn ? {paddingTop: '7px'} : {}),
                      }),
            };
        });
    });
}

function applyFlatTableCustomization(args: {
    head: TableHead[];
    rows: TableCellsRow[];
    footer?: TableCellsRow[];
    tableCustomization?: FlatTableCustomizationInput;
}) {
    const {head, rows, footer, tableCustomization} = args;
    if (!tableCustomization) {
        return;
    }
    reorderFlatTableColumnsByCustomization({head, rows, footer, tableCustomization});
    const stylePriority =
        tableCustomization.stylePriority || (['preset', 'zone', 'rule', 'column'] as const);
    const densityDefaults =
        tableCustomization.densityProfile === 'compact'
            ? {rowHeight: 22, fontSize: 12, paddingX: 4}
            : tableCustomization.densityProfile === 'legacy-desktop'
              ? {rowHeight: 20, fontSize: 11, paddingX: 3}
              : {rowHeight: 28, fontSize: 13, paddingX: 6};
    const thresholdRules =
        tableCustomization.thresholdPack === 'zpk-traffic'
            ? [
                  {op: 'lt', value: 60, bg: '#ff6347', color: '#ffffff'},
                  {op: 'between', value: 60, valueTo: 79, bg: '#ffff00', color: '#1a1a2e'},
                  {op: 'gt', value: 79, bg: '#92d050', color: '#1a1a2e'},
              ]
            : tableCustomization.thresholdPack === 'kpi-soft'
              ? [
                    {op: 'lt', value: 0, bg: '#fde2e2', color: '#8f1d1d'},
                    {op: 'gt', value: 0, bg: '#e2f6e9', color: '#125a2a'},
                ]
              : [];
    const activeRules =
        tableCustomization.conditionalRules && tableCustomization.conditionalRules.length
            ? tableCustomization.conditionalRules
            : thresholdRules;
    const mergeByPriority = (layers: Record<string, Record<string, unknown>>) => {
        return stylePriority.reduce(
            (acc, key) => ({...acc, ...(layers[key] || {})}),
            {} as Record<string, unknown>,
        );
    };
    const evaluateCondition = (
        rawValue: unknown,
        rule: {
            op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
            value?: string | number;
            valueTo?: string | number;
        },
    ) => {
        const text = String(rawValue ?? '');
        const numberValue = Number(rawValue);
        const left = Number(rule.value);
        const right = Number(rule.valueTo);
        switch (rule.op) {
            case 'gt':
                return !Number.isNaN(numberValue) && !Number.isNaN(left) && numberValue > left;
            case 'lt':
                return !Number.isNaN(numberValue) && !Number.isNaN(left) && numberValue < left;
            case 'eq':
                return text === String(rule.value ?? '');
            case 'between':
                return (
                    !Number.isNaN(numberValue) &&
                    !Number.isNaN(left) &&
                    !Number.isNaN(right) &&
                    numberValue >= left &&
                    numberValue <= right
                );
            case 'contains':
                return text.toLowerCase().includes(String(rule.value ?? '').toLowerCase());
            default:
                return false;
        }
    };
    const evaluateRule = (
        rawValue: unknown,
        rule: {
            op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
            value?: string | number;
            valueTo?: string | number;
            logic?: 'AND' | 'OR';
            conditions?: Array<{
                op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                value?: string | number;
                valueTo?: string | number;
            }>;
        },
    ) => {
        const conditions = Array.isArray(rule.conditions) && rule.conditions.length
            ? rule.conditions
            : [rule];
        return rule.logic === 'OR'
            ? conditions.some((c) => evaluateCondition(rawValue, c))
            : conditions.every((c) => evaluateCondition(rawValue, c));
    };
    const formatByMask = (num: number, mask: string) => {
        const parts = mask.split(';');
        const activeMask =
            num < 0 && parts[1] ? parts[1] : num === 0 && parts[2] ? parts[2] : parts[0] || mask;
        const normalized = activeMask.replace(/\[[^\]]+\]/g, '');
        const decimalPart = normalized.split('.')[1] || '';
        const fractionDigits = decimalPart.replace(/[^0#]/g, '').length;
        const useGrouping = normalized.includes(',');
        const abs = Math.abs(num);
        const formatted = new Intl.NumberFormat(tableCustomization.locale || 'ru-RU', {
            minimumFractionDigits: decimalPart.includes('0') ? fractionDigits : 0,
            maximumFractionDigits: fractionDigits,
            useGrouping,
        }).format(abs);
        const signed = num < 0 ? `-${formatted}` : formatted;
        return normalized.includes('{value}')
            ? normalized.replace('{value}', signed)
            : normalized.replace(/[#0,\.]+/, signed);
    };
    // Do not physically remove header rows: some table renderers rely on head structure.
    // Порядок: скрытие/упорядочивание колонок → оформление листьев.
    applyFlatTableHeaderVisuals({head, tableCustomization, densityDefaults});
    rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, colIndex) => {
            if (!cell || typeof cell === 'string') {
                return;
            }
            const colStyle = tableCustomization.columnStyles?.[String(colIndex)] || {};
            const fieldId = (cell as TableCommonCell).fieldId;
            const semanticSlot = fieldId ? tableCustomization.semanticSlots?.[fieldId] : undefined;
            const semanticStyle = semanticSlot
                ? tableCustomization.semanticSlotStyles?.[semanticSlot]
                : undefined;
            const matchedRule = ((activeRules || []) as Array<any>).find((rule: any) =>
                (!rule.targetZone || rule.targetZone === 'body') &&
                (!rule.targetFields?.length || (fieldId && rule.targetFields.includes(fieldId))) &&
                (!rule.contextContains ||
                    String((cell as TableCommonCell).value ?? '')
                        .toLowerCase()
                        .includes(rule.contextContains.toLowerCase())) &&
                (!rule.contextDateFrom ||
                    Number(new Date((cell as TableCommonCell).value as any)) >=
                        Number(new Date(rule.contextDateFrom))) &&
                (!rule.contextDateTo ||
                    Number(new Date((cell as TableCommonCell).value as any)) <=
                        Number(new Date(rule.contextDateTo))) &&
                evaluateRule((cell as TableCommonCell).value, rule as any),
            );
            const formatPreset = fieldId ? tableCustomization.columnFormats?.[fieldId] : undefined;
            const customMask = fieldId ? tableCustomization.customNumberMasks?.[fieldId] : undefined;
            if (formatPreset && typeof (cell as TableCommonCell).value === 'number') {
                const num = Number((cell as TableCommonCell).value);
                if (!Number.isNaN(num)) {
                    if (formatPreset === 'integer') {
                        (cell as TableCommonCell).formattedValue = new Intl.NumberFormat(
                            tableCustomization.locale || 'ru-RU',
                            {maximumFractionDigits: 0},
                        ).format(num);
                    } else if (formatPreset === 'percent1') {
                        (cell as TableCommonCell).formattedValue = `${num.toFixed(1)}%`;
                    } else if (formatPreset === 'currency0') {
                        (cell as TableCommonCell).formattedValue = new Intl.NumberFormat(
                            tableCustomization.locale || 'ru-RU',
                            {
                                style: 'currency',
                                currency: tableCustomization.currency || 'RUB',
                                maximumFractionDigits: 0,
                            },
                        ).format(num);
                    }
                }
            }
            if (customMask && typeof (cell as TableCommonCell).value === 'number') {
                const num = Number((cell as TableCommonCell).value);
                if (!Number.isNaN(num)) {
                    (cell as TableCommonCell).formattedValue = formatByMask(num, customMask).replace(
                        '{suffix}',
                        tableCustomization.suffix || '',
                    );
                }
            } else if (
                tableCustomization.suffix &&
                typeof (cell as TableCommonCell).formattedValue === 'string'
            ) {
                (cell as TableCommonCell).formattedValue =
                    `${(cell as TableCommonCell).formattedValue} ${tableCustomization.suffix}`;
            }
            if ((cell as TableCommonCell).value === null || (cell as TableCommonCell).value === '') {
                if (tableCustomization.emptyCellPolicy === 'zero') {
                    (cell as TableCommonCell).value = 0;
                    (cell as TableCommonCell).formattedValue = '0';
                } else if (tableCustomization.emptyCellPolicy === 'dash') {
                    (cell as TableCommonCell).value = '-';
                    (cell as TableCommonCell).formattedValue = '-';
                }
            }
            const zoneLayer = {
                ...(tableCustomization.bodyBg ? {backgroundColor: tableCustomization.bodyBg} : {}),
                ...(rowIndex % 2 === 0 && tableCustomization.zebraEvenBg
                    ? {backgroundColor: tableCustomization.zebraEvenBg}
                    : {}),
                ...(rowIndex % 2 === 1 && tableCustomization.zebraOddBg
                    ? {backgroundColor: tableCustomization.zebraOddBg}
                    : {}),
                ...(tableCustomization.bodyColor ? {color: tableCustomization.bodyColor} : {}),
                ...(tableCustomization.borderColor ? {borderColor: tableCustomization.borderColor} : {}),
                ...(tableCustomization.bodyBorderColor
                    ? {borderColor: tableCustomization.bodyBorderColor}
                    : {}),
                ...(typeof tableCustomization.bodyFontSize === 'number'
                    ? {fontSize: `${tableCustomization.bodyFontSize}px`}
                    : {fontSize: `${densityDefaults.fontSize}px`}),
                ...(tableCustomization.bodyFontWeight
                    ? {fontWeight: tableCustomization.bodyFontWeight}
                    : {}),
                ...(tableCustomization.bodyAlign ? {textAlign: tableCustomization.bodyAlign} : {}),
                ...(typeof tableCustomization.cellPaddingX === 'number'
                    ? {
                          paddingLeft: `${tableCustomization.cellPaddingX}px`,
                          paddingRight: `${tableCustomization.cellPaddingX}px`,
                      }
                    : {
                          paddingLeft: `${densityDefaults.paddingX}px`,
                          paddingRight: `${densityDefaults.paddingX}px`,
                      }),
                ...(typeof tableCustomization.rowHeight === 'number'
                    ? {
                          height: `${tableCustomization.rowHeight}px`,
                          lineHeight: `${Math.max(12, tableCustomization.rowHeight - 6)}px`,
                      }
                    : {
                          height: `${densityDefaults.rowHeight}px`,
                          lineHeight: `${Math.max(12, densityDefaults.rowHeight - 6)}px`,
                      }),
            };
            const ruleLayer = {
                ...(matchedRule?.bg ? {backgroundColor: matchedRule.bg} : {}),
                ...(matchedRule?.color ? {color: matchedRule.color} : {}),
            };
            const columnLayer = {
                ...(colStyle.bg ? {backgroundColor: colStyle.bg} : {}),
                ...(colStyle.color ? {color: colStyle.color} : {}),
                ...(colStyle.align ? {textAlign: colStyle.align} : {}),
                ...(colStyle.fontWeight ? {fontWeight: colStyle.fontWeight} : {}),
                ...(semanticStyle?.bg ? {backgroundColor: semanticStyle.bg} : {}),
                ...(semanticStyle?.color ? {color: semanticStyle.color} : {}),
                ...(semanticStyle?.align ? {textAlign: semanticStyle.align} : {}),
                ...(semanticStyle?.fontWeight ? {fontWeight: semanticStyle.fontWeight} : {}),
            };
            (cell as TableCommonCell).css = {
                ...(((cell as TableCommonCell).css as Record<string, unknown>) || {}),
                ...mergeByPriority({preset: {}, zone: zoneLayer, rule: ruleLayer, column: columnLayer}),
            };
        });
    });
    footer?.forEach((footerRow) => {
        footerRow?.cells?.forEach((cell, index) => {
            if (!cell || typeof cell === 'string') {
                return;
            }
            const colStyle = tableCustomization.columnStyles?.[String(index)] || {};
            const fieldId = (cell as TableCommonCell).fieldId;
            const matchedRule = ((tableCustomization.conditionalRules || []) as Array<any>).find(
                (rule: any) =>
                (!rule.targetZone || rule.targetZone === 'footer' || rule.targetZone === 'total') &&
                (!rule.targetFields?.length || (fieldId && rule.targetFields.includes(fieldId))) &&
                evaluateRule((cell as TableCommonCell).value, rule as any),
            );
            (cell as TableCommonCell).css = {
                ...(((cell as TableCommonCell).css as Record<string, unknown>) || {}),
                ...(tableCustomization.footerBg ? {backgroundColor: tableCustomization.footerBg} : {}),
                ...(tableCustomization.footerColor ? {color: tableCustomization.footerColor} : {}),
                ...(colStyle.bg ? {backgroundColor: colStyle.bg} : {}),
                ...(colStyle.color ? {color: colStyle.color} : {}),
                ...(matchedRule?.bg ? {backgroundColor: matchedRule.bg} : {}),
                ...(matchedRule?.color ? {color: matchedRule.color} : {}),
                ...(tableCustomization.borderColor ? {borderColor: tableCustomization.borderColor} : {}),
                ...(tableCustomization.footerBorderColor
                    ? {borderColor: tableCustomization.footerBorderColor}
                    : {}),
                ...(tableCustomization.totalBorderColor && index === footerRow.cells.length - 1
                    ? {borderColor: tableCustomization.totalBorderColor}
                    : {}),
                ...(typeof tableCustomization.footerFontSize === 'number'
                    ? {fontSize: `${tableCustomization.footerFontSize}px`}
                    : {}),
                ...(tableCustomization.footerFontWeight
                    ? {fontWeight: tableCustomization.footerFontWeight}
                    : {}),
                ...(colStyle.align ? {textAlign: colStyle.align} : {}),
                ...(colStyle.fontWeight ? {fontWeight: colStyle.fontWeight} : {}),
                ...(tableCustomization.footerAlign ? {textAlign: tableCustomization.footerAlign} : {}),
                ...(typeof tableCustomization.cellPaddingX === 'number'
                    ? {
                          paddingLeft: `${tableCustomization.cellPaddingX}px`,
                          paddingRight: `${tableCustomization.cellPaddingX}px`,
                      }
                    : {}),
                ...(typeof tableCustomization.rowHeight === 'number'
                    ? {
                          height: `${tableCustomization.rowHeight}px`,
                          lineHeight: `${Math.max(12, tableCustomization.rowHeight - 6)}px`,
                      }
                    : {}),
            };
        });
    });
    if (tableCustomization.showFooter === false || tableCustomization.showTotals === false) {
        footer?.splice(0, footer.length);
    }
}

function enhanceFlatTableRowTreeHead(cell: TableHead, enabled: boolean): TableHead {
    if (!enabled) {
        return cell;
    }
    const base = cell as TableHead & {css?: object; custom?: Record<string, unknown>};
    return {
        ...cell,
        width: undefined,
        css: {...(typeof base.css === 'object' ? base.css : {}), ...FLAT_TREE_HDR},
        custom: {...(base.custom || {}), tableHeaderAlign: 'left'},
    };
}

function flatTableRowTreeBodyCellCss(
    item: {
        guid: string;
        isNumericalDataType: boolean;
    },
    rowMeta: FlatTableRowTreeRowMeta,
    flightGuid: string,
    segmentGuid: string,
): Record<string, string> | undefined {
    const isFlight = item.guid === flightGuid;
    const isSegment = item.guid === segmentGuid;
    const semi = '600';
    const segPad = 'calc(5px - 0.82px)';
    const sameFont = 'var(--dl-table-font-size, 13px)';
    /** Числа мер на строках сегмента (белый фон) — едва крупнее базового */
    const segmentRowMeasureNumberFont = 'calc(var(--dl-table-font-size, 13px) + 0.4px)';
    /** Рейс: чуть крупнее сегмента (дополняет +0.55px в .tree-cell__value) */
    const flightFont = 'calc(var(--dl-table-font-size, 13px) + 0.5px)';
    /** Числа на строках «Всего» — чуть крупнее базового, но чуть меньше строк сегментов */
    const totalRowNumberFont = 'calc(var(--dl-table-font-size, 13px) + 1.25px)';

    if (rowMeta.kind === 'parent' || rowMeta.kind === 'groupFooter') {
        if (isSegment) {
            return {
                backgroundColor: FLAT_TREE_BAND_BG,
                color: FLAT_TREE_TEXT_ON_BAND,
                fontWeight: semi,
                fontSize: sameFont,
                textAlign: 'left',
                verticalAlign: 'top',
                paddingLeft: segPad,
                paddingTop: '2px',
            };
        }
        if (isFlight) {
            return {
                backgroundColor: FLAT_TREE_BAND_BG,
                color: FLAT_TREE_TEXT_ON_BAND,
                fontWeight: semi,
                fontSize: flightFont,
                textAlign: 'left',
                verticalAlign: 'top',
                paddingLeft: '2px',
                paddingTop: '2px',
            };
        }
        if (item.isNumericalDataType) {
            return {
                backgroundColor: FLAT_TREE_BAND_BG,
                color: FLAT_TREE_TOTAL_ROW_NUMBER_COLOR,
                fontWeight: semi,
                fontSize: totalRowNumberFont,
                textAlign: 'right',
                verticalAlign: 'top',
                paddingTop: '2px',
                /* 2px было на 1px правее сегмента; +0.5px отступа справа → цифры на 0.5px левее */
                paddingRight: '2.5px',
            };
        }
        return {
            backgroundColor: FLAT_TREE_BAND_BG,
            color: FLAT_TREE_TEXT_ON_BAND,
            fontWeight: semi,
            fontSize: sameFont,
            textAlign: 'left',
            verticalAlign: 'top',
            paddingLeft: '4px',
            paddingTop: '2px',
        };
    }

    if (rowMeta.kind === 'child') {
        if (isFlight) {
            return {
                backgroundColor: FLAT_TREE_BAND_BG,
                color: FLAT_TREE_TEXT_ON_BAND,
                fontWeight: semi,
                fontSize: flightFont,
                textAlign: 'left',
                verticalAlign: 'top',
                paddingLeft: '2px',
                paddingTop: '2px',
            };
        }
        if (isSegment) {
            return {
                backgroundColor: FLAT_TREE_SEG_BG,
                color: FLAT_TREE_SEG_COLUMN_COLOR,
                fontWeight: semi,
                fontSize: sameFont,
                textAlign: 'left',
                verticalAlign: 'middle',
                paddingLeft: segPad,
            };
        }
        if (item.isNumericalDataType) {
            return {
                backgroundColor: FLAT_TREE_MEASURE_BG,
                color: FLAT_TREE_TEXT_ON_WHITE,
                fontWeight: 'normal',
                fontSize: segmentRowMeasureNumberFont,
                textAlign: 'right',
                verticalAlign: 'bottom',
            };
        }
        return {
            backgroundColor: FLAT_TREE_MEASURE_BG,
            color: FLAT_TREE_TEXT_ON_WHITE,
            fontWeight: 'normal',
            fontSize: sameFont,
            textAlign: 'left',
            verticalAlign: 'bottom',
        };
    }

    return undefined;
}

function prepareFlatTable({
    placeholders,
    resultData,
    colors,
    idToTitle,
    idToDataType,
    colorsConfig,
    shared,
    ChartEditor,
    fields,
    defaultColorPaletteId,
}: PrepareFunctionArgs) {
    const {drillDownData} = shared.sharedData;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnable = widgetConfig?.actionParams?.enable;
    const treeSet = new Set(getTreeState(ChartEditor.getParams()));
    const pinnedColumns = shared.extraSettings?.pinnedColumns || 0;

    const currentActiveDrillDownField: Field | undefined =
        drillDownData && drillDownData.fields[drillDownData.level];

    let currentActiveDrillDownFieldIndex = -1;

    const {data, order, legend} = resultData;
    const totals = resultData.totals;

    // Columns
    const columns = placeholders[0].items;
    const widgetTitle =
        typeof (widgetConfig as {title?: unknown} | undefined)?.title === 'object'
            ? String(((widgetConfig as {title?: {text?: unknown}}).title || {}).text ?? '')
            : String((widgetConfig as {title?: unknown} | undefined)?.title ?? '');
    const columnProfileHints = columns.flatMap((item) => [
        String(item.fakeTitle ?? ''),
        String(item.title ?? ''),
        String(idToTitle[item.guid] ?? ''),
        String(item.guid ?? ''),
    ]);
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings: shared.extraSettings as Record<string, unknown>,
        titleHints: [
            String((shared as any).title ?? ''),
            widgetTitle,
            ...columnProfileHints,
        ],
        headerFieldHints: columnProfileHints,
    });
    const customizationBehavior = getVisualizationCustomizationBehaviorFlags(customizationProfile);
    const isPreSalePeriodFlatProfile =
        customizationProfile === VisualizationCustomizationProfile.PreSalePeriod ||
        customizationBehavior.enablePreSalePeriodFlatTreePreset;
    const isGroupBookingsTableProfile = customizationBehavior.enableGroupBookingsTablePreset;
    const profileFlatTreeSettings = customizationBehavior.enableFlightSegmentsLoadFlatTreePreset
        ? (() => {
              const guids = resolveFlatTreePresetFieldGuids({columns, idToTitle});
              if (!guids) {
                  return undefined;
              }
              return {
                  enabled: true,
                  flightFieldGuid: guids.flightFieldGuid,
                  segmentFieldGuid: guids.segmentFieldGuid,
                  totalLabel: 'Всего',
              };
          })()
        : undefined;
    const flatTreeSettings = shared.extraSettings?.flatTableRowTree?.enabled
        ? shared.extraSettings.flatTableRowTree
        : profileFlatTreeSettings;
    const flatTableRowTreeOn = flatTreeSettings?.enabled === true;

    // Draw a vertical table
    const head = columns.map((item, index) => {
        const isLastColumn = index === columns.length - 1;
        const actualTitle = item.fakeTitle || idToTitle[item.guid];

        const columnSettings = item.columnSettings;
        const widthSettings = flatTableRowTreeOn ? undefined : columnSettings?.width;

        const headCell: TableHead = {
            id: item.guid,
            name: actualTitle,
            type: 'text',
            width: getColumnWidthValue(widthSettings),
        };

        if (item.hintSettings?.enabled) {
            headCell.hint = item.hintSettings.text;
        }

        if (!isLastColumn && index < pinnedColumns) {
            headCell.pinned = true;
        }

        const dataType = idToDataType[item.guid];

        if (isNumericalDataType(dataType)) {
            const numberHeadCell: TableHead = {
                ...headCell,
                formatter: {},
                type: 'number',
                view: 'number',
            };

            if (isTableBarsSettingsEnabled(item)) {
                const columnValues = columnValuesByColumn[item.guid];
                return {
                    ...numberHeadCell,
                    ...getBarSettingsViewOptions({
                        barsSettings: item.barsSettings,
                        columnValues,
                    }),
                };
            } else {
                // TODO: in theory, this is not necessary, because you need to look at the dataType
                if (isNumberField(item)) {
                    const formatting = getFormatOptions(item);
                    if (formatting) {
                        numberHeadCell.formatter = {
                            format: formatting.format,
                            suffix: formatting.postfix,
                            prefix: formatting.prefix,
                            showRankDelimiter: formatting.showRankDelimiter,
                            unit: formatting.unit,
                        };

                        if (dataType === DATASET_FIELD_TYPES.FLOAT) {
                            numberHeadCell.formatter.precision =
                                formatting.precision ?? MINIMUM_FRACTION_DIGITS;
                        }
                    } else {
                        numberHeadCell.precision =
                            dataType === DATASET_FIELD_TYPES.FLOAT ? MINIMUM_FRACTION_DIGITS : 0;
                    }
                }

                return numberHeadCell;
            }
        } else if (isDateField(item)) {
            const dateHeadCell: TableHead = {
                ...headCell,
                type: 'date',
                format: DEFAULT_DATE_FORMAT,
            };

            if (item.format) {
                dateHeadCell.format = item.format;
            } else if (dataType === 'genericdatetime') {
                dateHeadCell.format = DEFAULT_DATETIME_FORMAT;
            } else if (dataType === 'datetimetz') {
                dateHeadCell.format = DEFAULT_DATETIMETZ_FORMAT;
            }

            const profileDateFormat = getDateFormatForDashboardProfile({
                customizationProfile,
                dataType,
                hasUserFormat: Boolean(item.format),
            });
            if (profileDateFormat) {
                dateHeadCell.format = profileDateFormat;
            }

            return dateHeadCell;
        }

        return headCell;
    }).map((h) => enhanceFlatTableRowTreeHead(h, flatTableRowTreeOn));

    if (currentActiveDrillDownField) {
        const actualTitle =
            idToTitle[currentActiveDrillDownField.guid] || currentActiveDrillDownField.title;

        currentActiveDrillDownFieldIndex = findIndexInOrder(
            order,
            currentActiveDrillDownField,
            actualTitle,
        );
    }

    const iColor = colors.length
        ? findIndexInOrder(order, colors[0], idToTitle[colors[0].guid])
        : -1;

    const preparedColumns = columns.map((item) => {
        const actualTitle = idToTitle[item.guid] || item.title;
        const indexInOrder = findIndexInOrder(order, item, actualTitle);
        const itemDataType = idToDataType[item.guid] || item.data_type;
        return {
            ...item,
            actualTitle,
            indexInOrder,
            itemDataType,
            isMarkupDataType: isMarkupDataType(itemDataType),
            isNumericalDataType: isNumericalDataType(itemDataType),
            isDateType: isDateType(itemDataType),
            isTreeDataType: isTreeDataType(itemDataType),
            isUnsupportedDataType: isUnsupportedDataType(itemDataType),
            isTableBarsSettingsEnabled: isTableBarsSettingsEnabled(item),
            isTableFieldBackgroundSettingsEnabled: isTableFieldBackgroundSettingsEnabled(item),
            canUseFieldForFiltering: isActionParamsEnable && canUseFieldForFiltering(item),
        };
    });

    let tableData: PrepareFunctionDataRow[] = data;
    let flatRowTreeMeta: FlatTableRowTreeRowMeta[] | null = null;
    let flatTableRowTreeHasNestedSegments: boolean | undefined;

    if (flatTreeSettings?.enabled === true) {
        const fts = flatTreeSettings as FlatTableRowTreeSettings & {
            autoClassTotal?: FlatTableRowTreeSettings['autoClassTotal'];
        };
        const treeSettings: FlatTableRowTreeSettings = {
            enabled: true,
            flightFieldGuid: fts.flightFieldGuid,
            segmentFieldGuid: fts.segmentFieldGuid,
            totalLabel: fts.totalLabel,
            autoClassTotal: fts.autoClassTotal,
        };
        const resolvedAutoClassTotal =
            treeSettings.autoClassTotal ??
            inferAutoClassTotalFromFcySequence(
                preparedColumns,
                treeSettings.flightFieldGuid,
                treeSettings.segmentFieldGuid,
            );
        const expanded = expandFlatTableRowsForRowTree({
            data,
            preparedColumns,
            settings: {
                ...treeSettings,
                autoClassTotal: resolvedAutoClassTotal,
            },
            treeExpandedKeys: treeSet,
        });

        if (!expanded.ok) {
            ChartEditor._setError({
                code: 'ERR.CHARTS.FLAT_TABLE_ROW_TREE_CONFIG',
                details: {message: expanded.reason},
            });
        } else {
            tableData = expanded.data as PrepareFunctionDataRow[];
            flatRowTreeMeta = expanded.meta;
            flatTableRowTreeHasNestedSegments = expanded.hasNestedSegments;
        }
    }

    const backgroundColorsByMeasure = getBackgroundColorsMapByContinuousColumn({
        columns,
        idToTitle,
        order,
        data: tableData,
        chartColorsConfig: colorsConfig,
    });

    const columnValuesByColumn = getColumnValuesByColumnWithBarSettings({
        values: tableData,
        totals,
        columns,
        idToTitle,
        order,
    });

    const rows: TableCellsRow[] = tableData.map((values, rowIndex) => {
        // eslint-disable-next-line complexity
        const cells = preparedColumns.map((item) => {
            const value = values[item.indexInOrder];

            const cell: TableCommonCell = {value, fieldId: item.guid};

            if (value === null) {
                cell.value = null;
            } else if (Array.isArray(value)) {
                cell.value = JSON.stringify(value);
            } else if (item.isMarkupDataType) {
                cell.value = value;
                cell.type = 'markup';
            } else if (item.isNumericalDataType) {
                cell.type = 'number';

                if (item.isTableBarsSettingsEnabled) {
                    const columnValues = columnValuesByColumn[item.guid];

                    const barCellProperties = getBarSettingsValue({
                        rowValue: value,
                        field: item,
                        columnValues,
                        isTotalCell: false,
                        availablePalettes: colorsConfig.availablePalettes,
                        loadedColorPalettes: colorsConfig.loadedColorPalettes,
                        defaultColorPaletteId,
                    });

                    cell.value = barCellProperties.value;
                    cell.formattedValue = barCellProperties.formattedValue;
                    (cell as BarTableCell).barColor = barCellProperties.barColor;
                } else {
                    cell.value = Number(value);
                }
            } else if (item.isTreeDataType) {
                if (legend?.length) {
                    const currentLegend = legend[rowIndex][item.indexInOrder];

                    const fieldData = fields.find(
                        (field) => field.legend_item_id === currentLegend,
                    );

                    if (fieldData) {
                        cell.treeNode = String(cell.value);
                        const parsedTreeNode: string[] = JSON.parse(cell.treeNode);
                        cell.treeOffset = parsedTreeNode.length;
                        cell.treeNodeState = treeSet.has(cell.treeNode) ? 'open' : 'closed';
                        cell.value = parsedTreeNode[parsedTreeNode.length - 1];
                    }
                }
            } else if (flatRowTreeMeta && flatTreeSettings?.enabled === true) {
                const rowMeta = flatRowTreeMeta[rowIndex];
                if (item.guid === flatTreeSettings.flightFieldGuid && rowMeta) {
                    if (rowMeta.kind === 'parent') {
                        cell.treeNode = rowMeta.flightTreeKey;
                        cell.treeOffset = 1;
                        cell.treeNodeState = treeSet.has(rowMeta.flightTreeKey)
                            ? 'open'
                            : 'closed';
                        cell.value = rowMeta.flightDisplay;
                    } else if (rowMeta.kind === 'groupFooter') {
                        cell.treeNode = rowMeta.rowTreeKey;
                        cell.treeOffset = 2;
                        cell.value = rowMeta.flightDisplay;
                    } else if (rowMeta.kind === 'child') {
                        if (rowMeta.expandAnchor) {
                            cell.treeNode = rowMeta.flightTreeKey;
                            cell.treeOffset = 1;
                            cell.treeNodeState = treeSet.has(rowMeta.flightTreeKey)
                                ? 'open'
                                : 'closed';
                            cell.value = rowMeta.flightDisplay;
                        } else {
                            cell.treeNode = rowMeta.rowTreeKey;
                            cell.treeOffset = 2;
                            cell.value = rowMeta.flightDisplay;
                        }
                    }
                } else if (
                    item.guid === flatTreeSettings.segmentFieldGuid &&
                    (rowMeta?.kind === 'parent' || rowMeta?.kind === 'groupFooter')
                ) {
                    cell.value = flatTreeSettings.totalLabel ?? 'Всего';
                }
            } else if (item.isUnsupportedDataType) {
                ChartEditor._setError({
                    code: 'ERR.CHARTS.UNSUPPORTED_DATA_TYPE',
                    details: {
                        field: item.actualTitle,
                    },
                });
            }

            if (drillDownData && !item.isMarkupDataType && currentActiveDrillDownFieldIndex >= 0) {
                if (values[currentActiveDrillDownFieldIndex] === null) {
                    cell.drillDownFilterValue = IS_NULL_FILTER_TEMPLATE;
                } else if (typeof values[currentActiveDrillDownFieldIndex] !== 'object') {
                    cell.drillDownFilterValue = String(values[currentActiveDrillDownFieldIndex]);
                }
            }

            if (colors.length) {
                const valueColor = values[iColor];
                if (valueColor !== null || colorsConfig.nullMode === GradientNullModes.AsZero) {
                    cell.color = Number(valueColor);
                }
            }

            if (item.isTableFieldBackgroundSettingsEnabled) {
                cell.css = getFlatTableBackgroundStyles({
                    column: item,
                    order,
                    values,
                    idToTitle,
                    backgroundColorsByMeasure,
                    currentRowIndex: rowIndex,
                    idToDataType,
                    loadedColorPalettes: colorsConfig.loadedColorPalettes,
                    availablePalettes: colorsConfig.availablePalettes,
                    defaultColorPaletteId,
                });
            }

            if (flatRowTreeMeta && flatTreeSettings?.enabled === true) {
                const rowMeta = flatRowTreeMeta[rowIndex];
                const ftCss = flatTableRowTreeBodyCellCss(
                    item,
                    rowMeta,
                    flatTreeSettings.flightFieldGuid,
                    flatTreeSettings.segmentFieldGuid,
                );
                if (ftCss) {
                    cell.css = {...(cell.css || {}), ...ftCss};
                }
            }

            if (isActionParamsEnable) {
                if (item.canUseFieldForFiltering) {
                    if (item.isDateType) {
                        const actionParams = {};
                        addActionParamValue(actionParams, item, value);

                        cell.custom = {actionParams};
                    }
                } else {
                    // Need to add an empty object to exclude the measure field value from the filtering data
                    // (otherwise cell.value will be used by default)
                    cell.custom = {
                        actionParams: {},
                    };
                }
            }

            if (flatRowTreeMeta && flatTreeSettings?.enabled === true) {
                const rowMeta = flatRowTreeMeta[rowIndex];
                if (item.guid === flatTreeSettings.flightFieldGuid) {
                    cell.verticalAlignment = 'top';
                } else if (item.guid === flatTreeSettings.segmentFieldGuid) {
                    cell.verticalAlignment =
                        rowMeta?.kind === 'child' ? 'center' : 'top';
                } else if (
                    item.isNumericalDataType &&
                    rowMeta &&
                    (rowMeta.kind === 'parent' || rowMeta.kind === 'groupFooter')
                ) {
                    /* Итоговые числа — правый верхний угол ячейки */
                    cell.verticalAlignment = 'top';
                } else if (item.isNumericalDataType && rowMeta?.kind === 'child') {
                    cell.verticalAlignment = 'bottom';
                }
            }

            return cell;
        });

        return {
            cells,
        };
    });

    if (flatRowTreeMeta && flatTreeSettings?.enabled === true) {
        applyFlatTreeFlightColumnRowSpan({
            rows,
            meta: flatRowTreeMeta,
            flightFieldGuid: flatTreeSettings.flightFieldGuid,
            preparedColumns,
        });
    }

    if (colors.length) {
        mapAndColorizeTableCells(rows, colorsConfig);
    }

    const page = ChartEditor.getCurrentPage();
    const limit = shared.extraSettings?.limit;
    const paginationDisabled = shared.extraSettings?.pagination !== 'on';

    // Disable the paginator if all the data came initially
    // Disabling the paginator enables front-end sorting (when clicking on the column header)
    const shouldDisablePaginator = page === 1 && limit && limit > tableData.length;

    let footer;

    const oneLineAndPaginationDisabled =
        (paginationDisabled || shouldDisablePaginator) && tableData.length === 1;

    if (!flatRowTreeMeta && !oneLineAndPaginationDisabled && totals.length) {
        footer = getFooter({
            columns,
            idToTitle,
            idToDataType,
            totals,
            ChartEditor,
            order,
            columnValuesByColumn,
            colorsConfig,
            defaultColorPaletteId,
        });
    }
    const rawTableCustomization = (shared.extraSettings as any)?.customization?.table;
    const tableCustomization = rawTableCustomization?.flat ?? rawTableCustomization;
    applyFlatTableCustomization({
        head,
        rows,
        footer,
        tableCustomization,
    });
    let preSaleMatrixApplied = false;
    if (isPreSalePeriodFlatProfile) {
        preSaleMatrixApplied = applyPreSalePeriodFlatProfile({
            head,
            rows,
            footer,
            treeExpandedKeys: treeSet,
        });
    }
    if (isGroupBookingsTableProfile) {
        applyGroupBookingsTableProfile({head, rows});
    }

    const flatTreeSegmentsFlag =
        typeof flatTableRowTreeHasNestedSegments !== 'undefined'
            ? flatTableRowTreeHasNestedSegments
            : preSaleMatrixApplied
              ? true
              : undefined;

    return {
        head,
        rows,
        footer,
        ...(flatTreeSegmentsFlag !== undefined ? {flatTableRowTreeHasNestedSegments: flatTreeSegmentsFlag} : {}),
    };
}

export default prepareFlatTable;
