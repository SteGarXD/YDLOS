"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../shared");
const totals_1 = require("../../utils/pivot-table/totals");
const action_params_1 = require("../helpers/action-params");
const misc_1 = require("./helpers/misc");
const sort_1 = require("./helpers/sort");
const totals_2 = require("./helpers/totals");
const table_head_generator_1 = require("./table-head-generator");
const table_rows_generator_1 = require("./table-rows-generator");
const backendPivotTablePreparer = (args) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const { shared, defaultColorPaletteId } = args;
    const rawPivotData = args.resultData.pivot_data;
    const pinnedColumns = ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.pinnedColumns) || 0;
    let pivotData;
    const backendSortMeta = {
        columnsMeta: {},
        rowsMeta: {},
    };
    const fieldsItemIdMap = args.resultData.fields.reduce((acc, item) => {
        acc[item.legend_item_id] = item;
        return acc;
    }, {});
    const headerTotalsIndexMap = {};
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
            }, []),
            order: rawPivotData.order,
            row_dimension_headers: rawPivotData.row_dimension_headers,
            rows: rawPivotData.rows.reduce((acc, data, cellIndex) => {
                backendSortMeta.rowsMeta[cellIndex] = data.header_with_info.header_info;
                acc.push({ header: [...data.header_with_info.cells], values: data.values });
                return acc;
            }, []),
        };
    }
    else {
        pivotData = rawPivotData;
    }
    if (pivotData.rows.length === 0 && pivotData.columns.length === 0) {
        return {
            rows: [],
            head: [],
            footer: [],
        };
    }
    const valuesByField = (0, misc_1.getValuesByField)({
        rows: pivotData.rows,
        placeholders: args.placeholders,
        fieldsItemIdMap,
    });
    const { fieldDict, settingsByField } = args.placeholders.reduce((acc, placeholder) => {
        placeholder.items.forEach((placeholderItem) => {
            const actualizedPlaceholderItem = (0, misc_1.getActualizedPlaceholderItem)(placeholderItem, {
                idToDataType: args.idToDataType,
                idToTitle: args.idToTitle,
            });
            acc.fieldDict[actualizedPlaceholderItem.guid] = actualizedPlaceholderItem;
            acc.fieldDict[actualizedPlaceholderItem.title] = actualizedPlaceholderItem;
            const prevSettings = acc.settingsByField[actualizedPlaceholderItem.guid] ||
                acc.settingsByField[actualizedPlaceholderItem.title] ||
                {};
            const settings = (0, misc_1.getPivotTableSettingsFromField)(actualizedPlaceholderItem, prevSettings, placeholder.id, valuesByField);
            acc.settingsByField[actualizedPlaceholderItem.guid] = settings;
            acc.settingsByField[actualizedPlaceholderItem.title] = settings;
        });
        return acc;
    }, { fieldDict: {}, settingsByField: {} });
    const pivotStructure = args.resultData.pivot.structure || [];
    const rowsFields = ((_b = args.placeholders.find((placeholder) => placeholder.id === shared_1.PlaceholderId.PivotTableRows)) === null || _b === void 0 ? void 0 : _b.items) || [];
    const columnsFields = ((_c = args.placeholders.find((placeholder) => placeholder.id === shared_1.PlaceholderId.PivotTableColumns)) === null || _c === void 0 ? void 0 : _c.items) || [];
    const measures = args.placeholders[2].items;
    const isTotalsEnabled = Object.values(fieldDict).some((field) => {
        var _a;
        return (_a = field.subTotalsSettings) === null || _a === void 0 ? void 0 : _a.enabled;
    });
    const isPaginatorEnabled = ((_d = args.shared.extraSettings) === null || _d === void 0 ? void 0 : _d.pagination) === 'on';
    const isInlineSortEnabled = !(((_e = args.shared.extraSettings) === null || _e === void 0 ? void 0 : _e.pivotInlineSort) === 'off');
    const pivotTotals = (0, totals_1.getPivotTableSubTotals)({ rowsFields, columnsFields });
    const sortSettings = {
        isSortByRowAllowed: (0, sort_1.isSortByRoleAllowed)(pivotStructure, pivotTotals, 'pivot_row') && isInlineSortEnabled,
        isSortByColumnAllowed: (0, sort_1.isSortByRoleAllowed)(pivotStructure, pivotTotals, 'pivot_column'),
        ...backendSortMeta,
    };
    const rows = (0, table_rows_generator_1.generateTableRows)({
        settingsByField,
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
    });
    const columns = pivotData.columns;
    let lineHeaderLength;
    const tableRows = pivotData.rows[0];
    const rowHeaders = (tableRows === null || tableRows === void 0 ? void 0 : tableRows.header) || [];
    const rowHeadersLength = rowHeaders.length;
    if (columns.length === 1 && columns[0].length === 0) {
        const rowValues = (tableRows === null || tableRows === void 0 ? void 0 : tableRows.values) || [];
        const rowValuesLength = rowValues.length;
        lineHeaderLength = rowHeadersLength + rowValuesLength;
    }
    else {
        lineHeaderLength = rowHeadersLength;
    }
    const head = (0, table_head_generator_1.generateTableHead)({
        pivotData,
        pivotStructure,
        fieldsItemIdMap,
        lineHeaderLength,
        fieldDict,
        idToDataType: args.idToDataType,
        measures,
        isTotalsEnabled,
        settingsByField,
        isPaginatorEnabled,
        loadedColorPalettes: args.colorsConfig.loadedColorPalettes,
        availablePalettes: args.colorsConfig.availablePalettes,
        sortSettings,
        pinnedColumns,
        defaultColorPaletteId,
    });
    let footer = [];
    if (isTotalsEnabled) {
        (0, totals_2.setTotalsHeaders)({ rows, head }, args.ChartEditor, { rowHeaderLength: rowHeadersLength, usePivotTotalLabel: true });
        const totalRowIndex = (0, totals_2.getGrandTotalsRowIndex)(rows);
        if (totalRowIndex !== -1) {
            const rowsToRemove = rows.length - totalRowIndex;
            footer = rows.splice(totalRowIndex, rowsToRemove);
            // YDL OS: одна ячейка «ИТОГО» по центру блока (rowSpan по всем строкам подытога)
            if (footer.length > 1 && rowHeadersLength > 0) {
                const firstRow = footer[0];
                const firstCell = (_f = firstRow === null || firstRow === void 0 ? void 0 : firstRow.cells) === null || _f === void 0 ? void 0 : _f[0];
                if (firstCell && firstCell.isTotalCell) {
                    firstCell.rowSpan = footer.length;
                    for (let r = 1; r < footer.length; r++) {
                        for (let c = 0; c < rowHeadersLength; c++) {
                            const cell = footer[r].cells[c];
                            if (cell)
                                cell.isRowSpanCovered = true;
                        }
                    }
                }
            }
        }
    }
    const widgetConfig = args.ChartEditor.getWidgetConfig();
    const isActionParamsEnable = (_g = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _g === void 0 ? void 0 : _g.enable;
    if (isActionParamsEnable) {
        const headParams = rawPivotData.columns.map((items) => {
            const actionParams = {};
            items.forEach((cell) => {
                const [[value, legend_item_id]] = cell;
                const pivotField = fieldsItemIdMap[legend_item_id];
                (0, action_params_1.addActionParamValue)(actionParams, fieldDict[pivotField === null || pivotField === void 0 ? void 0 : pivotField.id], value);
            });
            return actionParams;
        });
        rows.forEach((row) => {
            const rowActionParams = {};
            row.cells.forEach((cell, cellIndex) => {
                if (cellIndex < rowHeaders.length) {
                    const [[, legend_item_id]] = rowHeaders[cellIndex] || [];
                    const pivotField = fieldsItemIdMap[legend_item_id];
                    (0, action_params_1.addActionParamValue)(rowActionParams, fieldDict[pivotField === null || pivotField === void 0 ? void 0 : pivotField.id], cell.value);
                }
                else {
                    const headCellParams = headParams[cellIndex - rowHeaders.length];
                    cell.custom = { actionParams: { ...rowActionParams, ...headCellParams } };
                }
            });
        });
    }
    return { head, rows, footer };
};
exports.default = backendPivotTablePreparer;
