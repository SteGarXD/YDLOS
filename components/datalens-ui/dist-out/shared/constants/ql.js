"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QLParamType = exports.QLChartType = exports.VISUALIZATION_IDS = void 0;
exports.VISUALIZATION_IDS = {
    LINE: 'line',
    AREA: 'area',
    AREA_100P: 'area100p',
    COLUMN: 'column',
    COLUMN_100P: 'column100p',
    BAR: 'bar',
    BAR_100P: 'bar100p',
    PIE: 'pie',
    DONUT: 'donut',
    METRIC: 'metric',
    TABLE: 'table',
};
var QLChartType;
(function (QLChartType) {
    QLChartType["Sql"] = "sql";
    QLChartType["Promql"] = "promql";
    QLChartType["Monitoringql"] = "monitoringql";
})(QLChartType || (exports.QLChartType = QLChartType = {}));
var QLParamType;
(function (QLParamType) {
    QLParamType["String"] = "string";
    QLParamType["Number"] = "number";
    QLParamType["Boolean"] = "boolean";
    QLParamType["Date"] = "date";
    QLParamType["Datetime"] = "datetime";
    QLParamType["DateInterval"] = "date-interval";
    QLParamType["DatetimeInterval"] = "datetime-interval";
})(QLParamType || (exports.QLParamType = QLParamType = {}));
