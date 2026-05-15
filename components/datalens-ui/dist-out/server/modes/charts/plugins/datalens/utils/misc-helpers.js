"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.numericStringCollator = exports.chartKitFormatNumberWrapper = exports.numericCollator = exports.collator = void 0;
exports.getDefaultDateFormat = getDefaultDateFormat;
exports.getServerDateFormat = getServerDateFormat;
exports.getSortedColumnId = getSortedColumnId;
exports.isLegendEnabled = isLegendEnabled;
exports.getLabelValue = getLabelValue;
exports.getCategoryFormatter = getCategoryFormatter;
exports.getSeriesTitleFormatter = getSeriesTitleFormatter;
exports.setConsole = setConsole;
exports.log = log;
exports.logTiming = logTiming;
exports.isGradientMode = isGradientMode;
exports.isNumericalDataType = isNumericalDataType;
exports.isFloatDataType = isFloatDataType;
exports.isMarkupDataType = isMarkupDataType;
exports.getTimezoneOffsettedTime = getTimezoneOffsettedTime;
exports.formatDate = formatDate;
exports.formatNumber = formatNumber;
exports.customFormatNumber = customFormatNumber;
exports.findIndexInOrder = findIndexInOrder;
exports.getAllPlaceholderItems = getAllPlaceholderItems;
exports.getSortData = getSortData;
exports.getDrillDownData = getDrillDownData;
exports.getPointRadius = getPointRadius;
exports.isNeedToCalcClosestPointManually = isNeedToCalcClosestPointManually;
exports.getTitleInOrder = getTitleInOrder;
exports.getOriginalTitleOrTitle = getOriginalTitleOrTitle;
exports.isTableBarsSettingsEnabled = isTableBarsSettingsEnabled;
exports.getFormatOptionsFromFieldFormatting = getFormatOptionsFromFieldFormatting;
exports.isTableFieldBackgroundSettingsEnabled = isTableFieldBackgroundSettingsEnabled;
exports.isColumnSettingsWidthEnabled = isColumnSettingsWidthEnabled;
exports.getSortOrder = getSortOrder;
exports.getFieldTitle = getFieldTitle;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const moment_1 = __importDefault(require("moment"));
const shared_1 = require("../../../../../../shared");
const index_1 = require("../../../../../../shared/types/index");
const markdown_1 = require("../../../../../../shared/utils/markdown");
const ui_sandbox_1 = require("../../../../../../shared/utils/ui-sandbox");
const constants_1 = require("./constants");
let currentConsole = console;
function setConsole(newConsole) {
    currentConsole = newConsole;
}
function log(...data) {
    return constants_1.LOG_INFO && currentConsole.log(...data);
}
function logTiming(...data) {
    return constants_1.LOG_TIMING && currentConsole.log(...data);
}
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
exports.collator = collator;
const numericCollator = (a, b) => (a > b ? 1 : -1);
exports.numericCollator = numericCollator;
const numericStringCollator = (a, b) => {
    return Number(a) > Number(b) ? 1 : -1;
};
exports.numericStringCollator = numericStringCollator;
function isNumericalDataType(dataType) {
    return (dataType === shared_1.DATASET_FIELD_TYPES.FLOAT ||
        dataType === shared_1.DATASET_FIELD_TYPES.INTEGER ||
        dataType === shared_1.DATASET_FIELD_TYPES.UINTEGER);
}
function isFloatDataType(dataType) {
    return dataType === shared_1.DATASET_FIELD_TYPES.FLOAT;
}
function isMarkupDataType(dataType) {
    return dataType === shared_1.DATASET_FIELD_TYPES.MARKUP;
}
function getTimezoneOffsettedTime(value) {
    return value.getTime() - value.getTimezoneOffset() * 60 * 1000;
}
function getDefaultDateFormat(valueType) {
    return valueType === 'datetime' || valueType === 'genericdatetime'
        ? constants_1.DEFAULT_DATETIME_FORMAT
        : constants_1.DEFAULT_DATE_FORMAT;
}
function getServerDateFormat(fieldType) {
    return fieldType === 'datetime' || fieldType === 'genericdatetime'
        ? constants_1.SERVER_DATETIME_FORMAT
        : constants_1.SERVER_DATE_FORMAT;
}
function formatDate({ valueType, value, format, utc = false, }) {
    const createDate = utc ? moment_1.default.utc : moment_1.default;
    if (format) {
        return createDate(value).format(format.replace('hh', 'HH'));
    }
    return createDate(value).format(getDefaultDateFormat(valueType));
}
function formatNumber(value, minimumFractionDigits = shared_1.MINIMUM_FRACTION_DIGITS) {
    const numberFormat = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits,
    });
    return numberFormat.format(value);
}
// This function is needed in order to format numbers in the Russian locale
// since the environment in which this script works only knows about the EN locale
// TODO: ^ so it needs to be done at the front, not here
function customFormatNumber({ value, minimumFractionDigits, locale = 'ru-RU', }) {
    switch (locale) {
        case 'ru-RU':
        default: {
            const formattedValue = formatNumber(value, minimumFractionDigits);
            return formattedValue.replace(/,/g, ' ').replace(/\./g, ',');
        }
    }
}
const chartKitFormatNumberWrapper = (value, options) => {
    return (0, shared_1.formatNumber)(value, options);
};
exports.chartKitFormatNumberWrapper = chartKitFormatNumberWrapper;
function getTitleInOrder(order, index, coordinates) {
    const orderItem = order[index];
    if (Array.isArray(orderItem)) {
        const orderItemIndex = orderItem.findIndex((orderItem) => {
            return coordinates.find((field) => (field.fakeTitle === orderItem.title || field.title === orderItem.title) &&
                orderItem.datasetId === field.datasetId);
        });
        return orderItem[orderItemIndex === -1 ? 0 : orderItemIndex].title;
    }
    return orderItem.title;
}
function findIndexInOrder(order, field, title) {
    return order.findIndex((entry) => {
        if (Array.isArray(entry)) {
            const neededEntry = entry.find((entryEntry) => entryEntry.datasetId === field.datasetId);
            return neededEntry ? neededEntry.title === title : false;
        }
        else {
            return entry.title === title && entry.datasetId === field.datasetId;
        }
    });
}
function getAllPlaceholderItems(placeholders) {
    let items = [];
    placeholders.forEach((placeholder) => {
        items = [...items, ...placeholder.items];
    });
    return items;
}
function getSortedColumnId(value, isPivotTable) {
    var _a, _b;
    if (!value) {
        return undefined;
    }
    // eslint-disable-next-line security/detect-unsafe-regex
    const columnId = (_a = value.match(/(?<=_id=)(.*?)(?=_name=)/)) === null || _a === void 0 ? void 0 : _a[0];
    if (isPivotTable && columnId) {
        // eslint-disable-next-line security/detect-unsafe-regex
        return (_b = columnId.match(/(?<=fieldId=)(.*?)(?=__index)/)) === null || _b === void 0 ? void 0 : _b[0];
    }
    return columnId;
}
function getSortOrder(value) {
    if (!value) {
        return undefined;
    }
    return value === constants_1.SORT_ORDER.ASCENDING.NUM
        ? constants_1.SORT_ORDER.ASCENDING.STR
        : constants_1.SORT_ORDER.DESCENDING.STR;
}
function getSortData(params, isPivotTable) {
    const columnId = getSortedColumnId(params.columnId, isPivotTable);
    const order = getSortOrder(params.order);
    return { columnId, order };
}
function getDrillDownLevel(params) {
    return Number((params.drillDownLevel || ['0'])[0]);
}
function getDrillDownFilters(params) {
    let filters = params.drillDownFilters;
    if (!Array.isArray(filters)) {
        return;
    }
    filters = filters.map(String);
    if (filters.some(Boolean)) {
        return filters;
    }
    return;
}
function getDrillDownData(params) {
    return {
        drillDownLevel: getDrillDownLevel(params),
        drillDownFilters: getDrillDownFilters(params),
    };
}
function getPointRadius({ current, min, max, geopointsConfig, }) {
    const minRadius = geopointsConfig.minRadius || constants_1.DEFAULT_MIN_POINT_RADIUS;
    const maxRadius = geopointsConfig.maxRadius || constants_1.DEFAULT_MAX_POINT_RADIUS;
    const coeff = (maxRadius - minRadius) / (max - min || 1);
    return minRadius + (current - min) * (Number.isNaN(coeff) ? 0 : coeff);
}
function isNeedToCalcClosestPointManually(visualizationId, placeholders, colors) {
    var _a, _b;
    let placeholderId;
    switch (visualizationId) {
        case 'column':
            placeholderId = 'x';
            break;
        case 'bar':
            placeholderId = 'y';
            break;
    }
    if (!placeholderId) {
        return false;
    }
    const placeholderItem = (_b = (_a = placeholders === null || placeholders === void 0 ? void 0 : placeholders.find((pl) => pl.id === placeholderId)) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b[0];
    if (!placeholderItem) {
        return false;
    }
    const colorItem = colors === null || colors === void 0 ? void 0 : colors[0];
    return Boolean(colorItem && (0, shared_1.isDateField)(placeholderItem));
}
function getOriginalTitleOrTitle(field) {
    return field.originalTitle || field.title;
}
function getFieldTitle(field) {
    if (!field) {
        return '';
    }
    return field.fakeTitle || field.originalTitle || field.title;
}
function isTableBarsSettingsEnabled(field) {
    var _a;
    return Boolean((_a = field.barsSettings) === null || _a === void 0 ? void 0 : _a.enabled);
}
function isTableFieldBackgroundSettingsEnabled(field) {
    var _a;
    return Boolean(field && ((_a = field.backgroundSettings) === null || _a === void 0 ? void 0 : _a.enabled));
}
function isColumnSettingsWidthEnabled(field) {
    var _a;
    return Boolean((_a = field.columnSettings) === null || _a === void 0 ? void 0 : _a.width);
}
function getFormatOptionsFromFieldFormatting(formatting, dataType, isAxisFormatting = false) {
    let chartKitPrecision = 0;
    if (dataType === 'float' || isAxisFormatting) {
        const minimumFractionDigits = isAxisFormatting ? 0 : shared_1.MINIMUM_FRACTION_DIGITS;
        chartKitPrecision =
            typeof (formatting === null || formatting === void 0 ? void 0 : formatting.precision) === 'number'
                ? formatting.precision
                : minimumFractionDigits;
    }
    return typeof formatting === 'undefined' || (0, isEmpty_1.default)(formatting)
        ? {
            chartKitFormatting: true,
            chartKitPrecision,
        }
        : {
            chartKitFormatting: true,
            chartKitPrecision,
            chartKitPrefix: formatting.prefix,
            chartKitPostfix: formatting.postfix,
            chartKitUnit: formatting.unit,
            chartKitFormat: formatting.format,
            chartKitLabelMode: formatting.labelMode,
            chartKitShowRankDelimiter: formatting.showRankDelimiter,
        };
}
function isGradientMode({ colorField, colorsConfig, colorFieldDataType, }) {
    return ((0, shared_1.isMeasureField)(colorField) ||
        (0, shared_1.isMeasureValue)(colorField) ||
        (isNumericalDataType(colorFieldDataType) && colorsConfig.colorMode === shared_1.ColorMode.GRADIENT));
}
function isLegendEnabled(chartSetting) {
    return (chartSetting === null || chartSetting === void 0 ? void 0 : chartSetting.legendMode) !== "hide" /* LegendDisplayMode.Hide */;
}
function getLabelValue(value, options = {}) {
    const { isMarkdownLabel, isMarkupLabel, isHtmlLabel } = options;
    if (value === undefined) {
        return '';
    }
    if (isMarkdownLabel) {
        return (0, markdown_1.wrapMarkdownValue)(value);
    }
    if (isMarkupLabel) {
        return (0, shared_1.wrapMarkupValue)(value);
    }
    if (isHtmlLabel) {
        return (0, ui_sandbox_1.wrapHtml)(value);
    }
    return value;
}
function getCategoryFormatter(args) {
    const { field } = args;
    if ((0, shared_1.isDateField)(field)) {
        return (value) => {
            return formatDate({
                valueType: field.data_type,
                value,
                format: field.format,
                utc: true,
            });
        };
    }
    if ((0, index_1.isMarkdownField)(field)) {
        return (value) => (0, markdown_1.wrapMarkdownValue)(String(value));
    }
    if ((0, index_1.isHtmlField)(field)) {
        return (value) => (0, ui_sandbox_1.wrapHtml)(String(value));
    }
    return (value) => String(value);
}
function getSeriesTitleFormatter(args) {
    const { fields } = args;
    if (fields.some(index_1.isHtmlField)) {
        return (value) => (0, ui_sandbox_1.wrapHtml)(String(value !== null && value !== void 0 ? value : ''));
    }
    return (value) => value !== null && value !== void 0 ? value : '';
}
