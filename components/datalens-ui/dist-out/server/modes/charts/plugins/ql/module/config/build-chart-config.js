"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChartConfig = buildChartConfig;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const chartkit_handlers_1 = require("../../../../../../../shared/constants/chartkit-handlers");
const ql_1 = require("../../../../../../../shared/modules/config/ql");
const misc_helpers_1 = require("../../utils/misc-helpers");
function buildChartConfig(args) {
    var _a, _b, _c, _d;
    const { shared, ChartEditor, features, widgetConfig } = args;
    const qlConfig = (0, ql_1.mapQlConfigToLatestVersion)(shared, {
        i18n: ChartEditor.getTranslation,
    });
    const config = {
        tooltip: { pin: { altKey: true }, sort: { enabled: true } },
    };
    if (qlConfig.extraSettings) {
        const { title, titleMode, tooltipSum, enableGPTInsights } = qlConfig.extraSettings;
        if (title && titleMode === 'show') {
            config.title = title;
        }
        if (typeof tooltipSum === 'undefined' || tooltipSum === 'on') {
            config.enableSum = true;
        }
        config.enableGPTInsights = enableGPTInsights;
    }
    const visualizationId = (_a = qlConfig === null || qlConfig === void 0 ? void 0 : qlConfig.visualization) === null || _a === void 0 ? void 0 : _a.id;
    const isTableWidget = visualizationId === shared_1.WizardVisualizationId.FlatTable;
    const isIndicatorWidget = visualizationId === shared_1.WizardVisualizationId.Metric;
    const isScatterWidget = visualizationId === shared_1.WizardVisualizationId.Scatter;
    const isTreemapWidget = visualizationId === shared_1.WizardVisualizationId.Treemap;
    const isSetManageTooltipConfig = !isIndicatorWidget && !isTableWidget && !isScatterWidget && !isTreemapWidget;
    if (isTableWidget) {
        const size = (_b = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.size) !== null && _b !== void 0 ? _b : (_c = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _c === void 0 ? void 0 : _c.size;
        if (size) {
            (0, set_1.default)(config, 'size', size);
        }
        (0, set_1.default)(config, 'settings.width', 'max-content');
        if ((_d = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _d === void 0 ? void 0 : _d.preserveWhiteSpace) {
            (0, set_1.default)(config, 'preserveWhiteSpace', true);
        }
    }
    config.hideHolidaysBands = !features[shared_1.Feature.HolidaysOnChart];
    config.linesLimit = shared_1.DEFAULT_CHART_LINES_LIMIT;
    if (isSetManageTooltipConfig) {
        config.manageTooltipConfig = chartkit_handlers_1.ChartkitHandlers.WizardManageTooltipConfig;
    }
    (0, misc_helpers_1.log)('CONFIG:', config);
    return config;
}
