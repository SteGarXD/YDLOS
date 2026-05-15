"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxisModeDisabledReason = exports.isAllAxisModesAvailable = exports.isPlaceholderSupportsAxisMode = exports.isVisualizationWithSeveralFieldsXPlaceholder = exports.isPercentVisualization = exports.filterUpdatesByDatasetId = exports.getResultSchemaFromDataset = exports.getDefaultFormatting = exports.createMeasureValues = exports.createMeasureNames = exports.isMeasureNameOrValue = exports.isMeasureType = exports.isMeasureValue = exports.isMeasureName = void 0;
exports.markupToRawString = markupToRawString;
exports.getDeltasByColorValuesMap = getDeltasByColorValuesMap;
exports.getRgbColorValue = getRgbColorValue;
exports.getRangeDelta = getRangeDelta;
exports.doesSortingAffectAxisMode = doesSortingAffectAxisMode;
exports.isContinuousAxisModeDisabled = isContinuousAxisModeDisabled;
const constants_1 = require("../constants");
const types_1 = require("../types");
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const isMeasureName = (field) => field.type === 'PSEUDO' &&
    (field.title === constants_1.PseudoFieldTitle.MeasureNames || field.title === constants_1.PseudoFieldTitle.ColumnNames);
exports.isMeasureName = isMeasureName;
const isMeasureValue = (field) => (field === null || field === void 0 ? void 0 : field.type) === 'PSEUDO' && (field === null || field === void 0 ? void 0 : field.title) === constants_1.PseudoFieldTitle.MeasureValues;
exports.isMeasureValue = isMeasureValue;
const isMeasureType = (field) => field.type === 'MEASURE';
exports.isMeasureType = isMeasureType;
const isMeasureNameOrValue = (field) => (0, exports.isMeasureName)(field) || (0, exports.isMeasureValue)(field);
exports.isMeasureNameOrValue = isMeasureNameOrValue;
const createMeasureNames = (isQL) => ({
    title: isQL ? constants_1.PseudoFieldTitle.ColumnNames : constants_1.PseudoFieldTitle.MeasureNames,
    type: types_1.DatasetFieldType.Pseudo,
    className: 'item pseudo-item dimension-item',
    data_type: types_1.DATASET_FIELD_TYPES.STRING,
});
exports.createMeasureNames = createMeasureNames;
const createMeasureValues = () => ({
    title: constants_1.PseudoFieldTitle.MeasureValues,
    type: types_1.DatasetFieldType.Pseudo,
    className: 'item pseudo-item measure-item',
    data_type: types_1.DATASET_FIELD_TYPES.FLOAT,
});
exports.createMeasureValues = createMeasureValues;
const getDefaultFormatting = (field) => {
    var _a;
    if (!field) {
        return {};
    }
    const fieldUISettings = (0, utils_1.getFieldUISettings)({ field });
    return {
        ...constants_1.DEFAULT_FORMATTING,
        precision: (0, types_1.isFloatField)(field) ? constants_1.DEFAULT_FLOAT_NUMBERS : constants_1.DEFAULT_INTEGER_NUMBERS,
        ...fieldUISettings === null || fieldUISettings === void 0 ? void 0 : fieldUISettings.numberFormatting,
        labelMode: field.labelMode ||
            ((_a = fieldUISettings === null || fieldUISettings === void 0 ? void 0 : fieldUISettings.numberFormatting) === null || _a === void 0 ? void 0 : _a.labelMode) ||
            constants_1.DEFAULT_FORMATTING.labelMode,
    };
};
exports.getDefaultFormatting = getDefaultFormatting;
const getResultSchemaFromDataset = (dataset) => {
    if (!dataset) {
        return [];
    }
    const schema = ('dataset' in dataset ? dataset.dataset.result_schema : dataset.result_schema);
    // Return the default empty array, because some cases
    // there may be a dataset without result_schema
    return schema || [];
};
exports.getResultSchemaFromDataset = getResultSchemaFromDataset;
const filterUpdatesByDatasetId = (updates, datasetId) => {
    return updates.filter((update) => {
        return (
        // Checking for typeof - fallback, because in the old charts updates did not contain datasetId
        typeof update.field.datasetId === 'undefined' || update.field.datasetId === datasetId);
    });
};
exports.filterUpdatesByDatasetId = filterUpdatesByDatasetId;
const isPercentVisualization = (visualizationId) => constants_1.PERCENT_VISUALIZATIONS.has(visualizationId);
exports.isPercentVisualization = isPercentVisualization;
const isVisualizationWithSeveralFieldsXPlaceholder = (visualizationId) => constants_1.VISUALIZATIONS_WITH_SEVERAL_FIELDS_X_PLACEHOLDER.has(visualizationId);
exports.isVisualizationWithSeveralFieldsXPlaceholder = isVisualizationWithSeveralFieldsXPlaceholder;
function markupToRawString(obj, str = '') {
    let text = str;
    if (obj.children) {
        text =
            text +
                obj.children
                    .map((item) => {
                    if (typeof item === 'string') {
                        return item;
                    }
                    return markupToRawString(item, text);
                })
                    .join('');
    }
    else if (obj.content && typeof obj.content === 'string') {
        text = text + obj.content;
    }
    else if (obj.content && typeof obj.content === 'object') {
        text = markupToRawString(obj.content, text);
    }
    return text;
}
function getDeltasByColorValuesMap(colorValues, min, range) {
    return colorValues.reduce((acc, colorValue) => {
        const delta = getRangeDelta(colorValue, min, range);
        if (typeof colorValue !== 'number' || typeof delta !== 'number') {
            return acc;
        }
        return {
            ...acc,
            [colorValue]: delta,
        };
    }, {});
}
function getRgbColorValue(delta, gradientMode, rangeMiddleRatio, colors) {
    let resultDelta = delta;
    let shadeA;
    let shadeB;
    if (gradientMode === constants_1.GradientType.THREE_POINT) {
        if (delta >= rangeMiddleRatio) {
            // ../technotes.md -> utils/colors-helpers p1
            resultDelta = delta === 1 ? delta : delta - rangeMiddleRatio;
            shadeA = colors[1];
            shadeB = colors[2];
        }
        else {
            shadeA = colors[0];
            shadeB = colors[1];
        }
    }
    else {
        shadeA = colors[0];
        shadeB = colors[1];
    }
    const red = Math.floor((shadeB.red - shadeA.red) * resultDelta + shadeA.red);
    const green = Math.floor((shadeB.green - shadeA.green) * resultDelta + shadeA.green);
    const blue = Math.floor((shadeB.blue - shadeA.blue) * resultDelta + shadeA.blue);
    return `rgb(${red}, ${green}, ${blue})`;
}
function getRangeDelta(colorValue, min, range) {
    let delta = typeof colorValue === 'number' ? (colorValue - min) / range : null;
    if (delta !== null) {
        if (delta > 1) {
            delta = 1;
        }
        else if (delta < 0) {
            delta = 0;
        }
    }
    return delta;
}
const isPlaceholderSupportsAxisMode = (placeholderId, visualizationId) => {
    const isReversedXYPlaceholderVisualization = visualizationId === constants_1.WizardVisualizationId.Bar ||
        visualizationId === constants_1.WizardVisualizationId.Bar100p;
    const isXPlaceholder = placeholderId === constants_1.PlaceholderId.X && !isReversedXYPlaceholderVisualization;
    const isReversedYPlaceholder = placeholderId === constants_1.PlaceholderId.Y && isReversedXYPlaceholderVisualization;
    return isXPlaceholder || isReversedYPlaceholder;
};
exports.isPlaceholderSupportsAxisMode = isPlaceholderSupportsAxisMode;
const isAllAxisModesAvailable = (field) => {
    return (0, types_1.isNumberField)(field) || (0, types_1.isDateField)(field);
};
exports.isAllAxisModesAvailable = isAllAxisModesAvailable;
function doesSortingAffectAxisMode(visualizationId) {
    return ![
        constants_1.WizardVisualizationId.Area,
        constants_1.WizardVisualizationId.Area100p,
        constants_1.WizardVisualizationId.Column100p,
        constants_1.WizardVisualizationId.Bar100p,
        constants_1.WizardVisualizationId.BarYD3,
        constants_1.WizardVisualizationId.BarY100pD3,
    ].includes(visualizationId);
}
var AxisModeDisabledReason;
(function (AxisModeDisabledReason) {
    AxisModeDisabledReason["FieldType"] = "fieldType";
    AxisModeDisabledReason["HasSortingField"] = "sorting";
    AxisModeDisabledReason["Unknown"] = "unknown";
})(AxisModeDisabledReason || (exports.AxisModeDisabledReason = AxisModeDisabledReason = {}));
function isContinuousAxisModeDisabled(args) {
    const { field, axisSettings, visualizationId, sort } = args;
    if (!(0, exports.isAllAxisModesAvailable)(field)) {
        return AxisModeDisabledReason.FieldType;
    }
    const disableDueToSorting = doesSortingAffectAxisMode(visualizationId) && sort.some(helpers_1.isMeasureField);
    if (disableDueToSorting) {
        return AxisModeDisabledReason.HasSortingField;
    }
    if (axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.disableAxisMode) {
        return AxisModeDisabledReason.Unknown;
    }
    return null;
}
