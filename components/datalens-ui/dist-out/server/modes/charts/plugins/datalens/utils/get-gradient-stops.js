"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGradientStops = getGradientStops;
exports.getHighchartsGradientStops = getHighchartsGradientStops;
const shared_1 = require("../../../../../../shared");
const color_helpers_1 = require("./color-helpers");
function getGradientStops(args) {
    const { colorsConfig, points, minColorValue, maxColorValue } = args;
    const colorValues = points.map((point) => typeof point.colorValue === 'number' ? point.colorValue : null);
    const { mid, min, max } = (0, color_helpers_1.getThresholdValues)(colorsConfig, colorValues);
    const colorValueRange = maxColorValue - minColorValue;
    let stops = [];
    if (colorsConfig.gradientMode === shared_1.GradientType.TWO_POINT ||
        colorsConfig.gradientColors.length === 2) {
        stops = [(min - minColorValue) / colorValueRange, (max - minColorValue) / colorValueRange];
    }
    else {
        stops = [
            (min - minColorValue) / colorValueRange,
            (mid - minColorValue) / colorValueRange,
            (max - minColorValue) / colorValueRange,
        ];
    }
    return stops;
}
function getHighchartsGradientStops(args) {
    const { colorsConfig, points, minColorValue, maxColorValue } = args;
    const stops = getGradientStops({ colorsConfig, points, minColorValue, maxColorValue });
    const gradient = (0, color_helpers_1.getCurrentGradient)(colorsConfig);
    const gradientColors = (0, color_helpers_1.getRgbColors)(gradient.colors, Boolean(colorsConfig.reversed));
    return gradientColors.map((color, i) => [
        stops[i],
        `rgb(${color.red}, ${color.green}, ${color.blue})`,
    ]);
}
