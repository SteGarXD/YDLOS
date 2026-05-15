"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWizardChart = void 0;
const path_1 = __importDefault(require("path"));
const workerpool_1 = __importDefault(require("workerpool"));
const worker_chart_builder_1 = require("../components/processor/worker-chart-builder");
const worker_1 = require("./worker");
let wizardWorkersPool = null;
async function getWizardWorker(options) {
    if (wizardWorkersPool === null) {
        const scriptPath = path_1.default.resolve(__dirname, '../components/wizard-worker');
        wizardWorkersPool = workerpool_1.default.pool(scriptPath, options);
    }
    return wizardWorkersPool.proxy();
}
const runWizardChart = async (cx, props) => {
    var _a, _b, _c;
    const { req, res, config } = props;
    const timeouts = (_a = cx.config.runnerExecutionTimeouts) === null || _a === void 0 ? void 0 : _a.wizard;
    const { widgetConfig } = req.body;
    const chartBuilder = await (0, worker_chart_builder_1.getWizardChartBuilder)({
        userLang: res.locals && res.locals.lang,
        userLogin: res.locals && res.locals.login,
        widgetConfig,
        config: config,
        isScreenshoter: Boolean(req.headers['x-charts-scr']),
        worker: await getWizardWorker({
            maxWorkers: (_b = cx.config.chartsEngineConfig.maxWorkers) !== null && _b !== void 0 ? _b : 1,
        }),
        timeouts,
        tenantSettings: { defaultColorPaletteId: (_c = config.tenantSettings) === null || _c === void 0 ? void 0 : _c.defaultColorPaletteId },
    });
    return (0, worker_1.runWorkerChart)(cx, { ...props, chartBuilder, runnerType: 'Wizard' });
};
exports.runWizardChart = runWizardChart;
