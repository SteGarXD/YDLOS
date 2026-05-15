"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldUseGradientLegend = shouldUseGradientLegend;
exports.getLegendColorScale = getLegendColorScale;
const shared_1 = require("../../../../../../../shared");
const get_gradient_stops_1 = require("../../utils/get-gradient-stops");
const misc_helpers_1 = require("../../utils/misc-helpers");
function shouldUseGradientLegend(colorField, colorsConfig, shared) {
    var _a;
    if (!colorField) {
        return false;
    }
    const isCombinedChartColorizedBySomeDimenstion = shared.visualization.id === shared_1.WizardVisualizationId.CombinedChart &&
        ((_a = shared.visualization.layers) === null || _a === void 0 ? void 0 : _a.some((layer) => layer.commonPlaceholders.colors.some(shared_1.isDimensionField)));
    const isGradient = (0, misc_helpers_1.isGradientMode)({
        colorField,
        colorFieldDataType: colorField.data_type,
        colorsConfig,
    });
    return isGradient && !isCombinedChartColorizedBySomeDimenstion;
}
function getLegendColorScale({ colorsConfig, points, }) {
    const colorValues = points
        .map((point) => point.colorValue)
        .filter((d) => Boolean(d));
    const minColorValue = Math.min(...colorValues);
    const maxColorValue = Math.max(...colorValues);
    const colorScaleColors = [...colorsConfig.gradientColors];
    if (colorsConfig.reversed) {
        colorScaleColors.reverse();
    }
    let stops = colorsConfig.gradientColors.length === 2 ? [0, 1] : [0, 0.5, 1];
    if (colorsConfig && typeof minColorValue === 'number' && typeof maxColorValue === 'number') {
        stops = (0, get_gradient_stops_1.getGradientStops)({ colorsConfig, points, minColorValue, maxColorValue });
    }
    if (stops[0] > 0) {
        stops.unshift(0);
        colorScaleColors.unshift(colorScaleColors[0]);
    }
    if (stops[stops.length - 1] < 1) {
        stops.push(1);
        colorScaleColors.push(colorScaleColors[colorScaleColors.length - 1]);
    }
    return { colors: colorScaleColors, stops };
}
