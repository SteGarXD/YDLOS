"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsBarY = prepareHighchartsBarY;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const axis_1 = require("../helpers/axis");
const highcharts_1 = require("../helpers/highcharts");
const layers_1 = require("../helpers/layers");
const legend_1 = require("../helpers/legend");
const prepare_bar_y_data_1 = require("./prepare-bar-y-data");
// eslint-disable-next-line complexity
function getHighchartsConfig(args) {
    var _a;
    const { placeholders, colors, colorsConfig, sort, visualizationId, shared, graphs, idToDataType, } = args;
    // for some reason, the vertical axis for the horizontal bar is considered the X axis
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xPlaceholderSettings = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings;
    const x = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
    const isXDiscrete = (0, shared_1.getAxisMode)(xPlaceholderSettings, x === null || x === void 0 ? void 0 : x.guid) === "discrete" /* AxisMode.Discrete */;
    const ySectionItems = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const colorItem = colors[0];
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (_a = (0, shared_1.getXAxisMode)({ config: chartConfig })) !== null && _a !== void 0 ? _a : "discrete" /* AxisMode.Discrete */;
    const wizardXAxisFormatter = (0, shared_1.isDateField)(x) && isXDiscrete ? shared_1.ChartkitHandlers.WizardXAxisFormatter : undefined;
    const customConfig = {
        xAxis: {
            type: (0, axis_1.getAxisType)({
                field: x,
                settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
                axisMode: xAxisMode,
            }),
            reversed: (0, highcharts_1.isXAxisReversed)(x, sort, visualizationId),
            labels: {
                useHTML: (0, shared_1.isHtmlField)(x),
            },
        },
        yAxis: {},
        axesFormatting: {
            yAxis: [],
            xAxis: [],
        },
        exporting: {
            csv: {
                custom: {
                    categoryHeader: (0, export_helpers_1.getFieldExportingOptions)(x),
                },
                columnHeaderFormatter: shared_1.ChartkitHandlers.WizardExportColumnNamesFormatter,
            },
        },
    };
    if (ySectionItems.length) {
        if ((0, legend_1.shouldUseGradientLegend)(colorItem, colorsConfig, shared)) {
            customConfig.colorAxis = (0, highcharts_1.getHighchartsColorAxis)(graphs, colorsConfig);
            customConfig.legend = {
                title: {
                    text: (0, shared_1.getFakeTitleOrTitle)(colorItem),
                },
                enabled: (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings),
                symbolWidth: null,
            };
        }
        if ((0, shared_1.getIsNavigatorEnabled)(shared)) {
            customConfig.xAxis.ordinal = isXDiscrete;
        }
        if (shared.extraSettings) {
            const { tooltipSum } = shared.extraSettings;
            if (typeof tooltipSum === 'undefined' || tooltipSum === 'on') {
                customConfig.enableSum = true;
            }
        }
        if (x && !(0, shared_1.isMeasureNameOrValue)(x)) {
            customConfig.tooltipHeaderFormatter = (0, shared_1.getFakeTitleOrTitle)(x);
        }
        const [layerYPlaceholder] = (0, layers_1.getYPlaceholders)(args);
        (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.yAxis, visualizationId, yPlaceholder);
        (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.xAxis, visualizationId, layerYPlaceholder);
        (0, axis_1.addAxisFormatter)({
            axisConfig: customConfig.xAxis,
            placeholder: layerYPlaceholder,
            otherwiseFormatter: wizardXAxisFormatter,
            chartConfig,
        });
        (0, axis_1.addAxisFormatter)({
            axisConfig: customConfig.yAxis,
            placeholder: yPlaceholder,
        });
    }
    const shouldUseHtmlForLegend = (0, shared_1.isHtmlField)(colorItem);
    if (shouldUseHtmlForLegend) {
        (0, set_1.default)(customConfig, 'legend.useHTML', true);
    }
    return customConfig;
}
function getConfig(args) {
    var _a;
    const { placeholders } = args;
    const config = {};
    const fields = ((_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.X)) === null || _a === void 0 ? void 0 : _a.items) || [];
    if (fields.some(shared_1.isFloatField)) {
        config.precision = shared_1.MINIMUM_FRACTION_DIGITS;
    }
    return config;
}
function prepareHighchartsBarY(args) {
    const { ChartEditor } = args;
    const preparedData = (0, prepare_bar_y_data_1.prepareBarYData)(args);
    if (ChartEditor) {
        const highchartsConfig = getHighchartsConfig({
            ...args,
            graphs: preparedData.graphs,
        });
        ChartEditor.updateHighchartsConfig(highchartsConfig);
        const config = getConfig(args);
        ChartEditor.updateConfig(config);
    }
    return preparedData;
}
