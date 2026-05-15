"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTRY_TYPES = exports.EDITOR_TYPE = exports.LEGACY_EDITOR_TYPE = exports.QL_TYPE = exports.WIZARD_TYPES = exports.LEGACY_WIZARD_TYPE = exports.MAX_SLUG_LENGTH = exports.ENTRY_SLUG_SEPARATOR = exports.ENTRY_ID_LENGTH = exports.ENTRY_ROUTES = exports.CONNECTIONS_ROUTE = exports.DATASETS_ROUTE = exports.EDITOR_ROUTE = exports.PREVIEW_ROUTE = exports.QL_ROUTE = exports.SQL_ROUTE = exports.WIZARD_ROUTE = exports.DC_DASHBOARDS_ROUTE = exports.DASHBOARDS_ROUTE = exports.NAVIGATION_ROUTE = void 0;
const types_1 = require("../types");
const connections_1 = require("./connections");
exports.NAVIGATION_ROUTE = 'navigation';
exports.DASHBOARDS_ROUTE = 'dashboards';
exports.DC_DASHBOARDS_ROUTE = 'dash';
exports.WIZARD_ROUTE = 'wizard';
exports.SQL_ROUTE = 'sql';
exports.QL_ROUTE = 'ql';
exports.PREVIEW_ROUTE = 'preview';
exports.EDITOR_ROUTE = 'editor';
exports.DATASETS_ROUTE = 'datasets';
exports.CONNECTIONS_ROUTE = 'connections';
exports.ENTRY_ROUTES = [
    exports.NAVIGATION_ROUTE,
    exports.DASHBOARDS_ROUTE,
    exports.DC_DASHBOARDS_ROUTE,
    exports.WIZARD_ROUTE,
    exports.SQL_ROUTE,
    exports.QL_ROUTE,
    exports.PREVIEW_ROUTE,
    exports.EDITOR_ROUTE,
    exports.DATASETS_ROUTE,
    exports.CONNECTIONS_ROUTE,
];
exports.ENTRY_ID_LENGTH = 13;
exports.ENTRY_SLUG_SEPARATOR = '-';
exports.MAX_SLUG_LENGTH = 54;
exports.LEGACY_WIZARD_TYPE = {
    GRAPH_WIZARD: 'graph_wizard',
    METRIC_WIZARD: 'metric_wizard',
};
exports.WIZARD_TYPES = Object.values(types_1.WizardType);
exports.QL_TYPE = {
    GRAPH_QL_NODE: 'graph_ql_node',
    D3_QL_NODE: 'd3_ql_node',
    TIMESERIES_QL_NODE: 'timeseries_ql_node',
    TABLE_QL_NODE: 'table_ql_node',
    YMAP_QL_NODE: 'ymap_ql_node',
    METRIC_QL_NODE: 'metric2_ql_node',
    MARKUP_QL_NODE: 'markup_ql_node',
    LEGACY_GRAPH_QL_NODE: 'graph_sql_node',
    LEGACY_TABLE_QL_NODE: 'table_sql_node',
    LEGACY_YMAP_QL_NODE: 'ymap_sql_node',
    LEGACY_METRIC_QL_NODE: 'metric2_sql_node',
};
exports.LEGACY_EDITOR_TYPE = {
    GRAPH: 'graph',
    TABLE: 'table',
    MAP: 'map',
    MANAGER: 'manager',
    TEXT: 'text',
    METRIC: 'metric',
};
exports.EDITOR_TYPE = {
    MODULE: 'module',
    GRAPH_NODE: 'graph_node',
    TABLE_NODE: 'table_node',
    TEXT_NODE: 'text_node',
    METRIC_NODE: 'metric_node',
    MAP_NODE: 'map_node',
    YMAP_NODE: 'ymap_node',
    CONTROL_NODE: 'control_node',
    MARKDOWN_NODE: 'markdown_node',
    MARKUP_NODE: 'markup_node',
    TIMESERIES_NODE: 'timeseries_node',
    GRAVITY_CHARTS_NODE: 'd3_node',
    ADVANCED_CHART_NODE: 'advanced-chart_node',
    // deprecated
    BLANK_CHART_NODE: 'blank-chart_node',
};
exports.ENTRY_TYPES = {
    legacyEditor: Object.values(exports.LEGACY_EDITOR_TYPE),
    editor: Object.values(exports.EDITOR_TYPE),
    wizard: exports.WIZARD_TYPES,
    ql: Object.values(exports.QL_TYPE),
    connection: Object.values(connections_1.ConnectorType),
};
