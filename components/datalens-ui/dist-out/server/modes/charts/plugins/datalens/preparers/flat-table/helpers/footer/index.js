"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFooter = exports.getFooterCellWithStyles = exports.prepareFooterValue = exports.getTotalTitle = void 0;
const shared_1 = require("../../../../../../../../../shared");
const misc_1 = require("../../../../../constants/misc");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const barsSettings_1 = require("../../../helpers/barsSettings");
const isTotalTitleCell = (columnIndex) => {
    return columnIndex === 0;
};
const getTotalTitle = (value, i18n) => {
    return value ? i18n('label_total-value', { value }) : i18n('label_total');
};
exports.getTotalTitle = getTotalTitle;
const prepareFooterValue = (args) => {
    const { column, params } = args;
    const { idToTitle, totals, order, columnIndex, idToDataType, i18n } = params;
    const columnTitle = idToTitle[column.guid];
    const index = (0, misc_helpers_1.findIndexInOrder)(order, column, columnTitle);
    const total = totals[index];
    const itemDataType = idToDataType[column.guid] || column.data_type;
    let value;
    if (total === null || total === '' || typeof total === 'undefined') {
        value = '';
    }
    else if ((0, shared_1.isMarkupField)({ data_type: itemDataType })) {
        value = total;
    }
    else if ((0, misc_helpers_1.isNumericalDataType)(itemDataType)) {
        value = Number(total);
    }
    else if ((0, shared_1.isDateField)({ data_type: itemDataType })) {
        const date = new Date(total);
        value = (0, misc_helpers_1.getTimezoneOffsettedTime)(date);
    }
    else if ((0, shared_1.isStringField)({ data_type: itemDataType })) {
        value = total;
    }
    if (isTotalTitleCell(columnIndex)) {
        value = (0, exports.getTotalTitle)(value, i18n);
    }
    if (typeof value === 'undefined') {
        value = '';
    }
    return { value, column };
};
exports.prepareFooterValue = prepareFooterValue;
const getFooterCellWithStyles = (args) => {
    const { column, columnIndex, value, columnValuesByColumn, colorsConfig, defaultColorPaletteId } = args;
    const cell = {
        value,
        css: misc_1.TABLE_TOTALS_STYLES,
    };
    if (isTotalTitleCell(columnIndex)) {
        cell.type = 'text';
    }
    if ((0, misc_helpers_1.isTableBarsSettingsEnabled)(column)) {
        const columnValues = columnValuesByColumn[column.guid];
        const barCellProperties = (0, barsSettings_1.getBarSettingsValue)({
            rowValue: String(value),
            field: column,
            columnValues,
            isTotalCell: true,
            availablePalettes: colorsConfig.availablePalettes,
            loadedColorPalettes: colorsConfig.loadedColorPalettes,
            defaultColorPaletteId,
        });
        cell.value = barCellProperties.value;
        cell.formattedValue = barCellProperties.formattedValue;
        cell.barColor = barCellProperties.barColor;
        cell.showBar = Boolean(column.barsSettings.showBarsInTotals);
    }
    return cell;
};
exports.getFooterCellWithStyles = getFooterCellWithStyles;
const getFooter = (args) => {
    const { columns, idToTitle, order, totals, ChartEditor, idToDataType, columnValuesByColumn, colorsConfig, defaultColorPaletteId, } = args;
    const i18n = (key, params) => ChartEditor.getTranslation('wizard.prepares', key, params);
    const valuesWithColumns = columns.map((column, columnIndex) => {
        return (0, exports.prepareFooterValue)({
            column,
            params: { columnIndex, totals, order, idToTitle, idToDataType, i18n },
        });
    });
    const cells = valuesWithColumns.map(({ value, column }, columnIndex) => {
        return (0, exports.getFooterCellWithStyles)({
            column,
            columnIndex,
            value,
            columnValuesByColumn,
            colorsConfig,
            defaultColorPaletteId,
        });
    });
    return [
        {
            cells,
        },
    ];
};
exports.getFooter = getFooter;
