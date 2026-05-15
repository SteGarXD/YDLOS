"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWizardChartBuilder = void 0;
const shared_1 = require("../../../../../shared");
const color_palettes_1 = require("../../../../modes/charts/plugins/helpers/color-palettes");
const registry_1 = require("../../../../registry");
const utils_1 = require("../utils");
const utils_2 = require("../wizard-worker/utils");
const ONE_SECOND = 1000;
const PREPARE_EXECUTION_TIMEOUT = ONE_SECOND * 9.5;
const getWizardChartBuilder = async (args) => {
    const { config, widgetConfig, userLang, worker, timeouts = {}, tenantSettings } = args;
    const wizardWorker = worker;
    let shared;
    const app = registry_1.registry.getApp();
    const features = (0, shared_1.getServerFeatures)(app.nodekit.ctx);
    const { getAvailablePalettesMap } = registry_1.registry.common.functions.getAll();
    const palettes = getAvailablePalettesMap();
    const defaultColorPaletteId = (0, utils_1.getDefaultColorPaletteId)({
        ctx: app.nodekit.ctx,
        tenantSettings,
    });
    // Nothing happens here - just for compatibility with the editor
    const emptyStep = (name) => async (options) => {
        const { params, actionParams } = options;
        const timeStart = process.hrtime();
        const context = (0, utils_2.getChartApiContext)({
            name,
            shared,
            params,
            actionParams,
            widgetConfig,
            userLang,
        });
        return {
            exports: {},
            executionTiming: process.hrtime(timeStart),
            name,
            runtimeMetadata: context.__runtimeMetadata,
        };
    };
    const chartBuilder = {
        type: 'WIZARD',
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
        buildParams: async (args) => {
            if (typeof wizardWorker.buildParams === 'function') {
                const timeStart = process.hrtime();
                const execResult = await wizardWorker
                    .buildParams({ shared, userLang })
                    .timeout(timeouts.params || ONE_SECOND);
                return {
                    executionTiming: process.hrtime(timeStart),
                    name: 'Params',
                    ...execResult,
                };
            }
            return emptyStep('Params')(args);
        },
        buildUrls: async (options) => {
            const { params, actionParams } = options;
            const timeStart = process.hrtime();
            const execResult = await wizardWorker
                .buildSources({
                shared: shared,
                params,
                actionParams,
                widgetConfig,
                userLang,
                palettes,
                features,
            })
                .timeout(timeouts.sources || ONE_SECOND);
            (0, color_palettes_1.addColorPaletteRequest)({
                result: execResult.exports,
                colorPaletteId: defaultColorPaletteId,
                palettes,
            });
            return {
                executionTiming: process.hrtime(timeStart),
                name: 'Sources',
                ...execResult,
            };
        },
        buildChartLibraryConfig: async (options) => {
            const { params, actionParams } = options;
            const timeStart = process.hrtime();
            const execResult = await wizardWorker
                .buildLibraryConfig({
                shared: shared,
                params,
                actionParams,
                widgetConfig,
                userLang,
                features,
            })
                .timeout(timeouts.libraryConfig || ONE_SECOND);
            return {
                executionTiming: process.hrtime(timeStart),
                name: 'Highcharts',
                ...execResult,
            };
        },
        buildChartConfig: async (options) => {
            const { params, actionParams } = options;
            const timeStart = process.hrtime();
            const execResult = await wizardWorker
                .buildChartConfig({
                shared: shared,
                params,
                actionParams,
                widgetConfig,
                userLang,
                features,
            })
                .timeout(timeouts.config || ONE_SECOND);
            return {
                executionTiming: process.hrtime(timeStart),
                name: 'Config',
                ...execResult,
            };
        },
        buildChart: async (options) => {
            const { data, params, actionParams } = options;
            const timeStart = process.hrtime();
            const execResult = await wizardWorker
                .buildChart({
                shared: shared,
                params,
                actionParams,
                widgetConfig,
                userLang,
                data,
                palettes,
                features,
                defaultColorPaletteId,
            })
                .timeout(timeouts.prepare || PREPARE_EXECUTION_TIMEOUT);
            return {
                executionTiming: process.hrtime(timeStart),
                name: 'Prepare',
                ...execResult,
            };
        },
        buildUI: emptyStep('Controls'),
        dispose: () => { },
    };
    return chartBuilder;
};
exports.getWizardChartBuilder = getWizardChartBuilder;
