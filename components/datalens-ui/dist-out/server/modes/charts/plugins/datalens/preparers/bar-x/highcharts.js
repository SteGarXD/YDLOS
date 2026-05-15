"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsBarX = prepareHighchartsBarX;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const axis_1 = require("../helpers/axis");
const get_axis_formatting_1 = require("../helpers/axis/get-axis-formatting");
const highcharts_1 = require("../helpers/highcharts");
const layers_1 = require("../helpers/layers");
const legend_1 = require("../helpers/legend");
const segments_1 = require("../helpers/segments");
const helpers_1 = require("../line/helpers");
const prepare_bar_x_1 = require("./prepare-bar-x");
// eslint-disable-next-line complexity
function prepareHighchartsBarX(args) {
    var _a, _b, _c;
    const { ChartEditor, placeholders, colors, colorsConfig, sort, idToDataType, visualizationId, shared, segments, } = args;
    const preparedData = (0, prepare_bar_x_1.prepareBarX)(args);
    const { graphs } = preparedData;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const x = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
    const xDataType = x ? idToDataType[x.guid] : null;
    const xIsNumber = Boolean(xDataType && (0, misc_helpers_1.isNumericalDataType)(xDataType));
    const xIsFloat = x ? xDataType === 'float' : null;
    const xIsDate = Boolean(xDataType && (0, shared_1.isDateField)({ data_type: xDataType }));
    const xPlaceholderSettings = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings;
    let xAxisMode = "discrete" /* AxisMode.Discrete */;
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    if (x && xDataType) {
        xAxisMode = (_a = (0, shared_1.getXAxisMode)({ config: chartConfig })) !== null && _a !== void 0 ? _a : "discrete" /* AxisMode.Discrete */;
    }
    const isXDiscrete = xAxisMode === "discrete" /* AxisMode.Discrete */;
    const x2 = placeholders[0].items[1];
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yFields = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const colorItem = colors[0];
    const segmentsMap = (0, segments_1.getSegmentMap)(args);
    const isSegmentsExists = !(0, isEmpty_1.default)(segmentsMap);
    // Here we manage the highcharts settings depending on the parameters
    if (ChartEditor) {
        const customConfig = { xAxis: {}, yAxis: {} };
        if (yFields.length) {
            const isYSectionHasFloatItem = yFields.some((y) => y.data_type === 'float');
            if (isYSectionHasFloatItem) {
                ChartEditor.updateConfig({
                    precision: shared_1.MINIMUM_FRACTION_DIGITS,
                });
            }
            Object.assign(customConfig, {
                xAxis: {},
                plotOptions: {},
                axesFormatting: { xAxis: [], yAxis: [] },
                exporting: {
                    csv: {
                        custom: {
                            categoryHeader: (0, export_helpers_1.getFieldExportingOptions)(x),
                        },
                        columnHeaderFormatter: shared_1.ChartkitHandlers.WizardExportColumnNamesFormatter,
                    },
                },
            });
            (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.xAxis, visualizationId, xPlaceholder);
            const [layerYPlaceholder] = (0, layers_1.getYPlaceholders)(args);
            const formatMode = (_b = layerYPlaceholder === null || layerYPlaceholder === void 0 ? void 0 : layerYPlaceholder.settings) === null || _b === void 0 ? void 0 : _b.axisFormatMode;
            if (formatMode && formatMode !== "auto" /* AxisLabelFormatMode.Auto */ && !isSegmentsExists) {
                const formatting = (0, get_axis_formatting_1.getAxisChartkitFormatting)(layerYPlaceholder, visualizationId);
                if (formatting) {
                    customConfig.axesFormatting.yAxis.push(formatting);
                }
            }
            (0, axis_1.addAxisFormatter)({
                axisConfig: customConfig.yAxis,
                placeholder: layerYPlaceholder,
            });
            if ((0, legend_1.shouldUseGradientLegend)(colorItem, colorsConfig, shared)) {
                customConfig.colorAxis = (0, highcharts_1.getHighchartsColorAxis)(graphs, colorsConfig);
                customConfig.legend = {
                    title: {
                        text: (0, shared_1.getFakeTitleOrTitle)(colorItem),
                    },
                    enabled: (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings),
                    symbolWidth: null,
                };
                customConfig.plotOptions = {
                    column: {
                        borderWidth: 1,
                    },
                };
            }
            if (xIsDate || xIsNumber) {
                customConfig.xAxis.reversed = (0, highcharts_1.isXAxisReversed)(x, sort, visualizationId);
                const isXDiscreteAndNotLogarithmic = isXDiscrete &&
                    xPlaceholderSettings &&
                    xPlaceholderSettings.type !== 'logarithmic';
                const wizardXAxisFormatter = isXDiscreteAndNotLogarithmic && xIsDate
                    ? shared_1.ChartkitHandlers.WizardXAxisFormatter
                    : undefined;
                if (isXDiscreteAndNotLogarithmic) {
                    customConfig.xAxis.type = 'category';
                }
                else if (xIsDate) {
                    customConfig.xAxis.type = 'datetime';
                }
                (0, axis_1.addAxisFormatter)({
                    axisConfig: customConfig.xAxis,
                    placeholder: xPlaceholder,
                    otherwiseFormatter: wizardXAxisFormatter,
                    chartConfig,
                });
                if (x && (0, shared_1.getIsNavigatorEnabled)(shared)) {
                    ChartEditor.updateConfig({
                        // For old charts. In the new charts, we put the navigator settings in navigatorSettings and
                        // adding to the config in config.ts
                        highstock: {
                            base_series_name: (_c = shared.extraSettings) === null || _c === void 0 ? void 0 : _c.navigatorSeriesName,
                        },
                    });
                }
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
                const fieldTitle = (0, shared_1.getFakeTitleOrTitle)(x);
                customConfig.tooltipHeaderFormatter = fieldTitle;
            }
            if (isSegmentsExists) {
                customConfig.legend = {
                    enabled: Boolean(colorItem || x2 || yFields.length > 1) &&
                        (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings),
                };
                const { yAxisFormattings, yAxisSettings } = (0, helpers_1.getSegmentsYAxis)({
                    segment: segments[0],
                    segmentsMap,
                    placeholders: {
                        y: yPlaceholder,
                        y2: undefined,
                    },
                    visualizationId,
                });
                customConfig.yAxis = yAxisSettings;
                customConfig.axesFormatting.yAxis = yAxisFormattings;
            }
        }
        else if (xIsDate || xIsNumber) {
            customConfig.xAxis.reversed = (0, highcharts_1.isXAxisReversed)(x, sort, visualizationId);
            const wizardXAxisFormatter = isXDiscrete && xIsDate ? shared_1.ChartkitHandlers.WizardXAxisFormatter : undefined;
            if (xIsDate) {
                if (!isXDiscrete) {
                    customConfig.xAxis.type = 'datetime';
                }
            }
            else if (!xIsFloat) {
                customConfig.xAxis.type = 'category';
            }
            (0, axis_1.addAxisFormatter)({
                axisConfig: customConfig.xAxis,
                placeholder: xPlaceholder,
                otherwiseFormatter: wizardXAxisFormatter,
                chartConfig,
            });
        }
        ChartEditor.updateHighchartsConfig(customConfig);
        const shouldUseHtmlForLegend = (0, shared_1.isHtmlField)(colorItem);
        if (shouldUseHtmlForLegend) {
            (0, set_1.default)(customConfig, 'legend.useHTML', true);
        }
        const shouldUseHtmlForCategory = (0, shared_1.isHtmlField)(x);
        if (shouldUseHtmlForCategory) {
            (0, set_1.default)(customConfig, 'xAxis.labels.useHTML', true);
        }
    }
    return preparedData;
}
