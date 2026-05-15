import React from 'react';

import type {SortingState} from '@tanstack/react-table';
import block from 'bem-cn-lite';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import {
    DEFAULT_WIDGET_SIZE,
    getVisualizationCustomizationBehaviorFlags,
    hasExplicitVisualizationCustomizationProfile,
    normalizeFlatTableTreeStateList,
    resolveVisualizationCustomizationProfile,
} from 'shared';
import type {
    StringParams,
    TableCell,
    TableCellsRow,
    TableCommonCell,
    TableHead as TableHeadType,
    TableRow,
    WidgetSizeType,
} from 'shared';
import {BackgroundTable} from 'ui/libs/DatalensChartkit/ChartKit/plugins/Table/renderer/components/Table/BackgroundTable';

import {isMacintosh} from '../../../../../../../../utils';
import type {TableWidgetData} from '../../../../../../types';
import Paginator from '../../../../../components/Widget/components/Table/Paginator/Paginator';
import {hasGroups} from '../../../../../components/Widget/components/Table/utils';
import {isCellSelected} from '../../../../../components/Widget/components/Table/utils/action-params';
import {SNAPTER_HTML_CLASSNAME} from '../../../../../components/Widget/components/constants';
import {CHARTKIT_SCROLLABLE_NODE_CLASSNAME} from '../../../../../helpers/constants';
import {i18n} from '../../../../../modules/i18n/i18n';
import type {WidgetDimensions} from '../../types';
import {
    type GetCellActionParamsArgs,
    getCellActionParams,
    getCellCss,
    getCurrentActionParams,
    getDrillDownOptions,
    getUpdatesTreeState,
    mapTableData,
} from '../../utils';
import {
    flatTableRowTreeClickBaseline,
    getFlatTableRowTreeStableBodySignature,
    mergeFlatTableRowTreeBaselineOnSigChange,
    tableDataIsFlatTableRowTreeResponse,
    tableDataLooksLikeBackendPivot,
} from '../../utils/flatTableRowTreeKeys';
import {TableTitleView} from '../TableTitleView/TableTitleView';
import {FlatTableRowTreeToggleContext} from '../TreeCell/FlatTableRowTreeToggleContext';

import {TableBody} from './TableBody';
import {TableFooter} from './TableFooter';
import {TableHead} from './TableHead';
import type {TData} from './types';
import {usePreparedTableData} from './usePreparedTableData';
import {getTableTitle} from './utils';

import './Table.scss';

const b = block('dl-table');

const TREE_STATE_RESET_IGNORE_KEYS = new Set([
    'treeState',
    '_page',
    '_columnId',
    '_sortOrder',
    '_sortColumnMeta',
    'drillDownLevel',
    'drillDownFilters',
]);

function normalizeParamForTreeReset(value: unknown): string {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).join('|');
    }
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    return String(value);
}

function getTreeResetSignature(params: StringParams = {}): string {
    return Object.keys(params)
        .filter((key) => !TREE_STATE_RESET_IGNORE_KEYS.has(key) && !key.startsWith('_'))
        .sort()
        .map((key) => `${key}=${normalizeParamForTreeReset(params[key])}`)
        .join('&');
}

type FlightLoadByClassHeadRole = 'date' | 'class' | 'tot' | 'diff' | 'nu';

/** Имя колонки в ответе — это title из визуализации (см. prepareFlatTable: name: actualTitle), не id поля БД. */
function flightLoadByClassRoleFromHeadTitle(nameRaw: string): FlightLoadByClassHeadRole | null {
    const n = String(nameRaw ?? '').trim().toLowerCase();
    if (n === 'column1' || n === 'дата' || n === 'date') {
        return 'date';
    }
    if (n === 'class' || n === 'класс') {
        return 'class';
    }
    if (n === 'tot' || n === 'всего' || n === 'total') {
        return 'tot';
    }
    if (n === 'diff' || n === 'прирост' || n === 'growth') {
        return 'diff';
    }
    if (n === 'nu') {
        return 'nu';
    }
    return null;
}

