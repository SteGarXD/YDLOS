"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToGravityChartValueFormat = mapToGravityChartValueFormat;
const shared_1 = require("../../../../../../shared");
const format_1 = require("../gravity-charts/utils/format");
function mapToGravityChartValueFormat({ field, formatSettings, }) {
    const isNumber = (0, shared_1.isNumberField)(field) || (0, shared_1.isMeasureValue)(field);
    if (isNumber && formatSettings) {
        return {
            type: 'number',
            precision: formatSettings.chartKitPrecision,
            showRankDelimiter: formatSettings.chartKitShowRankDelimiter,
            labelMode: formatSettings.chartKitLabelMode,
            format: formatSettings.chartKitFormat, // ?
            prefix: formatSettings.chartKitPrefix,
            postfix: formatSettings.chartKitPostfix,
            unit: formatSettings.chartKitUnit,
        };
    }
    return (0, format_1.getFieldFormatOptions)({ field });
}
