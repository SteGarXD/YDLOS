"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASH_DATA_REQUIRED_FIELDS = exports.LOADED_DASH_CLASS = exports.DASH_CURRENT_SCHEME_VERSION = exports.RESTRICTED_PARAM_NAMES = exports.FOCUSED_WIDGET_PARAM_NAME = exports.DASH_GRID_LAYOUT = exports.Weekday = exports.DashMailingChartWidth = exports.DashMailingChartHeight = void 0;
var DashMailingChartHeight;
(function (DashMailingChartHeight) {
    DashMailingChartHeight["Original"] = "original";
    DashMailingChartHeight["280px"] = "280";
    DashMailingChartHeight["320px"] = "320";
    DashMailingChartHeight["480px"] = "480";
    DashMailingChartHeight["640px"] = "640";
    DashMailingChartHeight["720px"] = "720";
})(DashMailingChartHeight || (exports.DashMailingChartHeight = DashMailingChartHeight = {}));
var DashMailingChartWidth;
(function (DashMailingChartWidth) {
    DashMailingChartWidth["Full"] = "full";
    DashMailingChartWidth["600px"] = "600";
})(DashMailingChartWidth || (exports.DashMailingChartWidth = DashMailingChartWidth = {}));
var Weekday;
(function (Weekday) {
    Weekday["Mon"] = "mon";
    Weekday["Tue"] = "tue";
    Weekday["Wed"] = "wed";
    Weekday["Thu"] = "thu";
    Weekday["Fri"] = "fri";
    Weekday["Sat"] = "sat";
    Weekday["Sun"] = "sun";
})(Weekday || (exports.Weekday = Weekday = {}));
exports.DASH_GRID_LAYOUT = {
    ROW_HEIGHT: 18,
    MARGIN: 8,
    COLS: 36,
};
exports.FOCUSED_WIDGET_PARAM_NAME = 'focus';
exports.RESTRICTED_PARAM_NAMES = [
    'tab',
    'state',
    'mode',
    exports.FOCUSED_WIDGET_PARAM_NAME,
    'grid',
    'scale',
    'tz',
    'timezone',
    'date',
    'datetime',
    'genericdatetime',
];
exports.DASH_CURRENT_SCHEME_VERSION = 8;
exports.LOADED_DASH_CLASS = 'dash-body-loaded';
exports.DASH_DATA_REQUIRED_FIELDS = [
    'salt',
    'counter',
    'schemeVersion',
    'tabs',
    'settings',
];