function resolveFlightLoadByClassColumnIndices(head: {name?: string}[]):
    | {
          dateIdx: number;
          classIdx: number;
          totIdx?: number;
          diffIdx?: number;
          nuIdx?: number;
      }
    | null {
    const roleToIndex = new Map<FlightLoadByClassHeadRole, number>();
    head.forEach((h, idx) => {
        const role = flightLoadByClassRoleFromHeadTitle(String(h.name ?? ''));
        if (role && !roleToIndex.has(role)) {
            roleToIndex.set(role, idx);
        }
    });
    if (!roleToIndex.has('date') || !roleToIndex.has('class')) {
        return null;
    }
    const out: {
        dateIdx: number;
        classIdx: number;
        totIdx?: number;
        diffIdx?: number;
        nuIdx?: number;
    } = {
        dateIdx: roleToIndex.get('date')!,
        classIdx: roleToIndex.get('class')!,
    };
    if (roleToIndex.has('tot')) {
        out.totIdx = roleToIndex.get('tot');
    }
    if (roleToIndex.has('diff')) {
        out.diffIdx = roleToIndex.get('diff');
    }
    if (roleToIndex.has('nu')) {
        out.nuIdx = roleToIndex.get('nu');
    }
    return out;
}

function isFlightLoadByClassRawData(data: TableWidgetData['data'] | undefined): boolean {
    const head = data?.head ?? [];
    if (!head.length) {
        return false;
    }
    const indices = resolveFlightLoadByClassColumnIndices(head);
    if (!indices) {
        return false;
    }
    // Строгий сигнатурный матч отчёта 5: должны быть date+class и хотя бы один служебный столбец (nu/tot/diff).
    // Иначе обычные таблицы с полями "Дата"/"class" (напр. дашборд 8) ошибочно попадут под reshape.
    const hasServiceColumn =
        typeof indices.nuIdx === 'number' ||
        typeof indices.totIdx === 'number' ||
        typeof indices.diffIdx === 'number';
    return hasServiceColumn;
}

function getTitleText(config: TableWidgetData['config']): string {
    if (!config?.title) {
        return '';
    }
    if (typeof config.title === 'string') {
        return config.title;
    }
    return String(config.title?.text ?? '');
}

/**
 * Включаем спец-логику "Загрузка рейса по классам" только по явному признаку в названии чарта.
 * Это защищает другие таблицы/дашборды от случайного срабатывания по именам полей (например column1/class).
 */
function isFlightLoadByClassReportEnabled(args: {
    config: TableWidgetData['config'];
    data: TableWidgetData['data'] | undefined;
}): boolean {
    const {config, data} = args;
    const extraSettings = (config as any)?.extraSettings as Record<string, unknown> | undefined;
    const hasExplicitProfile = hasExplicitVisualizationCustomizationProfile(extraSettings);
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings,
        titleHints: [getTitleText(config)],
        headerFieldHints: (data?.head ?? []).map((headCell) => String(headCell?.name ?? '')),
    });
    const {enableFlightLoadByClassTableRenderer} =
        getVisualizationCustomizationBehaviorFlags(customizationProfile);
    if (enableFlightLoadByClassTableRenderer) {
        return true;
    }
    if (hasExplicitProfile) {
        return false;
    }
    const title = getTitleText(config).toLowerCase().trim();
    const byTitle =
        title.includes('загрузка рейса по классам') ||
        title.includes('рейса по классам') ||
        title.includes('flight load by class');
    if (byTitle) {
        return true;
    }
    // Дашборд может скрывать/не передавать title в config — fallback на строгую сигнатуру данных отчёта 5.
    return isFlightLoadByClassRawData(data);
}

function asCommonCell(cell: TableCell | undefined): TableCommonCell | null {
    if (cell && typeof cell === 'object' && 'value' in cell) {
        return cell as TableCommonCell;
    }
    return null;
}

