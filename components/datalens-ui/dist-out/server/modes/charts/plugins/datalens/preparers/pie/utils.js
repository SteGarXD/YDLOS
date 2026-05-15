"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedValue = getFormattedValue;
exports.isColoringByMeasure = isColoringByMeasure;
exports.isDonut = isDonut;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
function getFormattedValue(value, field) {
    if (value === null) {
        return null;
    }
    if ((0, shared_1.isDateField)(field)) {
        return (0, misc_helpers_1.formatDate)({
            valueType: field.data_type,
            value,
            format: field.format,
        });
    }
    if ((0, shared_1.isNumberField)(field)) {
        return (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(value), {
            lang: 'ru',
            ...(0, shared_1.getFormatOptions)(field),
        });
    }
    return String(value);
}
function isColoringByMeasure(args) {
    var _a;
    const { colorsConfig, placeholders, idToDataType } = args;
    const colorField = (_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.Colors)) === null || _a === void 0 ? void 0 : _a.items[0];
    if (!colorField) {
        return false;
    }
    const colorFieldDataType = idToDataType[colorField.guid] || colorField.data_type;
    const gradientMode = (0, misc_helpers_1.isGradientMode)({ colorField, colorFieldDataType, colorsConfig });
    return (0, misc_helpers_1.isNumericalDataType)(colorFieldDataType) && Boolean(gradientMode);
}
function isDonut({ visualizationId }) {
    return (visualizationId === shared_1.WizardVisualizationId.Donut ||
        visualizationId === shared_1.WizardVisualizationId.DonutD3);
}
