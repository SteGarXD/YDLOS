"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runQlChart = void 0;
const path_1 = __importDefault(require("path"));
const workerpool_1 = __importDefault(require("workerpool"));
const worker_chart_builder_1 = require("../../../../components/charts-engine/components/processor/worker-chart-builder");
const worker_1 = require("../../../../components/charts-engine/runners/worker");
const registry_1 = require("../../../../registry");
let wizardWorkersPool = null;
async function getQlWorker(options) {
    if (wizardWorkersPool === null) {
        const scriptPath = path_1.default.resolve(__dirname, './worker');
        const additionalData = {
            qlConnectionTypeMap: registry_1.registry.getQLConnectionTypeMap(),
        };
        wizardWorkersPool = workerpool_1.default.pool(scriptPath, {
            ...options,
            workerThreadOpts: { workerData: additionalData },
        });
    }
    return wizardWorkersPool.proxy();
}
const runQlChart = async (cx, props) => {
    var _a, _b, _c;
    const { req, res, config } = props;
    const { widgetConfig } = req.body;
    const timeouts = (_a = cx.config.runnerExecutionTimeouts) === null || _a === void 0 ? void 0 : _a.qlChart;
    const chartBuilder = await (0, worker_chart_builder_1.getWizardChartBuilder)({
        userLang: res.locals && res.locals.lang,
        userLogin: res.locals && res.locals.login,
        widgetConfig,
        config: config,
        isScreenshoter: Boolean(req.headers['x-charts-scr']),
        worker: await getQlWorker({
            maxWorkers: (_b = cx.config.chartsEngineConfig.maxWorkers) !== null && _b !== void 0 ? _b : 1,
        }),
        timeouts,
        tenantSettings: { defaultColorPaletteId: (_c = config.tenantSettings) === null || _c === void 0 ? void 0 : _c.defaultColorPaletteId },
    });
    return (0, worker_1.runWorkerChart)(cx, { ...props, chartBuilder, runnerType: 'Ql' });
};
exports.runQlChart = runQlChart;