function toNumberOrNull(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const n = Number(value.replace(/\s+/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function reshapeFlightLoadByClassData(
    data: TableWidgetData['data'],
): TableWidgetData['data'] {
    if (!isFlightLoadByClassRawData(data)) {
        return data;
    }

    const head = data.head ?? [];
    const rows = data.rows ?? [];
    const indices = resolveFlightLoadByClassColumnIndices(head);
    if (!indices) {
        return data;
    }
    const {dateIdx, classIdx, totIdx: totalIdx, diffIdx, nuIdx} = indices;
    const valueFallbackIdx = head.findIndex((_h, idx) => {
        return idx !== dateIdx && idx !== classIdx && idx !== totalIdx && idx !== diffIdx;
    });

    const dateHeadSrc = head[dateIdx] as TableHeadType | undefined;
    const dateColumnFormat =
        dateHeadSrc &&
        typeof dateHeadSrc === 'object' &&
        'format' in dateHeadSrc &&
        typeof (dateHeadSrc as {format?: string}).format === 'string'
            ? (dateHeadSrc as {format: string}).format
            : undefined;

    type SrcCell = TableCommonCell;
    type SrcRow = {cells?: TableCell[]};

    const classSet = new Set<string>();
    const grouped = new Map<
        string,
        {
            dateCell: SrcCell;
            classes: Map<string, SrcCell>;
        }
    >();

    for (const row of rows as SrcRow[]) {
        const cells = (row?.cells ?? []) as TableCell[];
        const dateCell = asCommonCell(cells[dateIdx]);
        if (!dateCell) {
            continue;
        }
        /* Ключ группы — сырое value (с временем), иначе строки с одной датой сливаются; formattedValue часто без времени */
        const groupKey =
            dateCell.value !== null && dateCell.value !== undefined && dateCell.value !== ''
                ? String(dateCell.value)
                : String(dateCell.formattedValue ?? '');
        if (!groupKey) {
            continue;
        }
        const classCell = asCommonCell(cells[classIdx]);
        const classLabel = String(classCell?.formattedValue ?? classCell?.value ?? '').trim();
        if (!classLabel) {
            continue;
        }
        classSet.add(classLabel);

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                dateCell,
                classes: new Map<string, SrcCell>(),
            });
        }

        const target = grouped.get(groupKey)!;
        const classValueCell =
            (typeof nuIdx === 'number' ? asCommonCell(cells[nuIdx]) : null) ??
            (typeof totalIdx === 'number'
                ? asCommonCell(cells[totalIdx])
                : null) ??
            (valueFallbackIdx >= 0 ? asCommonCell(cells[valueFallbackIdx]) : null) ??
            ({value: 1} as SrcCell);
        const prevClassValue = target.classes.get(classLabel);
        const prevNumber = toNumberOrNull(prevClassValue?.value) ?? 0;
        const nextNumber = toNumberOrNull(classValueCell?.value) ?? 0;
        target.classes.set(classLabel, {value: prevNumber + nextNumber} as SrcCell);
    }

    const classColumns = Array.from(classSet).sort((a, b) =>
        a.localeCompare(b, undefined, {numeric: true, sensitivity: 'variant'}),
    );

    const newHead: TableHeadType[] = [
        {
            id: 'column1',
            name: 'Дата',
            type: 'date',
            ...(dateColumnFormat ? {format: dateColumnFormat} : {}),
        },
        ...classColumns.map((label) => ({
            id: `class_${label}`,
            name: label,
            type: 'number' as const,
            view: 'number' as const,
        })),
        {id: 'tot', name: 'Всего', type: 'number', view: 'number'},
        {id: 'diff', name: 'Прирост', type: 'number', view: 'number'},
    ];

    const newRows: TableRow[] = Array.from(grouped.entries())
        .map(([, group]) => {
            const rowCells: TableCommonCell[] = [
                {
                    ...group.dateCell,
                    type: 'date' as const,
                    /* Иначе остаётся formattedValue только с датой — ChartKit не применяет format из шапки с временем */
                    formattedValue: undefined,
                },
                ...classColumns.map((label) => {
                    const c = group.classes.get(label);
                    return c
                        ? ({...c, type: 'number' as const} as TableCommonCell)
                        : ({value: null, type: 'number' as const} as TableCommonCell);
                }),
                (() => {
                    const total = classColumns.reduce((sum, label) => {
                        const c = group.classes.get(label);
                        const n = toNumberOrNull(c?.value);
                        return sum + (n ?? 0);
                    }, 0);
                    return {
                        value: total,
                        formattedValue: undefined,
                        type: 'number' as const,
                    } as TableCommonCell;
                })(),
                {
                    value: 0,
                    formattedValue: undefined,
                    type: 'number' as const,
                } as TableCommonCell,
            ];
            return {cells: rowCells as TableCell[]};
        })
        .sort((a, b) => {
            const a0 = asCommonCell((a as {cells?: TableCell[]}).cells?.[0]);
            const b0 = asCommonCell((b as {cells?: TableCell[]}).cells?.[0]);
            const av =
                a0?.value !== null && a0?.value !== undefined && a0?.value !== ''
                    ? String(a0.value)
                    : String(a0?.formattedValue ?? '');
            const bv =
                b0?.value !== null && b0?.value !== undefined && b0?.value !== ''
                    ? String(b0.value)
                    : String(b0?.formattedValue ?? '');
            return av.localeCompare(bv);
        });

    let prevTotal: number | null = null;
    newRows.forEach((row) => {
        const cells = (row as {cells?: TableCell[]}).cells ?? [];
        const totalCell = asCommonCell(cells[classColumns.length + 1]);
        const diffCell = asCommonCell(cells[classColumns.length + 2]);
        const total = toNumberOrNull(totalCell?.value) ?? 0;
        const diff = prevTotal === null ? total : total - prevTotal;

        if (totalCell) {
            totalCell.value = total;
            totalCell.formattedValue = undefined;
        }
        if (diffCell) {
            diffCell.value = diff;
            diffCell.formattedValue = undefined;
        }
        prevTotal = total;
    });

    return {
        ...data,
        head: newHead,
        rows: newRows,
    };
}

