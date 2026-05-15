"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../shared");
const helpers_1 = require("../../url/helpers");
const color_helpers_1 = require("../../utils/color-helpers");
const constants_1 = require("../../utils/constants");
const misc_helpers_1 = require("../../utils/misc-helpers");
const action_params_1 = require("../helpers/action-params");
const barsSettings_1 = require("../helpers/barsSettings");
const columnSettings_1 = require("../helpers/columnSettings");
const background_settings_1 = require("./helpers/background-settings");
const footer_1 = require("./helpers/footer");
const misc_1 = require("./helpers/misc");
function prepareFlatTable({ placeholders, resultData, colors, idToTitle, idToDataType, colorsConfig, shared, ChartEditor, fields, defaultColorPaletteId, }) {
    var _a, _b, _c, _d;
    const { drillDownData } = shared.sharedData;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnable = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const treeSet = new Set((0, helpers_1.getTreeState)(ChartEditor.getParams()));
    const pinnedColumns = ((_b = shared.extraSettings) === null || _b === void 0 ? void 0 : _b.pinnedColumns) || 0;
    const currentActiveDrillDownField = drillDownData && drillDownData.fields[drillDownData.level];
    let currentActiveDrillDownFieldIndex = -1;
    const { data, order, legend } = resultData;
    const totals = resultData.totals;
    // Columns
    const columns = placeholders[0].items;
    const backgroundColorsByMeasure = (0, background_settings_1.getBackgroundColorsMapByContinuousColumn)({
        columns,
        idToTitle,
        order,
        data,
        chartColorsConfig: colorsConfig,
    });
    const columnValuesByColumn = (0, misc_1.getColumnValuesByColumnWithBarSettings)({
        values: data,
        totals,
        columns,
        idToTitle,
        order,
    });
    // Draw a vertical table
    const head = columns.map((item, index) => {
        var _a, _b;
        const isLastColumn = index === columns.length - 1;
        const actualTitle = item.fakeTitle || idToTitle[item.guid];
        const columnSettings = item.columnSettings;
        const widthSettings = columnSettings === null || columnSettings === void 0 ? void 0 : columnSettings.width;
        const headCell = {
            id: item.guid,
            name: actualTitle,
            type: 'text',
            width: (0, columnSettings_1.getColumnWidthValue)(widthSettings),
        };
        if ((_a = item.hintSettings) === null || _a === void 0 ? void 0 : _a.enabled) {
            headCell.hint = item.hintSettings.text;
        }
        if (!isLastColumn && index < pinnedColumns) {
            headCell.pinned = true;
        }
        const dataType = idToDataType[item.guid];
        if ((0, misc_helpers_1.isNumericalDataType)(dataType)) {
            const numberHeadCell = {
                ...headCell,
                formatter: {},
                type: 'number',
                view: 'number',
            };
            if ((0, misc_helpers_1.isTableBarsSettingsEnabled)(item)) {
                const columnValues = columnValuesByColumn[item.guid];
                return {
                    ...numberHeadCell,
                    ...(0, barsSettings_1.getBarSettingsViewOptions)({
                        barsSettings: item.barsSettings,
                        columnValues,
                    }),
                };
            }
            else {
                // TODO: in theory, this is not necessary, because you need to look at the dataType
                if ((0, shared_1.isNumberField)(item)) {
                    const formatting = (0, shared_1.getFormatOptions)(item);
                    if (formatting) {
                        numberHeadCell.formatter = {
                            format: formatting.format,
                            suffix: formatting.postfix,
                            prefix: formatting.prefix,
                            showRankDelimiter: formatting.showRankDelimiter,
                            unit: formatting.unit,
                        };
                        if (dataType === shared_1.DATASET_FIELD_TYPES.FLOAT) {
                            numberHeadCell.formatter.precision =
                                (_b = formatting.precision) !== null && _b !== void 0 ? _b : shared_1.MINIMUM_FRACTION_DIGITS;
                        }
                    }
                    else {
                        numberHeadCell.precision =
                            dataType === shared_1.DATASET_FIELD_TYPES.FLOAT ? shared_1.MINIMUM_FRACTION_DIGITS : 0;
                    }
                }
                return numberHeadCell;
            }
        }
        else if ((0, shared_1.isDateField)(item)) {
            const dateHeadCell = {
                ...headCell,
                type: 'date',
                format: constants_1.DEFAULT_DATE_FORMAT,
            };
            if (item.format) {
                dateHeadCell.format = item.format;
            }
            else if (dataType === 'genericdatetime') {
                dateHeadCell.format = constants_1.DEFAULT_DATETIME_FORMAT;
            }
            else if (dataType === 'datetimetz') {
                dateHeadCell.format = constants_1.DEFAULT_DATETIMETZ_FORMAT;
            }
            return dateHeadCell;
        }
        return headCell;
    });
    if (currentActiveDrillDownField) {
        const actualTitle = idToTitle[currentActiveDrillDownField.guid] || currentActiveDrillDownField.title;
        currentActiveDrillDownFieldIndex = (0, misc_helpers_1.findIndexInOrder)(order, currentActiveDrillDownField, actualTitle);
    }
    const iColor = colors.length
        ? (0, misc_helpers_1.findIndexInOrder)(order, colors[0], idToTitle[colors[0].guid])
        : -1;
    const preparedColumns = columns.map((item) => {
        const actualTitle = idToTitle[item.guid] || item.title;
        const indexInOrder = (0, misc_helpers_1.findIndexInOrder)(order, item, actualTitle);
        const itemDataType = idToDataType[item.guid] || item.data_type;
        return {
            ...item,
            actualTitle,
            indexInOrder,
            itemDataType,
            isMarkupDataType: (0, shared_1.isMarkupDataType)(itemDataType),
            isNumericalDataType: (0, misc_helpers_1.isNumericalDataType)(itemDataType),
            isDateType: (0, shared_1.isDateType)(itemDataType),
            isTreeDataType: (0, shared_1.isTreeDataType)(itemDataType),
            isUnsupportedDataType: (0, shared_1.isUnsupportedDataType)(itemDataType),
            isTableBarsSettingsEnabled: (0, misc_helpers_1.isTableBarsSettingsEnabled)(item),
            isTableFieldBackgroundSettingsEnabled: (0, misc_helpers_1.isTableFieldBackgroundSettingsEnabled)(item),
            canUseFieldForFiltering: isActionParamsEnable && (0, action_params_1.canUseFieldForFiltering)(item),
        };
    });
    const rows = data.map((values, rowIndex) => {
        // eslint-disable-next-line complexity
        const cells = preparedColumns.map((item) => {
            const value = values[item.indexInOrder];
            const cell = { value, fieldId: item.guid };
            if (value === null) {
                cell.value = null;
            }
            else if (Array.isArray(value)) {
                cell.value = JSON.stringify(value);
            }
            else if (item.isMarkupDataType) {
                cell.value = value;
                cell.type = 'markup';
            }
            else if (item.isNumericalDataType) {
                cell.type = 'number';
                if (item.isTableBarsSettingsEnabled) {
                    const columnValues = columnValuesByColumn[item.guid];
                    const barCellProperties = (0, barsSettings_1.getBarSettingsValue)({
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
                    cell.barColor = barCellProperties.barColor;
                }
                else {
                    cell.value = Number(value);
                }
            }
            else if (item.isTreeDataType) {
                if (legend === null || legend === void 0 ? void 0 : legend.length) {
                    const currentLegend = legend[rowIndex][item.indexInOrder];
                    const fieldData = fields.find((field) => field.legend_item_id === currentLegend);
                    if (fieldData) {
                        cell.treeNode = String(cell.value);
                        const parsedTreeNode = JSON.parse(cell.treeNode);
                        cell.treeOffset = parsedTreeNode.length;
                        cell.treeNodeState = treeSet.has(cell.treeNode) ? 'open' : 'closed';
                        cell.value = parsedTreeNode[parsedTreeNode.length - 1];
                    }
                }
            }
            else if (item.isUnsupportedDataType) {
                ChartEditor._setError({
                    code: 'ERR.CHARTS.UNSUPPORTED_DATA_TYPE',
                    details: {
                        field: item.actualTitle,
                    },
                });
            }
            if (drillDownData && !item.isMarkupDataType && currentActiveDrillDownFieldIndex >= 0) {
                if (values[currentActiveDrillDownFieldIndex] === null) {
                    cell.drillDownFilterValue = shared_1.IS_NULL_FILTER_TEMPLATE;
                }
                else if (typeof values[currentActiveDrillDownFieldIndex] !== 'object') {
                    cell.drillDownFilterValue = String(values[currentActiveDrillDownFieldIndex]);
                }
            }
            if (colors.length) {
                const valueColor = values[iColor];
                if (valueColor !== null || colorsConfig.nullMode === shared_1.GradientNullModes.AsZero) {
                    cell.color = Number(valueColor);
                }
            }
            if (item.isTableFieldBackgroundSettingsEnabled) {
                cell.css = (0, background_settings_1.getFlatTableBackgroundStyles)({
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
            if (isActionParamsEnable) {
                if (item.canUseFieldForFiltering) {
                    if (item.isDateType) {
                        const actionParams = {};
                        (0, action_params_1.addActionParamValue)(actionParams, item, value);
                        cell.custom = { actionParams };
                    }
                }
                else {
                    // Need to add an empty object to exclude the measure field value from the filtering data
                    // (otherwise cell.value will be used by default)
                    cell.custom = {
                        actionParams: {},
                    };
                }
            }
            return cell;
        });
        return {
            cells,
        };
    });
    if (colors.length) {
        (0, color_helpers_1.mapAndColorizeTableCells)(rows, colorsConfig);
    }
    const page = ChartEditor.getCurrentPage();
    const limit = (_c = shared.extraSettings) === null || _c === void 0 ? void 0 : _c.limit;
    const paginationDisabled = ((_d = shared.extraSettings) === null || _d === void 0 ? void 0 : _d.pagination) !== 'on';
    // Disable the paginator if all the data came initially
    // Disabling the paginator enables front-end sorting (when clicking on the column header)
    const shouldDisablePaginator = page === 1 && limit && limit > data.length;
    let footer;
    const oneLineAndPaginationDisabled = (paginationDisabled || shouldDisablePaginator) && data.length === 1;
    if (!oneLineAndPaginationDisabled && totals.length) {
        footer = (0, footer_1.getFooter)({
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
    return { head, rows, footer };
}
exports.default = prepareFlatTable;
