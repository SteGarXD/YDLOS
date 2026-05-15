"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCellValueForHeader = exports.getDatasetFieldFromPivotTableValue = exports.parsePivotTableCellId = exports.getPivotTableCellId = exports.getAnnotationsMap = exports.getAnnotation = exports.getPivotTableSettingsFromField = exports.getValuesByField = exports.getActualizedPlaceholderItem = void 0;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const barsSettings_1 = require("../../helpers/barsSettings");
const misc_1 = require("../constants/misc");
const getActualizedPlaceholderItem = (placeholderItem, options) => {
    const { idToDataType, idToTitle } = options;
    const actualDataType = idToDataType[placeholderItem.guid] || placeholderItem.data_type;
    const actualTitle = idToTitle[placeholderItem.guid] || placeholderItem.title;
    return {
        ...placeholderItem,
        data_type: actualDataType,
        title: actualTitle,
    };
};
exports.getActualizedPlaceholderItem = getActualizedPlaceholderItem;
const getValuesByField = (args) => {
    const { rows, fieldsItemIdMap, placeholders } = args;
    const measuresPlaceholder = placeholders.find((placeholder) => placeholder.id === shared_1.PlaceholderId.Measures);
    const measures = (measuresPlaceholder === null || measuresPlaceholder === void 0 ? void 0 : measuresPlaceholder.items) || [];
    const isBarInTotalsEnabledMap = measures.reduce((acc, field) => {
        if ((0, misc_helpers_1.isTableBarsSettingsEnabled)(field)) {
            acc[field.guid] = field.barsSettings.showBarsInTotals;
        }
        return acc;
    }, {});
    return rows.reduce((acc, row) => {
        row.values.forEach((rowValue) => {
            if (rowValue) {
                const [value, legendItemId] = rowValue[0];
                const pivotField = fieldsItemIdMap[legendItemId];
                const isTotalValue = pivotField.role_spec.role === 'total';
                if (isTotalValue && !isBarInTotalsEnabledMap[pivotField.id]) {
                    return;
                }
                if (acc[pivotField.id]) {
                    acc[pivotField.id].push(value);
                }
                else {
                    acc[pivotField.id] = [value];
                }
            }
        });
        return acc;
    }, {});
};
exports.getValuesByField = getValuesByField;
const getPivotTableSettingsFromField = (field, prevSettings, placeholderId, valueByField) => {
    var _a;
    const settings = {};
    if ((0, misc_helpers_1.isColumnSettingsWidthEnabled)(field)) {
        settings.columnSettings = prevSettings.columnSettings || {};
        switch (placeholderId) {
            case shared_1.PlaceholderId.PivotTableColumns:
                settings.columnSettings.column = field.columnSettings;
                break;
            case shared_1.PlaceholderId.PivotTableRows:
                settings.columnSettings.row = field.columnSettings;
                break;
            default:
                break;
        }
    }
    if ((0, misc_helpers_1.isTableBarsSettingsEnabled)(field)) {
        const columnValues = valueByField[field.guid];
        if (columnValues) {
            settings.barsSettings = {
                options: (0, barsSettings_1.getBarSettingsViewOptions)({
                    barsSettings: field.barsSettings,
                    columnValues,
                }),
                columnValues,
            };
        }
    }
    if ((0, misc_helpers_1.isTableFieldBackgroundSettingsEnabled)(field)) {
        // YDL OS: при отсутствии у field (например дашборд присылает урезанный конфиг) не затираем prevSettings
        settings.backgroundSettings = (_a = field.backgroundSettings) !== null && _a !== void 0 ? _a : prevSettings.backgroundSettings;
    }
    return settings;
};
exports.getPivotTableSettingsFromField = getPivotTableSettingsFromField;
const getAnnotation = (cellData, annotationsMap, annotation) => {
    return cellData.find(([_value, _legendItemId, pivotItemId]) => annotationsMap[pivotItemId] === annotation);
};
exports.getAnnotation = getAnnotation;
const getAnnotationsMap = (structure) => {
    const annotationsMap = {};
    structure.forEach((structEl) => {
        var _a;
        if (((_a = structEl === null || structEl === void 0 ? void 0 : structEl.role_spec) === null || _a === void 0 ? void 0 : _a.role) === 'pivot_annotation' &&
            structEl.role_spec.annotation_type) {
            annotationsMap[structEl.pivot_item_id] = structEl.role_spec.annotation_type;
        }
    });
    return annotationsMap;
};
exports.getAnnotationsMap = getAnnotationsMap;
const getPivotTableCellId = (guid, id) => {
    return `fieldId=${guid || ''}__index=${id.current++}`;
};
exports.getPivotTableCellId = getPivotTableCellId;
const parsePivotTableCellId = (id) => {
    const [templateFieldId, templateIndex] = id.split('__');
    if (!templateFieldId || !templateIndex) {
        return { guid: id };
    }
    const fieldId = templateFieldId.replace('fieldId=', '');
    const index = templateIndex.replace('index=', '');
    return {
        guid: fieldId,
        index,
    };
};
exports.parsePivotTableCellId = parsePivotTableCellId;
const getDatasetFieldFromPivotTableValue = (pivotDataRowValue, fieldsItemIdMap, fieldDict) => {
    const pivotDataCellValue = pivotDataRowValue[0];
    const [value, legendItemId] = pivotDataCellValue;
    const field = fieldsItemIdMap[legendItemId];
    const isMeasure = field.item_type === 'measure_name';
    const fieldGuid = isMeasure ? value.replace('title-', '') : field.id;
    return fieldDict[fieldGuid];
};
exports.getDatasetFieldFromPivotTableValue = getDatasetFieldFromPivotTableValue;
const getCellValueForHeader = (cellValue, options = {}) => {
    const { pivotField, datasetField } = options;
    const isMeasureName = (pivotField === null || pivotField === void 0 ? void 0 : pivotField.id) === misc_1.MEASURE_NAME_PSEUDO_ID;
    if (cellValue && ((0, shared_1.isMarkupField)(datasetField) || (0, shared_1.isMarkupItem)(cellValue))) {
        return (0, shared_1.markupToRawString)(cellValue);
    }
    if (isMeasureName) {
        return (datasetField === null || datasetField === void 0 ? void 0 : datasetField.fakeTitle) || cellValue;
    }
    return cellValue;
};
exports.getCellValueForHeader = getCellValueForHeader;
