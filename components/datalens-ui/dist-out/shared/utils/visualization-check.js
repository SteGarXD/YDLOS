"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMonitoringOrPrometheusChart = isMonitoringOrPrometheusChart;
exports.isYAGRVisualization = isYAGRVisualization;
exports.getItemLinkWithDatasets = getItemLinkWithDatasets;
exports.isD3Visualization = isD3Visualization;
exports.isGravityChartsVisualization = isGravityChartsVisualization;
const shared_1 = require("../../shared");
const constants_1 = require("../constants");
function isMonitoringOrPrometheusChart(chartType) {
    return chartType === constants_1.QLChartType.Monitoringql || chartType === constants_1.QLChartType.Promql;
}
function isYAGRVisualization(chartType, visualizationId) {
    const isMonitoringOrPrometheus = isMonitoringOrPrometheusChart(chartType);
    return (isMonitoringOrPrometheus &&
        ['line', 'area', 'area100p', 'column', 'column100p'].includes(visualizationId));
}
function getItemLinkWithDatasets(item, datasetId, links) {
    const targetLink = item.datasetId &&
        links.find((link) => {
            var _a;
            return ((_a = link.fields[item.datasetId]) === null || _a === void 0 ? void 0 : _a.field.guid) === item.guid && link.fields[datasetId];
        });
    return targetLink;
}
function isD3Visualization(id) {
    const d3Visualizations = [
        shared_1.WizardVisualizationId.ScatterD3,
        shared_1.WizardVisualizationId.PieD3,
        shared_1.WizardVisualizationId.BarXD3,
        shared_1.WizardVisualizationId.LineD3,
        shared_1.WizardVisualizationId.DonutD3,
        shared_1.WizardVisualizationId.BarYD3,
        shared_1.WizardVisualizationId.BarY100pD3,
        shared_1.WizardVisualizationId.TreemapD3,
    ];
    return d3Visualizations.includes(id);
}
function isGravityChartsVisualization({ id, features, }) {
    const isPieOrTreemap = [
        shared_1.WizardVisualizationId.Pie,
        shared_1.WizardVisualizationId.Donut,
        shared_1.WizardVisualizationId.Treemap,
    ].includes(id);
    if (isPieOrTreemap && (features === null || features === void 0 ? void 0 : features[shared_1.Feature.GravityChartsForPieAndTreemap])) {
        return true;
    }
    const isScatterOrBarY = [
        shared_1.WizardVisualizationId.Bar,
        shared_1.WizardVisualizationId.Bar100p,
        shared_1.WizardVisualizationId.Scatter,
    ].includes(id);
    if (isScatterOrBarY && (features === null || features === void 0 ? void 0 : features[shared_1.Feature.GravityChartsForBarYAndScatter])) {
        return true;
    }
    const isLineAreaOrBarX = [
        shared_1.WizardVisualizationId.Line,
        shared_1.WizardVisualizationId.Area,
        shared_1.WizardVisualizationId.Area100p,
        shared_1.WizardVisualizationId.Column,
        shared_1.WizardVisualizationId.Column100p,
        shared_1.WizardVisualizationId.CombinedChart,
    ].includes(id);
    if (isLineAreaOrBarX && (features === null || features === void 0 ? void 0 : features[shared_1.Feature.GravityChartsForLineAreaAndBarX])) {
        return true;
    }
    return isD3Visualization(id);
}
