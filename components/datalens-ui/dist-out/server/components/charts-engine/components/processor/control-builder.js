"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getControlBuilder = void 0;
const controls_1 = require("../../../../modes/charts/plugins/control/controls");
const js_1 = require("../../../../modes/charts/plugins/control/js");
const url_1 = require("../../../../modes/charts/plugins/control/url");
const chart_api_context_1 = require("./chart-api-context");
const getControlBuilder = async (args) => {
    const { config } = args;
    let shared;
    // Nothing happens here - just for compatibility with the editor
    const emptyStep = (name) => async (options) => {
        const { params } = options;
        const timeStart = process.hrtime();
        const context = (0, chart_api_context_1.getChartApiContext)({
            name,
            shared,
            params,
            actionParams: {},
            userLang: null,
        });
        return {
            exports: {},
            executionTiming: process.hrtime(timeStart),
            name,
            runtimeMetadata: context.__runtimeMetadata,
        };
    };
    const ChartBuilder = {
        type: 'CONTROL',
        buildShared: async () => {
            if (typeof config.data.shared === 'string') {
                shared = JSON.parse(config.data.shared);
            }
            else {
                shared = config.data.shared;
            }
        },
        buildModules: async () => {
            return {};
        },
        buildParams: async (options) => {
            const { params } = options;
            const timeStart = process.hrtime();
            const context = (0, chart_api_context_1.getChartApiContext)({
                name: 'Params',
                shared,
                params,
                actionParams: {},
                userLang: null,
            });
            return {
                exports: {},
                executionTiming: process.hrtime(timeStart),
                name: 'Params',
                runtimeMetadata: context.__runtimeMetadata,
            };
        },
        buildUrls: async (options) => {
            const { params } = options;
            const timeStart = process.hrtime();
            const context = (0, chart_api_context_1.getChartApiContext)({
                name: 'Sources',
                shared,
                params,
                actionParams: {},
                userLang: null,
            });
            return {
                exports: (0, url_1.buildSources)({
                    shared,
                    params,
                }),
                executionTiming: process.hrtime(timeStart),
                name: 'Sources',
                runtimeMetadata: context.__runtimeMetadata,
            };
        },
        buildChartLibraryConfig: emptyStep('Highcharts'),
        buildChartConfig: emptyStep('Config'),
        buildChart: async (options) => {
            const { data, params } = options;
            const timeStart = process.hrtime();
            const context = (0, chart_api_context_1.getChartApiContext)({
                name: 'Prepare',
                shared,
                params,
                actionParams: {},
                userLang: null,
            });
            (0, js_1.buildGraph)({
                data: data,
                shared,
                params,
                ChartEditor: context.ChartEditor,
            });
            return {
                exports: {},
                executionTiming: process.hrtime(timeStart),
                name: 'Prepare',
                runtimeMetadata: context.__runtimeMetadata,
            };
        },
        buildUI: async (options) => {
            const { params } = options;
            const timeStart = process.hrtime();
            const context = (0, chart_api_context_1.getChartApiContext)({
                name: 'Controls',
                shared: shared,
                params: params,
                actionParams: {},
                userLang: null,
            });
            return {
                exports: (0, controls_1.buildUI)({
                    shared: shared,
                }),
                executionTiming: process.hrtime(timeStart),
                name: 'Controls',
                runtimeMetadata: context.__runtimeMetadata,
            };
        },
        dispose: () => { },
    };
    return ChartBuilder;
};
exports.getControlBuilder = getControlBuilder;
