"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChartSupportMultipleColors = exports.getColorsConfigKey = void 0;
const constants_1 = require("../../constants");
const fields_1 = require("../fields");
const getColorsConfigKey = (field, fields, options) => {
    if (options.isMeasureNames) {
        const fieldTitle = (0, fields_1.getFakeTitleOrTitle)(field);
        const isFieldWithSameNameExist = fields.some((item) => (0, fields_1.getFakeTitleOrTitle)(item) === fieldTitle && item.datasetId !== field.datasetId);
        if (isFieldWithSameNameExist) {
            return `${fieldTitle} (${field.datasetName})`;
        }
        return fieldTitle;
    }
    return undefined;
};
exports.getColorsConfigKey = getColorsConfigKey;
const chartTypeWithMultipleColors = {
    [constants_1.QLChartType.Monitoringql]: {
        [constants_1.WizardVisualizationId.Line]: true,
        [constants_1.WizardVisualizationId.Area]: true,
        [constants_1.WizardVisualizationId.Area100p]: true,
        [constants_1.WizardVisualizationId.Column]: true,
        [constants_1.WizardVisualizationId.Column100p]: true,
        [constants_1.WizardVisualizationId.Bar]: true,
        [constants_1.WizardVisualizationId.Bar100p]: true,
    },
};
const isChartSupportMultipleColors = (chartType, visualizationId) => { var _a; return Boolean((_a = chartTypeWithMultipleColors[chartType]) === null || _a === void 0 ? void 0 : _a[visualizationId]); };
exports.isChartSupportMultipleColors = isChartSupportMultipleColors;
