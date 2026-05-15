"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISUALIZATIONS_WITH_LABELS_POSITION = exports.VISUALIZATIONS_WITH_LABELS = exports.VISUALIZATIONS_WITH_SEVERAL_FIELDS_X_PLACEHOLDER = exports.PERCENT_VISUALIZATIONS = exports.QlVisualizationId = exports.WizardVisualizationId = void 0;
var WizardVisualizationId;
(function (WizardVisualizationId) {
    WizardVisualizationId["Line"] = "line";
    WizardVisualizationId["LineD3"] = "line-d3";
    WizardVisualizationId["Area"] = "area";
    WizardVisualizationId["Area100p"] = "area100p";
    WizardVisualizationId["Column"] = "column";
    WizardVisualizationId["Column100p"] = "column100p";
    WizardVisualizationId["Bar"] = "bar";
    WizardVisualizationId["BarYD3"] = "bar-y-d3";
    WizardVisualizationId["Bar100p"] = "bar100p";
    WizardVisualizationId["BarY100pD3"] = "bar-y-100p-d3";
    WizardVisualizationId["BarXD3"] = "bar-x-d3";
    WizardVisualizationId["Scatter"] = "scatter";
    WizardVisualizationId["ScatterD3"] = "scatter-d3";
    WizardVisualizationId["Pie"] = "pie";
    WizardVisualizationId["PieD3"] = "pie-d3";
    WizardVisualizationId["Donut"] = "donut";
    WizardVisualizationId["DonutD3"] = "donut-d3";
    WizardVisualizationId["Metric"] = "metric";
    WizardVisualizationId["Gauge"] = "gauge";
    WizardVisualizationId["Treemap"] = "treemap";
    WizardVisualizationId["TreemapD3"] = "treemap-d3";
    WizardVisualizationId["FlatTable"] = "flatTable";
    WizardVisualizationId["PivotTable"] = "pivotTable";
    WizardVisualizationId["Geolayer"] = "geolayer";
    WizardVisualizationId["Geopoint"] = "geopoint";
    WizardVisualizationId["Geopolygon"] = "geopolygon";
    WizardVisualizationId["GeopointWithCluster"] = "geopoint-with-cluster";
    WizardVisualizationId["CombinedChart"] = "combined-chart";
})(WizardVisualizationId || (exports.WizardVisualizationId = WizardVisualizationId = {}));
var QlVisualizationId;
(function (QlVisualizationId) {
    QlVisualizationId["Line"] = "line";
    QlVisualizationId["Area"] = "area";
    QlVisualizationId["Area100p"] = "area100p";
    QlVisualizationId["Column"] = "column";
    QlVisualizationId["Column100p"] = "column100p";
    QlVisualizationId["Bar"] = "bar";
    QlVisualizationId["Pie"] = "pie";
    QlVisualizationId["Metric"] = "metric";
    QlVisualizationId["FlatTable"] = "table";
})(QlVisualizationId || (exports.QlVisualizationId = QlVisualizationId = {}));
exports.PERCENT_VISUALIZATIONS = new Set([
    WizardVisualizationId.Bar100p,
    WizardVisualizationId.BarY100pD3,
    WizardVisualizationId.Column100p,
    WizardVisualizationId.Area100p,
]);
exports.VISUALIZATIONS_WITH_SEVERAL_FIELDS_X_PLACEHOLDER = new Set([
    WizardVisualizationId.Column,
    WizardVisualizationId.Column100p,
    WizardVisualizationId.Bar,
    WizardVisualizationId.Bar100p,
    WizardVisualizationId.BarXD3,
    WizardVisualizationId.BarYD3,
    WizardVisualizationId.BarY100pD3,
]);
exports.VISUALIZATIONS_WITH_LABELS = new Set([
    WizardVisualizationId.Line,
    WizardVisualizationId.Area,
    WizardVisualizationId.Area100p,
    WizardVisualizationId.Column,
    WizardVisualizationId.Column100p,
    WizardVisualizationId.Bar,
    WizardVisualizationId.Bar100p,
    WizardVisualizationId.BarXD3,
    WizardVisualizationId.BarYD3,
    WizardVisualizationId.BarY100pD3,
]);
exports.VISUALIZATIONS_WITH_LABELS_POSITION = new Set([
    WizardVisualizationId.Column,
    WizardVisualizationId.Bar,
    WizardVisualizationId.BarXD3,
    WizardVisualizationId.BarYD3,
]);
