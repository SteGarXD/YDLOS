import type {ServerPlaceholder, StringParams} from '../../../../../../../shared';
import {PlaceholderId} from '../../../../../../../shared';
import {getPivotTableSubTotals} from '../../utils/pivot-table/totals';
import {addActionParamValue} from '../helpers/action-params';
import {
    getVisualizationCustomizationBehaviorFlags,
    hasExplicitVisualizationCustomizationProfile,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import type {PrepareFunctionArgs} from '../types';

import {
    getActualizedPlaceholderItem,
    getDatasetFieldFromPivotTableValue,
    getPivotTableSettingsFromField,
    getValuesByField,
} from './helpers/misc';
import {isSortByRoleAllowed} from './helpers/sort';
import {getGrandTotalsRowIndex, setTotalsHeaders} from './helpers/totals';
import {generateTableHead} from './table-head-generator';
import {generateTableRows} from './table-rows-generator';
import type {
    CharkitTableHead,
    ChartkitTableRows,
    PivotData,
    PivotDataColumn,
    PivotDataRows,
    PivotDataStructure,
    PivotDataWithInfo,
    PivotField,
    PivotTableFieldDict,
    PivotTableFieldSettings,
    PivotTableHeaderSortMeta,
    PivotTableSortSettings,
} from './types';

type BackendPivotTablePreparerResult = {
    head: CharkitTableHead;
    rows: ChartkitTableRows;
    footer: ChartkitTableRows;
};

const backendPivotTablePreparer = (args: PrepareFunctionArgs): BackendPivotTablePreparerResult => {
    const {shared, defaultColorPaletteId} = args;
    const rawPivotData: PivotData | PivotDataWithInfo = (args.resultData as any).pivot_data as
        | PivotData
        | PivotDataWithInfo;

    const pinnedColumns = shared.extraSettings?.pinnedColumns || 0;
    let pivotData: PivotData;

    const backendSortMeta: PivotTableHeaderSortMeta = {
        columnsMeta: {},
        rowsMeta: {},
    };

    const fieldsItemIdMap: Record<string, PivotField> = (args.resultData as any).fields.reduce(
        (acc: Record<string, PivotField>, item: PivotField) => {
            acc[item.legend_item_id] = item;
            return acc;
        },
        {},
    );

    const headerTotalsIndexMap: Record<number, boolean> = {};

    if ('columns_with_info' in rawPivotData) {
        pivotData = {
            columns: rawPivotData.columns_with_info.reduce((acc, data, cellIndex) => {
                backendSortMeta.columnsMeta[cellIndex] = data.header_info;

                const cells = data.cells;
                const hasTotals = cells.find((cell) => {
                    const [_, legendItemId] = cell[0];

                    const field = fieldsItemIdMap[legendItemId];
                    return field.item_type === 'placeholder';
                });

                if (hasTotals) {
                    headerTotalsIndexMap[cellIndex] = true;
                }

                acc.push([...data.cells]);
                return acc;
            }, [] as PivotDataColumn[]),
            order: rawPivotData.order,
            row_dimension_headers: rawPivotData.row_dimension_headers,
            rows: rawPivotData.rows.reduce((acc, data, cellIndex) => {
                backendSortMeta.rowsMeta[cellIndex] = data.header_with_info.header_info;
                acc.push({header: [...data.header_with_info.cells], values: data.values});
                return acc;
            }, [] as PivotDataRows[]),
        };
    } else {
        pivotData = rawPivotData;
    }

    if (pivotData.rows.length === 0 && pivotData.columns.length === 0) {
        return {
            rows: [],
            head: [],
            footer: [],
        };
    }

    const valuesByField = getValuesByField({
        rows: pivotData.rows,
        placeholders: args.placeholders,
        fieldsItemIdMap,
    });

    const {fieldDict, settingsByField} = args.placeholders.reduce(
        (acc: PivotTableFieldDict, placeholder: ServerPlaceholder) => {
            placeholder.items.forEach((placeholderItem) => {
                const actualizedPlaceholderItem = getActualizedPlaceholderItem(placeholderItem, {
                    idToDataType: args.idToDataType,
                    idToTitle: args.idToTitle,
                });

                acc.fieldDict[actualizedPlaceholderItem.guid] = actualizedPlaceholderItem;
                acc.fieldDict[actualizedPlaceholderItem.title] = actualizedPlaceholderItem;

                const prevSettings: PivotTableFieldSettings =
                    acc.settingsByField[actualizedPlaceholderItem.guid] ||
                    acc.settingsByField[actualizedPlaceholderItem.title] ||
                    {};

                const settings = getPivotTableSettingsFromField(
                    actualizedPlaceholderItem,
                    prevSettings,
                    placeholder.id as PlaceholderId,
                    valuesByField,
                );
                acc.settingsByField[actualizedPlaceholderItem.guid] = settings;
                acc.settingsByField[actualizedPlaceholderItem.title] = settings;
            });

            return acc;
        },
        {fieldDict: {}, settingsByField: {}} as PivotTableFieldDict,
    );
    const firstRowHeader = pivotData.rows?.[0]?.header ?? [];
    const firstRowHeaderTitles = firstRowHeader
        .map((headerCellValue) =>
            headerCellValue
                ? getDatasetFieldFromPivotTableValue(
                      headerCellValue,
                      fieldsItemIdMap as any,
                      fieldDict,
                  )
                : undefined,
        )
        .map((field) => String(field?.fakeTitle ?? field?.title ?? '').toLowerCase().trim())
        .filter(Boolean);
    const placeholderFieldHints = args.placeholders.flatMap((placeholder) =>
        placeholder.items.flatMap((item: any) =>
            [item?.fakeTitle, item?.title, item?.guid].map((value) =>
                String(value ?? '')
                    .toLowerCase()
                    .trim(),
            ),
        ),
    );
    const profileFieldHints = Array.from(
        new Set([...firstRowHeaderTitles, ...placeholderFieldHints].filter(Boolean)),
    );
    const extraSettings = shared.extraSettings as Record<string, unknown>;
    const hasExplicitCustomizationProfile =
        hasExplicitVisualizationCustomizationProfile(extraSettings);
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings,
        titleHints: [String((shared as any).title ?? '')],
        headerFieldHints: profileFieldHints,
    });
    const rawTableCustomization = (shared.extraSettings as any)?.customization?.table;
    const tableCustomization = rawTableCustomization?.pivot ?? rawTableCustomization;
    const customizationBehavior =
        getVisualizationCustomizationBehaviorFlags(customizationProfile);
    const enableFlightLoadByClassPresetStyles =
        customizationBehavior.enableFlightLoadByClassPivotPreset;
    const enablePreSalePeriodPresetStyles =
        customizationBehavior.enablePreSalePeriodPivotPreset;
    const isolatePivotBackgroundFromFieldPresets =
        customizationBehavior.isolatePivotFieldBackgrounds;
    const settingsByFieldForRender = isolatePivotBackgroundFromFieldPresets
        ? Object.fromEntries(
              Object.entries(settingsByField).map(([key, value]) => [
                  key,
                  value && typeof value === 'object'
                      ? ({
                            ...value,
                            backgroundSettings: undefined,
                        } as PivotTableFieldSettings)
                      : value,
              ]),
          )
        : settingsByField;

    const pivotStructure: PivotDataStructure[] = (args.resultData as any).pivot.structure || [];

    const rowsFields =
        args.placeholders.find((placeholder) => placeholder.id === PlaceholderId.PivotTableRows)
            ?.items || [];
    const columnsFields =
        args.placeholders.find((placeholder) => placeholder.id === PlaceholderId.PivotTableColumns)
            ?.items || [];
    const measures = args.placeholders[2].items;
    const isTotalsEnabled = Object.values(fieldDict).some((field) => {
        return field.subTotalsSettings?.enabled;
    });

    const isPaginatorEnabled = args.shared.extraSettings?.pagination === 'on';
    const isInlineSortEnabled = !(args.shared.extraSettings?.pivotInlineSort === 'off');

    const pivotTotals = getPivotTableSubTotals({rowsFields, columnsFields});
    const sortSettings: PivotTableSortSettings = {
        isSortByRowAllowed:
            isSortByRoleAllowed(pivotStructure, pivotTotals, 'pivot_row') && isInlineSortEnabled,
        isSortByColumnAllowed: isSortByRoleAllowed(pivotStructure, pivotTotals, 'pivot_column'),
        ...backendSortMeta,
    };
    const preRowHeadersLength = pivotData.rows?.[0]?.header?.length || 0;
    const classicMainFormMeasures = new Set(['заброн', 'пкз', 'зпк %', 'млн. р']);
    const presentMeasureTitles = new Set(
        (measures ?? [])
            .map((m: any) => String(m?.fakeTitle ?? m?.title ?? '').toLowerCase().trim())
            .filter(Boolean),
    );
    const enableClassicMainFormPresetStyles =
        customizationBehavior.enableClassicMainFormPivotPreset ||
        (!hasExplicitCustomizationProfile &&
            preRowHeadersLength === 3 &&
            Array.from(classicMainFormMeasures).every((title) => presentMeasureTitles.has(title)));

    let rows = generateTableRows({
        settingsByField: settingsByFieldForRender,
        pivotData,
        fieldsItemIdMap,
        fieldDict,
        colorsConfig: args.colorsConfig,
        colors: args.colors,
        isTotalsEnabled,
        pivotStructure,
        sortSettings,
        headerTotalsIndexMap,
        ChartEditor: args.ChartEditor,
        defaultColorPaletteId,
        enableFlightLoadByClassPresetStyles,
        enableClassicMainFormPresetStyles,
        enablePreSalePeriodPresetStyles,
        tableCustomization,
    });

    const columns = pivotData.columns;

    let lineHeaderLength: number;

    const tableRows = pivotData.rows[0];
    const rowHeaders = tableRows?.header || [];
    const rowHeadersLength = rowHeaders.length;

    if (columns.length === 1 && columns[0].length === 0) {
        const rowValues = tableRows?.values || [];
        const rowValuesLength = rowValues.length;
        lineHeaderLength = rowHeadersLength + rowValuesLength;
    } else {
        lineHeaderLength = rowHeadersLength;
    }

    let head = generateTableHead({
        pivotData,
        pivotStructure,
        fieldsItemIdMap,
        lineHeaderLength,
        fieldDict,
        idToDataType: args.idToDataType,
        measures,
        isTotalsEnabled,
        settingsByField: settingsByFieldForRender,
        isPaginatorEnabled,
        loadedColorPalettes: args.colorsConfig.loadedColorPalettes,
        availablePalettes: args.colorsConfig.availablePalettes,
        sortSettings,
        pinnedColumns,
        defaultColorPaletteId,
        enablePreSalePeriodPresetStyles,
        tableCustomization,
    });

    let footer = [];

    if (isTotalsEnabled) {
        setTotalsHeaders({rows, head}, args.ChartEditor, {
            rowHeaderLength: rowHeadersLength,
            usePivotTotalLabel: true,
        });

        const totalRowIndex = getGrandTotalsRowIndex(rows);

        // YDL OS: не переносим в footer, если это опустошит rows — иначе в UI будет «Нет данных»
        if (totalRowIndex !== -1 && totalRowIndex > 0) {
            const rowsToRemove = rows.length - totalRowIndex;
            const spliced = rows.splice(totalRowIndex, rowsToRemove);
            // Keep only actual total rows in footer; push stray body rows back
            footer = spliced.filter((r: {cells: any[]}) => r.cells?.[0]?.isTotalCell === true);
            const strayRows = spliced.filter(
                (r: {cells: any[]}) => r.cells?.[0]?.isTotalCell !== true,
            );
            if (strayRows.length) {
                rows.push(...strayRows);
            }
            // YDL OS: одна ячейка «ИТОГО» на 2 колонки и 4 строки (colSpan=2 в totals.ts; rowSpan здесь)
            if (footer.length > 1 && rowHeadersLength > 0) {
                const firstRow = footer[0];
                const firstCell = firstRow?.cells?.[0];
                if (firstCell && firstCell.isTotalCell) {
                    (firstCell as any).rowSpan = footer.length;
                    // Покрываем rowSpan'ом только те колонки, которые реально заняты colSpan
                    // первой ячейки (2), а НЕ все rowHeadersLength (3) — иначе метка метрики
                    // (ПКЗ, ЗПК %, Млн. р) пропадает и правые ячейки «съезжают».
                    const actualColSpan = (firstCell as any).colSpan || 1;
                    for (let r = 1; r < footer.length; r++) {
                        for (let c = 0; c < actualColSpan; c++) {
                            const cell = footer[r].cells[c];
                            if (cell) (cell as any).isRowSpanCovered = true;
                        }
                    }
                    for (let r = 0; r < footer.length; r++) {
                        if (actualColSpan >= 2) {
                            const cell1 = footer[r].cells?.[1];
                            if (cell1) (cell1 as any).isColSpanCovered = true;
                        }
                    }
                }
            }
        }
    }
    // Keep header structure even when showHeader is off to avoid renderer regressions.
    if (tableCustomization?.showFooter === false || tableCustomization?.showTotals === false) {
        footer = [];
    }
    const columnStyles = tableCustomization?.columnStyles || {};
    const indices = (head.length ? head : rows[0]?.cells || [])
        .map((_: unknown, index: number) => index)
        .filter((idx: number) => !columnStyles[String(idx)]?.hide)
        .sort((a: number, b: number) => {
            const ao = columnStyles[String(a)]?.order;
            const bo = columnStyles[String(b)]?.order;
            if (typeof ao === 'number' && typeof bo === 'number') return ao - bo;
            if (typeof ao === 'number') return -1;
            if (typeof bo === 'number') return 1;
            return a - b;
        });
    if (indices.length && head.length && indices.length !== head.length) {
        head = indices.map((i: number) => head[i]).filter(Boolean);
        rows = rows.map((r: any) => ({...r, cells: indices.map((i: number) => r.cells[i]).filter(Boolean)}));
        footer = footer.map((r: any) => ({
            ...r,
            cells: indices.map((i: number) => r.cells[i]).filter(Boolean),
        }));
    }

    const widgetConfig = args.ChartEditor.getWidgetConfig();
    const isActionParamsEnable = widgetConfig?.actionParams?.enable;
    if (isActionParamsEnable) {
        const headParams = rawPivotData.columns.map<StringParams>((items) => {
            const actionParams = {};
            items.forEach((cell) => {
                const [[value, legend_item_id]] = cell;
                const pivotField = fieldsItemIdMap[legend_item_id];
                addActionParamValue(actionParams, fieldDict[pivotField?.id], value);
            });

            return actionParams;
        });

        rows.forEach((row) => {
            const rowActionParams = {};
            row.cells.forEach((cell: any, cellIndex: number) => {
                if (cellIndex < rowHeaders.length) {
                    const [[, legend_item_id]] = rowHeaders[cellIndex] || [];
                    const pivotField = fieldsItemIdMap[legend_item_id];
                    addActionParamValue(rowActionParams, fieldDict[pivotField?.id], cell.value);
                } else {
                    const headCellParams = headParams[cellIndex - rowHeaders.length];
                    cell.custom = {actionParams: {...rowActionParams, ...headCellParams}};
                }
            });
        });
    }

    return {head, rows, footer};
};

export default backendPivotTablePreparer;