function isTextSelectionClickInsideCell(event: React.MouseEvent): boolean {
    if (typeof window === 'undefined' || !window.getSelection) {
        return false;
    }
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return false;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText) {
        return false;
    }

    const currentTarget = event.currentTarget as Node | null;
    if (!currentTarget) {
        return false;
    }

    const anchorInCell = selection.anchorNode ? currentTarget.contains(selection.anchorNode) : false;
    const focusInCell = selection.focusNode ? currentTarget.contains(selection.focusNode) : false;

    return anchorInCell || focusInCell;
}

type Props = {
    widgetData: TableWidgetData;
    dimensions: WidgetDimensions;
    onChangeParams?: (params: StringParams) => void;
    onReady?: () => void;
    backgroundColor?: string;
    disableCellFormatting?: boolean;
    emptyDataMessage?: string;
};

export const Table = React.memo<Props>((props: Props) => {
    const {
        dimensions: widgetDimensions,
        widgetData,
        onChangeParams,
        onReady,
        backgroundColor,
        disableCellFormatting = false,
        emptyDataMessage,
    } = props;
    const {config, data: originalData, unresolvedParams, params: currentParams} = widgetData;
    const enableFlightLoadByClassReport = React.useMemo(
        () => isFlightLoadByClassReportEnabled({config, data: originalData}),
        [config, originalData],
    );
    const reportData = React.useMemo(
        () =>
            enableFlightLoadByClassReport
                ? reshapeFlightLoadByClassData(originalData)
                : originalData,
        [enableFlightLoadByClassReport, originalData],
    );
    const flatTableRowTreeActive = tableDataIsFlatTableRowTreeResponse(reportData);
    const isFlightLoadByClassReport = React.useMemo(
        () => enableFlightLoadByClassReport && isFlightLoadByClassRawData(originalData),
        [enableFlightLoadByClassReport, originalData],
    );
    const isGroupBookingsProfileSkin = React.useMemo(() => {
        const head = reportData?.head;
        if (!head?.length) {
            return false;
        }
        return head.some((col: {custom?: Record<string, unknown>}) =>
            get(col, 'custom.profileGroupBookingsSkin') === true,
        );
    }, [reportData?.head]);

    const isPreSalePeriodMatrixSkin = React.useMemo(() => {
        const scan = (cols: TableHeadType[] | undefined): boolean => {
            if (!cols?.length) {
                return false;
            }
            return cols.some((col) => {
                if (get(col, 'custom.profilePreSalePeriodMatrixSkin') === true) {
                    return true;
                }
                const nested = (col as {sub?: TableHeadType[]}).sub;
                return nested ? scan(nested) : false;
            });
        };
        return scan(reportData?.head);
    }, [reportData?.head]);

    /* Pivot vs flat row-tree use different treeState semantics; never apply flat-tree keys here (per-widget). */
    const ignoreTreeStateForPivotTable = tableDataLooksLikeBackendPivot({
        head: reportData?.head,
        flatTableRowTreeHasNestedSegments: reportData?.flatTableRowTreeHasNestedSegments,
    });
    const title = getTableTitle(config);
    const isPaginationEnabled = Boolean(config?.paginator?.enabled);
    const size: WidgetSizeType = get(config, 'size', DEFAULT_WIDGET_SIZE);

    const [cellMinSizes, setCellMinWidth] = React.useState<number[] | null>(null);
    const isPdfExportMode =
        typeof window !== 'undefined' &&
        /(?:\?|&)_pdf_export=1(?:&|$)/.test(window.location.search);
    const originalDataRef = React.useRef(reportData);
    /** Последний treeState после клика по +/-; пока React не перерисовался, currentParams.treeState отстаёт — без ref второй + затирает первый. */
    const treeStateClickBaselineRef = React.useRef<string[]>([]);
    /* Синхронно сбрасываем замеры при новом теле таблицы (фильтры и т.д.), иначе один кадр — новые данные + старые ширины */
    if (originalDataRef.current !== reportData) {
        originalDataRef.current = reportData;
        if (cellMinSizes !== null) {
            setCellMinWidth(null);
        }
    }

    /**
     * Дашборд: после каждого клика по + уходит /api/run с новым requestId. В params ответа treeState часто нет.
     * Раньше baseline сбрасывали на каждый requestId → ref становился [], второй + затирал первый, дальше клики «умирали».
     * В редакторе чарта полного такого цикла нет — там всё «просто работает».
     * Сбрасываем baseline от сервера только при смене тела таблицы (фильтры/страница/набор строк); при том же теле и
     * новом requestId не затираем ref пустым treeState; если в params пришёл непустой treeState — подхватываем.
     */
    const treeStateSyncRequestIdRef = React.useRef<string | undefined>(undefined);
    const treeStateDataSignatureRef = React.useRef<string>('');
    const flatTreeStableFlightKeysSigRef = React.useRef<string>('');
    const treeResetParamsSignatureRef = React.useRef<string>('');
    const getTableDataSignature = React.useCallback(() => {
        const page = Number(get(currentParams, '_page')) || 0;
        if (!reportData?.head?.length) {
            return `e#p${page}`;
        }
        const headSig = reportData.head
            .map((col: {name?: string; sub?: {name: string}[]}) => {
                if (col.sub?.length) {
                    return col.sub.map((s) => s.name).join(',');
                }
                return col.name ?? '';
            })
            .join('|');
        /*
         * Flat row tree: никогда не включать rowCount в сигнатуру — при раскрытии +/- число строк меняется,
         * эффект считает «новое тело» и затирает treeState → второй плюс схлопывает первый.
         * Если ключи рейсов ещё не извлечены из строк, стабильный placeholder достаточен до следующего ответа.
         */
        if (flatTableRowTreeActive) {
            const stableFt = getFlatTableRowTreeStableBodySignature(reportData.rows);
            return `${headSig}#ftrt#${stableFt ?? '_'}#p${page}`;
        }
        const rowCount = reportData.rows?.length ?? 0;
        const footerCount = reportData.footer?.length ?? 0;
        return `${headSig}#r${rowCount}#f${footerCount}#p${page}`;
    }, [flatTableRowTreeActive, reportData, currentParams]);

    React.useLayoutEffect(() => {
        const sig = getTableDataSignature();
        const syncKey = [widgetData.requestId, widgetData.traceId].filter(Boolean).join('|');
        const rawServerTree = ([] as string[])
            .concat(widgetData.params?.treeState || [])
            .filter(Boolean) as string[];
        const serverTree = ignoreTreeStateForPivotTable
            ? []
            : normalizeFlatTableTreeStateList(rawServerTree);

        const paramsForTreeSync = widgetData.params ?? {};
        const hasTreeStateParamKey = Object.prototype.hasOwnProperty.call(
            paramsForTreeSync,
            'treeState',
        );
        /** Явный [] в params (напр. «Свернуть всё») — не подмешивать старые ключи из ref. */
        const explicitFlatTreeCollapsed =
            flatTableRowTreeActive && hasTreeStateParamKey && serverTree.length === 0;

        if (sig !== treeStateDataSignatureRef.current) {
            treeStateDataSignatureRef.current = sig;
            if (!flatTableRowTreeActive) {
                treeStateClickBaselineRef.current = serverTree;
                flatTreeStableFlightKeysSigRef.current = '';
            } else {
                const stableFtNow = getFlatTableRowTreeStableBodySignature(reportData.rows);
                if (serverTree.length > 0) {
                    treeStateClickBaselineRef.current = mergeFlatTableRowTreeBaselineOnSigChange(
                        treeStateClickBaselineRef.current,
                        serverTree,
                        reportData.rows,
                    );
                } else if (
                    stableFtNow &&
                    stableFtNow === flatTreeStableFlightKeysSigRef.current &&
                    treeStateClickBaselineRef.current.length > 0 &&
                    !explicitFlatTreeCollapsed
                ) {
                    /* тот же набор рейсов, в ответе снова пустой treeState — не затираем локальные раскрытия */
                } else if (explicitFlatTreeCollapsed) {
                    treeStateClickBaselineRef.current = [];
                } else {
                    /*
                     * Сигнатура ftrt меняется с плейсхолдера (#_#) на список ключей после первого «+»:
                     * до раскрытия collectFlatTableRowTreeFlightKeys часто пуст (нет строк сегментов),
                     * после — стабильный набор рейсов извлекается. Обнуление baseline здесь давало пустой
                     * ref на втором клике → только один ключ в treeState, «аккордеон» и перепутанные +.
                     * Сохраняем ref и отбрасываем ключи, которых нет в текущих строках (смена фильтра/страницы).
                     */
                    treeStateClickBaselineRef.current = mergeFlatTableRowTreeBaselineOnSigChange(
                        treeStateClickBaselineRef.current,
                        [],
                        reportData.rows,
                    );
                }
                flatTreeStableFlightKeysSigRef.current = stableFtNow || '';
            }
            if (syncKey) {
                treeStateSyncRequestIdRef.current = syncKey;
            }
            return;
        }

        if (!syncKey) {
            return;
        }
        if (syncKey === treeStateSyncRequestIdRef.current) {
            return;
        }
        treeStateSyncRequestIdRef.current = syncKey;

        // Flat row tree: не подменять baseline ответом с тем же sig — сервер/merge иногда
        // отдаёт урезанный treeState, из‑за чего «второй +» схлопывает первый и путает toggle.
        if (!flatTableRowTreeActive && serverTree.length > 0) {
            treeStateClickBaselineRef.current = serverTree;
        }
        if (flatTableRowTreeActive && explicitFlatTreeCollapsed) {
            treeStateClickBaselineRef.current = [];
        }
    }, [
        getTableDataSignature,
        widgetData.requestId,
        widgetData.traceId,
        widgetData.params?.treeState,
        flatTableRowTreeActive,
        ignoreTreeStateForPivotTable,
    ]);

    const data = React.useMemo(() => mapTableData(reportData), [reportData]);
    const pagination = {
        currentPage: Number(get(currentParams, '_page')) || 0,
        rowsCount: data.rows.length,
        pageLimit: config?.paginator?.limit ?? Infinity,
    };

    const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
    const tableWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const tableRef = React.useRef<HTMLTableElement | null>(null);

    const actionParams = React.useMemo(() => {
        return getCurrentActionParams({config, unresolvedParams});
    }, [config, unresolvedParams]);

    const changeParams = React.useCallback(
        (values: StringParams | null) => {
            if (onChangeParams && values) {
                onChangeParams(values);
            }
        },
        [onChangeParams],
    );

    React.useEffect(() => {
        if (!flatTableRowTreeActive || ignoreTreeStateForPivotTable) {
            return;
        }

        const nextSig = getTreeResetSignature(currentParams);
        if (!treeResetParamsSignatureRef.current) {
            treeResetParamsSignatureRef.current = nextSig;
            return;
        }

        if (treeResetParamsSignatureRef.current === nextSig) {
            return;
        }

        treeResetParamsSignatureRef.current = nextSig;
        treeStateClickBaselineRef.current = [];
        flatTreeStableFlightKeysSigRef.current = '';

        const treeStateInParams = normalizeFlatTableTreeStateList(
            ([] as string[]).concat(currentParams.treeState || []).filter(Boolean) as string[],
        );
        if (treeStateInParams.length > 0) {
            // При смене селекторов (дата/группа/рейсы) раскрытия должны сбрасываться.
            changeParams({treeState: []});
        }
    }, [changeParams, currentParams, flatTableRowTreeActive, ignoreTreeStateForPivotTable]);

    const handleSortingChange = React.useCallback(
        (column, sortOrder) => {
            const sortParams: Record<string, string> = {
                _columnId: '',
                _sortOrder: '',
                _sortColumnMeta: JSON.stringify(column?.custom || {}),
            };

            if (column) {
                const columnId = column.id;
                sortParams._columnId = `_id=${columnId}_name=${column.name}`;
                sortParams._sortOrder = String(sortOrder === 'desc' ? -1 : 1);
            }

            changeParams(sortParams);
        },
        [changeParams],
    );

    const {
        enabled: canDrillDown,
        filters: drillDownFilters,
        level: drillDownLevel,
    } = getDrillDownOptions({
        params: currentParams,
        config: config?.drillDown,
    });

    const hasSomeCellSelected = React.useMemo(
        () =>
            Boolean(
                actionParams?.params &&
                    !isEmpty(actionParams.params) &&
                    data.rows?.some(
                        (r) =>
                            'cells' in r &&
                            r.cells.some((c) => isCellSelected(c, actionParams.params)),
                    ),
            ),
        [actionParams?.params, data.rows],
    );

    const getCellAdditionStyles = (cell: TableCell, row: TData) => {
        const commonCell = cell as TableCommonCell;
        const isCellClickable =
            Boolean(canDrillDown && commonCell.drillDownFilterValue) ||
            Boolean(commonCell.treeNode) ||
            Boolean(commonCell.onClick) ||
            Boolean(actionParams?.scope);
        const cursor = isCellClickable ? 'pointer' : undefined;
        const actionParamsCss = getCellCss({
            actionParamsData: actionParams,
            row: {cells: row} as TableCellsRow,
            cell,
            head: data.head,
            hasSomeCellSelected,
        });

        return {cursor, ...actionParamsCss};
    };

    let initialSortingState: SortingState | undefined;
    if (config?.sort) {
        initialSortingState = [
            {
                id: config.sort,
                desc: config?.order === 'desc',
            },
        ];
    }
    const {colgroup, header, body, footer, measurementFooter, totalSize, lightHeaderChrome} =
        usePreparedTableData({
            data,
            dimensions: widgetDimensions,
            tableContainerRef,
            tableLayoutMeasureRef: tableWrapperRef,
            manualSorting: isPaginationEnabled || Boolean(config?.settings?.externalSort),
            onSortingChange: handleSortingChange,
            getCellAdditionStyles,
            cellMinSizes,
            sortingState: initialSortingState,
            backgroundColor,
            preserveWhiteSpace: config?.preserveWhiteSpace,
            disableCellFormatting,
            disableBodyVirtualization: flatTableRowTreeActive,
            isFlightLoadByClassReport,
        });
    const hasStableColgroup = React.useMemo(
        () =>
            Boolean(
                colgroup?.length &&
                    colgroup.every((col) => {
                        const width =
                            typeof col.width === 'number'
                                ? col.width
                                : parseFloat(String(col.width));
                        return Number.isFinite(width) && width > 0;
                    }),
            ),
        [colgroup],
    );
    const isTableReady = isPdfExportMode ? true : Boolean(cellMinSizes && hasStableColgroup);

    /*
     * Ширины колонок под бюджет виджета; при узкой карточке матрица предпродажи может слегка превышать
     * замер — без горизонтального скролла обрежется «Итого» (overflow-x: hidden у no-h-scroll).
     */
    const suppressHorizontalScroll =
        Boolean(isTableReady) && !isPreSalePeriodMatrixSkin;

    const noData = !reportData?.head?.length;
    React.useEffect(() => {
        if (onReady && (isTableReady || noData)) {
            setTimeout(onReady, 0);
        }
    }, [onReady, isTableReady, noData]);

    const highlightRows = get(config, 'settings.highlightRows') ?? !hasGroups(data.head);

    const toggleFlatTableRowTree = React.useCallback(
        (tableCommonCell: TableCommonCell) => {
            if (!tableCommonCell?.treeNode) {
                return;
            }
            const fromParams = ignoreTreeStateForPivotTable
                ? ([] as string[])
                : normalizeFlatTableTreeStateList(
                      ([] as string[]).concat(currentParams.treeState || []).filter(Boolean) as string[],
                  );
            const refKeys = treeStateClickBaselineRef.current;
            const baseline = flatTableRowTreeActive
                ? flatTableRowTreeClickBaseline(refKeys, fromParams)
                : refKeys.length > 0
                  ? refKeys
                  : fromParams;
            const paramsForTree = {...currentParams, treeState: baseline};
            const nextTreeState = getUpdatesTreeState({
                cell: tableCommonCell,
                params: paramsForTree,
            });
            if (nextTreeState === null) {
                return;
            }

            treeStateClickBaselineRef.current = nextTreeState;
            changeParams(nextTreeState.length ? {treeState: nextTreeState} : {treeState: []});
        },
        [changeParams, currentParams, flatTableRowTreeActive, ignoreTreeStateForPivotTable],
    );

    const handleCellClick = React.useCallback(
        (event: React.MouseEvent, cellData: unknown, rowId: string) => {
            // При drag-выделении текста не запускать интерактивные действия таблицы.
            if (isTextSelectionClickInsideCell(event)) {
                return;
            }

            const tableCommonCell = cellData as TableCommonCell;
            if (tableCommonCell?.onClick?.action === 'setParams') {
                changeParams(tableCommonCell.onClick.args);
                return;
            }

            if (canDrillDown && tableCommonCell.drillDownFilterValue) {
                changeParams({
                    drillDownLevel: [String(drillDownLevel + 1)],
                    drillDownFilters: drillDownFilters.map((filter: string, index: number) => {
                        if (drillDownLevel === index) {
                            return String(tableCommonCell.drillDownFilterValue);
                        }

                        return filter;
                    }),
                });
                return;
            }

            if (tableCommonCell.treeNode) {
                toggleFlatTableRowTree(tableCommonCell);
                return;
            }

            if (actionParams?.scope) {
                const metaKey = isMacintosh() ? event.metaKey : event.ctrlKey;
                const row = body.rows
                    .find((r) => r.id === rowId)
                    ?.cells?.map((c) => c.data) as TData;
                const args: GetCellActionParamsArgs = {
                    actionParamsData: actionParams,
                    rows: data.rows,
                    head: data.head,
                    row,
                    cell: tableCommonCell,
                    metaKey,
                };

                const cellActionParams = getCellActionParams(args);

                if (cellActionParams) {
                    changeParams({...cellActionParams});
                }
            }
        },
        [
            actionParams,
            canDrillDown,
            changeParams,
            currentParams,
            data,
            drillDownFilters,
            drillDownLevel,
            flatTableRowTreeActive,
            ignoreTreeStateForPivotTable,
            toggleFlatTableRowTree,
        ],
    );

    const handlePaginationChange = React.useCallback(
        (page: number) => changeParams({_page: String(page)}),
        [changeParams],
    );

    const tableStyle: React.CSSProperties = React.useMemo(() => {
        const style: React.CSSProperties = {minHeight: totalSize};

        if (config?.preserveWhiteSpace) {
            style.whiteSpace = 'pre-wrap';
        }

        return style;
    }, [totalSize, config?.preserveWhiteSpace]);

    return (
        <FlatTableRowTreeToggleContext.Provider value={toggleFlatTableRowTree}>
            <React.Fragment>
                <div
                    className={b(
                        'snapter-container',
                        [SNAPTER_HTML_CLASSNAME, CHARTKIT_SCROLLABLE_NODE_CLASSNAME].join(' '),
                    )}
                    ref={tableContainerRef}
                >
                    <TableTitleView title={title} />
                    <div
                        ref={tableWrapperRef}
                        className={b('table-wrapper', {
                            'highlight-rows': highlightRows,
                            size,
                            /* До замеров колонок не показываем «сырую» сетку (сводная и др.) */
                            pending: !isTableReady,
                            /* Перебивает overflow-x: auto у обёртки — без горизонтальной полосы */
                            'no-h-scroll': suppressHorizontalScroll,
                        })}
                    >
                        {noData && (
                            <div className={b('no-data')}>
                                {emptyDataMessage || i18n('chartkit-table', 'message-no-data')}
                            </div>
                        )}
                        {!noData && (
                            <table
                                /* bem-cn: ключ lightHeader даёт класс dl-table_lightHeader; в SCSS — dl-table_light-header */
                                className={b({
                                    prepared: true,
                                    'light-header': Boolean(lightHeaderChrome),
                                    'flight-load-by-class': isFlightLoadByClassReport,
                                    'group-bookings-profile': isGroupBookingsProfileSkin,
                                    'pre-sale-period-matrix': isPreSalePeriodMatrixSkin,
                                    'has-footer': footer.rows.length > 0,
                                })}
                                style={tableStyle}
                                ref={tableRef}
                            >
                                {colgroup && (
                                    <colgroup>
                                        {colgroup.map((col, index) => (
                                            <col width={col.width} key={index} />
                                        ))}
                                    </colgroup>
                                )}
                                {isTableReady && (
                                    <React.Fragment>
                                        <TableHead
                                            sticky={true}
                                            rows={header.rows}
                                            style={header.style}
                                        />
                                        <TableBody
                                            rows={body.rows}
                                            style={body.style}
                                            onCellClick={handleCellClick}
                                            rowRef={body.rowRef}
                                            hasFooter={footer.rows.length > 0}
                                        />
                                        <TableFooter rows={footer.rows} style={footer.style} />
                                    </React.Fragment>
                                )}
                            </table>
                        )}
                    </div>
                </div>
                {isPaginationEnabled && (
                    <Paginator
                        className={b('paginator')}
                        page={pagination.currentPage}
                        rowsCount={pagination.rowsCount}
                        limit={pagination.pageLimit}
                        onChange={handlePaginationChange}
                    />
                )}
                {/*background table for dynamic calculation of column widths during virtualization*/}
                <BackgroundTable
                    dimensions={widgetDimensions}
                    data={{header, body, footer, measurementFooter}}
                    sourceData={reportData}
                    onChangeMinWidth={(colWidths) => {
                        if (!isEqual(cellMinSizes, colWidths)) {
                            setCellMinWidth(colWidths);
                        }
                    }}
                    size={size}
                    width={config?.settings?.width ?? 'auto'}
                    preserveWhiteSpace={config?.preserveWhiteSpace}
                />
            </React.Fragment>
        </FlatTableRowTreeToggleContext.Provider>
    );
});

Table.displayName = 'Table';
