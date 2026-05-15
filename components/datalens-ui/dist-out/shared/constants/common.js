"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDITOR_TYPE_CONFIG_TABS = exports.EDITOR_CHART_NODE = exports.QL_CHART_NODE = exports.WIZARD_CHART_NODE = exports.SHARED_URL_OPTIONS = exports.SCROLL_TITLE_DEBOUNCE_TIME = exports.UPDATE_STATE_DEBOUNCE_TIME = exports.TIME_FORMAT_24 = exports.TIME_FORMAT_12 = exports.DEFAULT_TIME_FORMAT = exports.DEFAULT_DATE_FORMAT = exports.DEFAULT_CHART_LINES_LIMIT = exports.URL_ACTION_PARAMS_PREFIX = exports.USER_SETTINGS_KEY = exports.FALLBACK_LANGUAGES = exports.DISABLE = exports.ENABLE = exports.DEFAULT_PAGE_SIZE = exports.DeviceType = exports.Language = exports.AppMode = exports.AppEnvironment = exports.AppInstallation = void 0;
const helpers_1 = require("@gravity-ui/dashkit/helpers");
const dash_1 = require("../types/dash");
var AppInstallation;
(function (AppInstallation) {
    AppInstallation["Opensource"] = "opensource";
})(AppInstallation || (exports.AppInstallation = AppInstallation = {}));
var AppEnvironment;
(function (AppEnvironment) {
    AppEnvironment["Production"] = "production";
    AppEnvironment["Preprod"] = "preprod";
    AppEnvironment["Development"] = "development";
    AppEnvironment["Staging"] = "staging";
    AppEnvironment["Prod"] = "prod";
})(AppEnvironment || (exports.AppEnvironment = AppEnvironment = {}));
var AppMode;
(function (AppMode) {
    AppMode["Full"] = "full";
    AppMode["Datalens"] = "datalens";
    AppMode["Charts"] = "charts";
    AppMode["Api"] = "api";
    AppMode["PublicApi"] = "public-api";
})(AppMode || (exports.AppMode = AppMode = {}));
var Language;
(function (Language) {
    Language["Ru"] = "ru";
    Language["En"] = "en";
})(Language || (exports.Language = Language = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["Phone"] = "phone";
    DeviceType["Tablet"] = "tablet";
    DeviceType["Desktop"] = "desktop";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
exports.DEFAULT_PAGE_SIZE = 1000;
exports.ENABLE = 'enable';
exports.DISABLE = 'disable';
exports.FALLBACK_LANGUAGES = [Language.En];
exports.USER_SETTINGS_KEY = 'userSettings';
exports.URL_ACTION_PARAMS_PREFIX = helpers_1.ACTION_PARAM_PREFIX;
exports.DEFAULT_CHART_LINES_LIMIT = 100;
exports.DEFAULT_DATE_FORMAT = 'DD.MM.YYYY';
exports.DEFAULT_TIME_FORMAT = '24';
exports.TIME_FORMAT_12 = 'h:mm a';
exports.TIME_FORMAT_24 = 'HH:mm';
exports.UPDATE_STATE_DEBOUNCE_TIME = 1000;
exports.SCROLL_TITLE_DEBOUNCE_TIME = 400;
exports.SHARED_URL_OPTIONS = {
    SAFE_CHART: '_safe_chart',
    WITHOUT_UI_SANDBOX_LIMIT: '_without_sandbox_time_limit',
};
exports.WIZARD_CHART_NODE = {
    graph_wizard_node: 'statface_graph',
    table_wizard_node: 'table',
    metric_wizard_node: 'statface_metric',
    markup_wizard_node: 'config',
    d3_wizard_node: 'config',
};
exports.QL_CHART_NODE = {
    graph_sql_node: 'statface_graph',
    graph_ql_node: 'statface_graph',
    timeseries_ql_node: 'statface_graph',
    table_sql_node: 'table',
    table_ql_node: 'table',
    markup_ql_node: 'config',
    metric2_ql_node: 'statface_graph',
};
exports.EDITOR_CHART_NODE = {
    graph_node: 'statface_graph',
    graph_billing_node: 'statface_graph',
    table_node: 'table',
    text_node: 'statface_text',
    metric_node: 'statface_metric',
    metric_sql_node: 'statface_metric',
    metric_ql_node: 'statface_metric',
    map_node: 'statface_map',
    markup_node: 'config',
    markdown_node: '',
    'blank-chart_node': 'config',
    'advanced-chart_node': 'config',
    d3_node: 'd3',
};
exports.EDITOR_TYPE_CONFIG_TABS = {
    ...exports.WIZARD_CHART_NODE,
    ...exports.QL_CHART_NODE,
    ...exports.EDITOR_CHART_NODE,
    module: '',
    control_dash: dash_1.ControlType.Dash,
};
