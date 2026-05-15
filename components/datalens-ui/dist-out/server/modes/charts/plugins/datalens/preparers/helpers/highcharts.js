"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHighchartsColorAxis = getHighchartsColorAxis;
exports.isXAxisReversed = isXAxisReversed;
const shared_1 = require("../../../../../../../shared");
const get_gradient_stops_1 = require("../../utils/get-gradient-stops");
function getHighchartsColorAxis(graphs, colorsConfig) {
    const points = graphs.reduce((acc, graph) => [...acc, ...graph.data], []);
    const colorValues = points
        .map((point) => point.colorValue)
        .filter((cv) => Boolean(cv));
    const minColorValue = Math.min(...colorValues);
    const maxColorValue = Math.max(...colorValues);
    return {
        startOnTick: false,
        endOnTick: false,
        min: minColorValue,
        max: maxColorValue,
        stops: (0, get_gradient_stops_1.getHighchartsGradientStops)({ colorsConfig, points, minColorValue, maxColorValue }),
    };
}
function isXAxisReversed(xField, sortFields, visualizationId) {
    if ((0, shared_1.isDateField)(xField) || (0, shared_1.isNumberField)(xField)) {
        const sortXItem = sortFields.find((s) => s.guid === xField.guid);
        if (sortXItem && (sortXItem.direction === 'DESC' || !sortXItem.direction)) {
            // It turns out that in order to expand the X-axis for a Bar chart in Highcharts, you need to pass false
            // While in all other types of charts you need to pass true
            return ![shared_1.WizardVisualizationId.Bar, shared_1.WizardVisualizationId.Bar100p].includes(visualizationId);
        }
    }
    return undefined;
}
