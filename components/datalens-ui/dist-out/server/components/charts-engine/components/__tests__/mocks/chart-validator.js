"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validDataChunks = void 0;
const constants_1 = require("../../../../../../shared/constants");
exports.validDataChunks = [
    // GRAPH_NODE
    {
        data: {
            graph: {},
            js: {},
            params: {},
            shared: {},
            statface_graph: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAPH_NODE,
    },
    {
        data: {
            graph: {},
            js: {},
            meta: {},
            params: {},
            shared: {},
            statface_graph: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAPH_NODE,
    },
    {
        data: {
            graph: {},
            js: {},
            params: {},
            secrets: {},
            shared: {},
            statface_graph: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAPH_NODE,
    },
    {
        data: {
            graph: {},
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            statface_graph: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAPH_NODE,
    },
    // METRIC_NODE
    {
        data: {
            js: {},
            params: {},
            shared: {},
            statface_metric: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.METRIC_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            shared: {},
            statface_metric: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.METRIC_NODE,
    },
    {
        data: {
            js: {},
            params: {},
            secrets: {},
            shared: {},
            statface_metric: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.METRIC_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            statface_metric: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.METRIC_NODE,
    },
    // TABLE_NODE
    {
        data: {
            js: {},
            params: {},
            shared: {},
            table: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.TABLE_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            shared: {},
            table: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.TABLE_NODE,
    },
    {
        data: {
            js: {},
            params: {},
            secrets: {},
            shared: {},
            table: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.TABLE_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            table: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.TABLE_NODE,
    },
    // YMAP_NODE
    {
        data: {
            js: {},
            params: {},
            shared: {},
            url: {},
            ymap: {},
        },
        type: constants_1.EDITOR_TYPE.YMAP_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            shared: {},
            url: {},
            ymap: {},
        },
        type: constants_1.EDITOR_TYPE.YMAP_NODE,
    },
    {
        data: {
            js: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
            ymap: {},
        },
        type: constants_1.EDITOR_TYPE.YMAP_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
            ymap: {},
        },
        type: constants_1.EDITOR_TYPE.YMAP_NODE,
    },
    // CONTROL_NODE
    {
        data: {
            js: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.CONTROL_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.CONTROL_NODE,
    },
    {
        data: {
            js: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.CONTROL_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.CONTROL_NODE,
    },
    // MARKDOWN_NODE
    {
        data: {
            js: {},
            params: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKDOWN_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKDOWN_NODE,
    },
    {
        data: {
            js: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKDOWN_NODE,
    },
    {
        data: {
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKDOWN_NODE,
    },
    // MARKUP_NODE
    {
        data: {
            config: {},
            js: {},
            params: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKUP_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKUP_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKUP_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.MARKUP_NODE,
    },
    // MODULE
    {
        data: { documentation_en: {}, documentation_ru: {}, js: {} },
        type: constants_1.EDITOR_TYPE.MODULE,
    },
    {
        data: { documentation_en: {}, js: {} },
        type: constants_1.EDITOR_TYPE.MODULE,
    },
    {
        data: { documentation_ru: {}, js: {} },
        type: constants_1.EDITOR_TYPE.MODULE,
    },
    {
        data: { js: {} },
        type: constants_1.EDITOR_TYPE.MODULE,
    },
    // GRAVITY_CHARTS_NODE
    {
        data: {
            config: {},
            js: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAVITY_CHARTS_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAVITY_CHARTS_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAVITY_CHARTS_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.GRAVITY_CHARTS_NODE,
    },
    // BLANK_CHART_NODE
    {
        data: {
            config: {},
            js: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE,
    },
    {
        data: {
            config: {},
            js: {},
            meta: {},
            params: {},
            secrets: {},
            shared: {},
            ui: {},
            url: {},
        },
        type: constants_1.EDITOR_TYPE.ADVANCED_CHART_NODE,
    },
];
