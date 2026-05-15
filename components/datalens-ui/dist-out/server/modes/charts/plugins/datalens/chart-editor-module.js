"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChartsConfig = exports.buildGraph = void 0;
const config_1 = require("./config");
const highcharts_1 = require("./highcharts");
const js_1 = require("./js/js");
const js_v1_5_private_1 = require("./js/js-v1.5-private");
const build_sources_1 = require("./url/build-sources");
const misc_helpers_1 = require("./utils/misc-helpers");
const buildHighchartsConfig = (...options) => {
    let shared;
    if ('shared' in options[0]) {
        shared = options[0].shared;
    }
    else {
        shared = options[0];
    }
    return (0, highcharts_1.buildHighchartsConfigPrivate)({ shared, features: __features });
};
const buildSources = (args) => {
    return (0, build_sources_1.buildSourcesPrivate)({ ...args, palettes: __palettes });
};
const fallbackJSFunction = (...options) => {
    return (0, js_v1_5_private_1.fallbackJSFunctionPrivate)({
        options,
        features: __features,
        palettes: __palettes,
        defaultColorPaletteId: __defaultColorPaletteId,
    });
};
const buildGraph = (...options) => {
    let data;
    let shared;
    let ChartEditor;
    let apiVersion;
    if ('shared' in options[0]) {
        data = options[0].data;
        shared = options[0].shared;
        ChartEditor =
            options[0].ChartEditor || options[0].Editor;
        apiVersion = options[0].apiVersion;
    }
    else {
        data = options[0];
        shared = options[1];
        ChartEditor = options[2];
    }
    apiVersion = apiVersion || '1.5';
    if (apiVersion === '1.5') {
        return fallbackJSFunction.apply(this, options);
    }
    return (0, js_1.buildGraphPrivate)({
        shared,
        ChartEditor,
        data,
        palettes: __palettes,
        features: __features,
        defaultColorPaletteId: __defaultColorPaletteId,
    });
};
exports.buildGraph = buildGraph;
const buildChartsConfig = (args, _params) => {
    let shared;
    let params;
    let widgetConfig;
    if ('shared' in args) {
        shared = args.shared;
        params = args.params;
        widgetConfig = args.widgetConfig;
    }
    else {
        shared = args;
        params = _params;
    }
    return (0, config_1.buildChartsConfigPrivate)({
        shared,
        params,
        widgetConfig,
        features: __features,
    });
};
exports.buildChartsConfig = buildChartsConfig;
exports.default = {
    buildHighchartsConfig,
    buildSources,
    buildGraph: exports.buildGraph,
    buildGravityChartsConfig: ({ shared, Editor, data, }) => {
        return (0, js_1.buildGraphPrivate)({
            shared,
            ChartEditor: Editor,
            data,
            palettes: __palettes,
            features: __features,
            plugin: 'gravity-charts',
            defaultColorPaletteId: __defaultColorPaletteId,
        });
    },
    buildChartsConfig: exports.buildChartsConfig,
    buildD3Config: () => { },
    setConsole: misc_helpers_1.setConsole,
};
