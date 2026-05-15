"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChartsConfigPrivate = void 0;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../shared");
const config_helpers_1 = require("../utils/config-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
const constants_1 = require("./constants");
function getActionParamsEvents(visualizationId) {
    switch (visualizationId) {
        case shared_1.WizardVisualizationId.FlatTable: {
            return {
                click: [{ handler: { type: 'setActionParams' }, scope: 'row' }],
            };
        }
        case shared_1.WizardVisualizationId.PivotTable: {
            return {
                click: [{ handler: { type: 'setActionParams' }, scope: 'cell' }],
            };
        }
        case shared_1.WizardVisualizationId.Line:
        case shared_1.WizardVisualizationId.LineD3:
        case shared_1.WizardVisualizationId.Area:
        case shared_1.WizardVisualizationId.Column:
        case shared_1.WizardVisualizationId.Column100p:
        case shared_1.WizardVisualizationId.BarXD3:
        case shared_1.WizardVisualizationId.Bar:
        case shared_1.WizardVisualizationId.Bar100p:
        case shared_1.WizardVisualizationId.Scatter:
        case shared_1.WizardVisualizationId.ScatterD3:
        case shared_1.WizardVisualizationId.Pie:
        case shared_1.WizardVisualizationId.PieD3:
        case shared_1.WizardVisualizationId.Donut:
        case shared_1.WizardVisualizationId.DonutD3:
        case shared_1.WizardVisualizationId.Gauge:
        case shared_1.WizardVisualizationId.CombinedChart: {
            return {
                click: [{ handler: { type: 'setActionParams' }, scope: 'point' }],
            };
        }
        case shared_1.WizardVisualizationId.Geolayer: {
            return {
                click: [{ handler: { type: 'setActionParams' }, scope: 'point' }],
            };
        }
    }
    return undefined;
}
function canUseActionParams(shared) {
    var _a;
    const hasDrillDownEvents = Boolean((_a = shared.sharedData) === null || _a === void 0 ? void 0 : _a.drillDownData);
    const tableVisualization = shared.visualization.id === shared_1.WizardVisualizationId.FlatTable;
    const hasTreeFields = tableVisualization &&
        shared.visualization.placeholders.find((p) => p.id === shared_1.PlaceholderId.FlatTableColumns && p.items.some(shared_1.isTreeField));
    return !hasDrillDownEvents && !hasTreeFields;
}
// eslint-disable-next-line complexity
const buildChartsConfigPrivate = (args) => {
    var _a, _b, _c, _d, _e;
    const { shared: serverChartConfig, params, widgetConfig, features } = args;
    const shared = (0, config_helpers_1.mapChartsConfigToServerConfig)(serverChartConfig);
    const { visualization } = shared;
    let hideHolidaysBands = !features[shared_1.Feature.HolidaysOnChart];
    if (!hideHolidaysBands) {
        hideHolidaysBands = [visualization].concat(visualization.layers || []).some((layer) => {
            var _a;
            return (_a = layer.placeholders) === null || _a === void 0 ? void 0 : _a.some((placeholder) => {
                var _a;
                return (placeholder.id === shared_1.PlaceholderId.X &&
                    (((_a = placeholder.settings) === null || _a === void 0 ? void 0 : _a.holidays) || 'off') === 'off');
            });
        });
    }
    const config = {
        title: shared.title,
        hideHolidaysBands,
        linesLimit: shared_1.DEFAULT_CHART_LINES_LIMIT,
        tooltip: { pin: { altKey: true }, sort: { enabled: true } },
        preventDefaultForPointClick: false,
    };
    if (shared.extraSettings) {
        if (shared.extraSettings.title && shared.extraSettings.titleMode === 'show') {
            config.title = shared.extraSettings.title;
        }
        const isPivotFallbackEnabled = ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.pivotFallback) === 'on';
        if (visualization.id === shared_1.WizardVisualizationId.FlatTable ||
            (visualization.id === shared_1.WizardVisualizationId.PivotTable && !isPivotFallbackEnabled)) {
            const tableExtraSettings = shared.extraSettings;
            const items = (0, misc_helpers_1.getAllPlaceholderItems)(shared.visualization.placeholders);
            const hasDimensions = items.some((field) => (0, shared_1.isDimensionField)(field) || (0, shared_1.isFieldHierarchy)(field));
            // No pagination if all columns are measures
            config.paginator = {
                enabled: hasDimensions && (tableExtraSettings === null || tableExtraSettings === void 0 ? void 0 : tableExtraSettings.pagination) === 'on',
                limit: (tableExtraSettings === null || tableExtraSettings === void 0 ? void 0 : tableExtraSettings.limit) && (tableExtraSettings === null || tableExtraSettings === void 0 ? void 0 : tableExtraSettings.limit),
            };
        }
        config.comments = {
            matchType: constants_1.CommentsMatchType.Intersection,
        };
        const matchedParams = [];
        if (shared.datasetsPartialFields) {
            shared.datasetsPartialFields.forEach((fields) => fields.forEach((field) => params[field.title] && matchedParams.push(field.title)));
            config.comments.matchedParams = matchedParams;
        }
        if (shared.extraSettings.feed) {
            config.comments.feeds = [
                {
                    feed: shared.extraSettings.feed,
                    matchedParams,
                    matchType: constants_1.CommentsMatchType.Intersection,
                },
            ];
        }
        if ((0, shared_1.getIsNavigatorEnabled)(shared)) {
            config.navigatorSettings = shared.extraSettings.navigatorSettings;
        }
        config.enableGPTInsights = shared.extraSettings.enableGPTInsights;
    }
    const visualizationId = shared.visualization.id;
    if (visualizationId === 'line' ||
        visualizationId === 'area' ||
        visualizationId === 'area100p' ||
        visualizationId === 'column' ||
        visualizationId === 'column100p' ||
        visualizationId === 'bar' ||
        visualizationId === 'bar100p') {
        config.manageTooltipConfig = shared_1.ChartkitHandlers.WizardManageTooltipConfig;
        const extraSettings = shared.extraSettings;
        if (extraSettings) {
            const { tooltipSum } = extraSettings;
            if (typeof tooltipSum === 'undefined' || tooltipSum === 'on') {
                config.enableSum = true;
            }
        }
    }
    else if (visualizationId === 'pie' || visualizationId === 'donut') {
        config.showPercentInTooltip = true;
        config.manageTooltipConfig = shared_1.ChartkitHandlers.WizardManageTooltipConfig;
    }
    else if (visualizationId === 'metric') {
        config.metricVersion = 2;
    }
    else if (visualizationId === 'pivotTable') {
        config.settings = {
            externalSort: true,
        };
    }
    else if (visualizationId === shared_1.WizardVisualizationId.CombinedChart) {
        config.manageTooltipConfig = shared_1.ChartkitHandlers.WizardManageTooltipConfig;
    }
    const isTableWidget = [shared_1.WizardVisualizationId.FlatTable, shared_1.WizardVisualizationId.PivotTable].includes(visualizationId);
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
    const placeholders = shared.visualization.placeholders;
    const colors = shared.colors;
    if ((0, misc_helpers_1.isNeedToCalcClosestPointManually)(visualizationId, placeholders, colors)) {
        // Highcharts can't calculate column sizes automatically for different series.
        // Therefore, if we have a columns/bar visualization type and the colors contain a field, then we will calculate the fields ourselves
        // Because the data format without colors is {series: [{data: [...]}]}
        // And with colors {series: [{data: [...]}, {data: [...]}, {data: [...]}];
        config.calcClosestPointManually = true;
    }
    if (((_e = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _e === void 0 ? void 0 : _e.enable) && canUseActionParams(shared)) {
        config.events = getActionParamsEvents(visualizationId);
    }
    (0, misc_helpers_1.log)('CONFIG:');
    (0, misc_helpers_1.log)(config);
    return config;
};
exports.buildChartsConfigPrivate = buildChartsConfigPrivate;
