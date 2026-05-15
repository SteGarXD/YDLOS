"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const workerpool_1 = __importDefault(require("workerpool"));
const shared_1 = require("../../../../../shared");
const language_1 = require("../../../../../shared/modules/language");
const charts_engine_1 = require("../../../../components/charts-engine");
const utils_1 = require("../../../../components/charts-engine/components/wizard-worker/utils");
const language_2 = require("../../../../utils/language");
const private_module_1 = __importDefault(require("./module/private-module"));
const identify_params_1 = require("./utils/identify-params");
function getQLAdditionalData() {
    var _a;
    return {
        qlConnectionTypeMap: (_a = worker_threads_1.workerData === null || worker_threads_1.workerData === void 0 ? void 0 : worker_threads_1.workerData.qlConnectionTypeMap) !== null && _a !== void 0 ? _a : {},
    };
}
const worker = {
    buildParams: async (args) => {
        const { shared, userLang } = args;
        const i18n = (0, language_2.createI18nInstance)({ lang: userLang });
        const result = (0, identify_params_1.identifyParams)({
            chart: shared,
            getTranslation: (0, language_1.getTranslationFn)(i18n.getI18nServer()),
        });
        return {
            exports: result,
            runtimeMetadata: {},
        };
    },
    buildSources: async (args) => {
        const { shared, params, actionParams, widgetConfig, userLang, palettes, features } = args;
        const context = (0, utils_1.getChartApiContext)({
            name: 'Sources',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new charts_engine_1.Console({});
        private_module_1.default.setConsole(console);
        const { qlConnectionTypeMap } = getQLAdditionalData();
        return {
            exports: private_module_1.default.buildSources({
                shared: shared,
                ChartEditor: context.ChartEditor,
                palettes,
                qlConnectionTypeMap,
                features,
            }),
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
    buildLibraryConfig: async (args) => {
        var _a;
        const { shared, params, actionParams, widgetConfig, userLang, features } = args;
        const context = (0, utils_1.getChartApiContext)({
            name: 'Highcharts',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new charts_engine_1.Console({});
        private_module_1.default.setConsole(console);
        let result;
        const serverChartConfig = shared;
        const visualizationId = (_a = serverChartConfig === null || serverChartConfig === void 0 ? void 0 : serverChartConfig.visualization) === null || _a === void 0 ? void 0 : _a.id;
        switch (visualizationId) {
            case shared_1.WizardVisualizationId.FlatTable: {
                result = {};
                break;
            }
            default: {
                if ((0, shared_1.isGravityChartsVisualization)({ id: visualizationId, features })) {
                    result = {};
                }
                else {
                    result = private_module_1.default.buildLibraryConfig({
                        shared: serverChartConfig,
                        ChartEditor: context.ChartEditor,
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
        const context = (0, utils_1.getChartApiContext)({
            name: 'Config',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        const console = new charts_engine_1.Console({});
        private_module_1.default.setConsole(console);
        return {
            exports: private_module_1.default.buildChartConfig({
                shared: shared,
                ChartEditor: context.ChartEditor,
                features,
                widgetConfig,
            }),
            runtimeMetadata: context.__runtimeMetadata,
            logs: console.getLogs(),
        };
    },
    buildChart: async (args) => {
        var _a;
        const { shared, params, actionParams, widgetConfig, userLang, data, palettes, features, defaultColorPaletteId, } = args;
        const context = (0, utils_1.getChartApiContext)({
            name: 'Prepare',
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
            data: data,
        });
        const console = new charts_engine_1.Console({});
        private_module_1.default.setConsole(console);
        const { qlConnectionTypeMap } = getQLAdditionalData();
        const serverChartConfig = shared;
        const shouldUseGravityCharts = (0, shared_1.isGravityChartsVisualization)({
            features,
            id: (_a = serverChartConfig === null || serverChartConfig === void 0 ? void 0 : serverChartConfig.visualization) === null || _a === void 0 ? void 0 : _a.id,
        });
        const plugin = shouldUseGravityCharts ? 'gravity-charts' : undefined;
        const result = private_module_1.default.buildGraph({
            shared: serverChartConfig,
            ChartEditor: context.ChartEditor,
            palettes,
            features,
            qlConnectionTypeMap,
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
