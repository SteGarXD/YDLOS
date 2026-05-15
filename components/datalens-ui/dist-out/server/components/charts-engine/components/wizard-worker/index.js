"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workerpool_1 = __importDefault(require("workerpool"));
const shared_1 = require("../../../../../shared");
const language_1 = require("../../../../../shared/modules/language");
const private_module_1 = require("../../../../modes/charts/plugins/datalens/private-module");
const language_2 = require("../../../../utils/language");
const chart_api_context_1 = require("../processor/chart-api-context");
const console_1 = require("../processor/console");
const worker = {
    buildSources: async (args) => {
        const { shared, params, actionParams, widgetConfig, userLang, palettes } = args;
        const context = (0, chart_api_context_1.getChartApiContext)({
            name: 'Sources',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new console_1.Console({});
        private_module_1.datalensModule.setConsole(console);
        return {
            exports: private_module_1.datalensModule.buildSources({
                apiVersion: '2',
                shared: shared,
                params,
                palettes,
            }),
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
    buildLibraryConfig: async (args) => {
        var _a;
        const { shared, params, actionParams, widgetConfig, userLang, features } = args;
        const context = (0, chart_api_context_1.getChartApiContext)({
            name: 'Highcharts',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new console_1.Console({});
        private_module_1.datalensModule.setConsole(console);
        let result;
        const serverChartConfig = shared;
        const visualizationId = (_a = serverChartConfig === null || serverChartConfig === void 0 ? void 0 : serverChartConfig.visualization) === null || _a === void 0 ? void 0 : _a.id;
        switch (visualizationId) {
            case shared_1.WizardVisualizationId.FlatTable:
            case shared_1.WizardVisualizationId.PivotTable: {
                result = {};
                break;
            }
            default: {
                if ((0, shared_1.isGravityChartsVisualization)({
                    id: visualizationId,
                    features,
                })) {
                    result = {};
                }
                else {
                    result = private_module_1.datalensModule.buildHighchartsConfig({
                        shared: serverChartConfig,
                        features,
                    });
                }
            }
        }
        return {
            exports: result,
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
    buildChartConfig: async (args) => {
        const { shared, params, actionParams, widgetConfig, userLang, features } = args;
        const context = (0, chart_api_context_1.getChartApiContext)({
            name: 'Config',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new console_1.Console({});
        private_module_1.datalensModule.setConsole(console);
        return {
            exports: private_module_1.datalensModule.buildChartsConfig({
                shared: shared,
                params,
                widgetConfig,
                features,
            }),
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
    buildChart: async (args) => {
        var _a;
        const { shared, params, actionParams, widgetConfig, userLang, data, palettes, defaultColorPaletteId, features, } = args;
        const context = (0, chart_api_context_1.getChartApiContext)({
            name: 'Prepare',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const i18n = (0, language_2.createI18nInstance)({ lang: userLang });
        context.ChartEditor.getTranslation = (0, language_1.getTranslationFn)(i18n.getI18nServer());
        const console = new console_1.Console({});
        private_module_1.datalensModule.setConsole(console);
        const serverChartConfig = shared;
        const shouldUseGravityCharts = (0, shared_1.isGravityChartsVisualization)({
            features,
            id: (_a = serverChartConfig === null || serverChartConfig === void 0 ? void 0 : serverChartConfig.visualization) === null || _a === void 0 ? void 0 : _a.id,
        });
        const plugin = shouldUseGravityCharts ? 'gravity-charts' : undefined;
        const result = private_module_1.datalensModule.buildGraph({
            data,
            shared: serverChartConfig,
            ChartEditor: context.ChartEditor,
            palettes,
            features,
            plugin,
            defaultColorPaletteId,
        });
        return {
            exports: result,
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
};
workerpool_1.default.worker(worker);
