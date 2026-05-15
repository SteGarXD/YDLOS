"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsLine = prepareHighchartsLine;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const index_1 = require("../../../../../../../shared/types/index");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const axis_1 = require("../helpers/axis");
const get_axis_formatting_1 = require("../helpers/axis/get-axis-formatting");
const highcharts_1 = require("../helpers/highcharts");
const layers_1 = require("../helpers/layers");
const legend_1 = require("../helpers/legend");
const segments_1 = require("../helpers/segments");
const helpers_1 = require("./helpers");
const prepare_line_data_1 = require("./prepare-line-data");
// eslint-disable-next-line complexity
function getHighchartsConfig(args) {
    var _a;
    const { placeholders, colors, colorsConfig, sort, visualizationId, shared, shapes, graphs, segments, idToDataType, } = args;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xPlaceholderSettings = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings;
    const x = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
    const isXDiscrete = (0, shared_1.getAxisMode)(xPlaceholderSettings, x === null || x === void 0 ? void 0 : x.guid) === "discrete" /* AxisMode.Discrete */;
    const x2 = (0, shared_1.isVisualizationWithSeveralFieldsXPlaceholder)(visualizationId)
        ? xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[1]
        : undefined;
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const y2Placeholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y2);
    const ySectionItems = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const y2SectionItems = (y2Placeholder === null || y2Placeholder === void 0 ? void 0 : y2Placeholder.items) || [];
    const mergedYSections = [...ySectionItems, ...y2SectionItems];
    const colorItem = colors[0];
    const shapeItem = shapes[0];
    const segment = segments[0];
    const segmentsMap = (0, segments_1.getSegmentMap)(args);
    const xField = x ? { guid: x.guid, data_type: idToDataType[x.guid] } : x;
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (0, shared_1.getXAxisMode)({ config: chartConfig });
    const xAxisType = (0, axis_1.getAxisType)({
        field: xField,
        settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
        axisMode: xAxisMode,
    });
    const wizardXAxisFormatter = (0, shared_1.isDateField)(x) && xAxisType === 'category'
        ? shared_1.ChartkitHandlers.WizardXAxisFormatter
        : undefined;
    const customConfig = {
        xAxis: {
            type: xAxisType,
            reversed: (0, highcharts_1.isXAxisReversed)(x, sort, visualizationId),
            labels: {
                useHTML: (0, index_1.isHtmlField)(x),
            },
        },
        yAxis: {},
        axesFormatting: {
            xAxis: [],
            yAxis: [],
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
    (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.xAxis, visualizationId, xPlaceholder);
    (0, axis_1.addAxisFormatter)({
        axisConfig: customConfig.xAxis,
        placeholder: xPlaceholder,
        otherwiseFormatter: wizardXAxisFormatter,
        chartConfig,
    });
    if (mergedYSections.length) {
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
        if ((0, isEmpty_1.default)(segmentsMap)) {
            const [layerYPlaceholder, layerY2Placeholder] = (0, layers_1.getYPlaceholders)(args);
            (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.yAxis, visualizationId, layerYPlaceholder);
            const formatMode = (_a = layerY2Placeholder === null || layerY2Placeholder === void 0 ? void 0 : layerY2Placeholder.settings) === null || _a === void 0 ? void 0 : _a.axisFormatMode;
            if (formatMode && formatMode !== "auto" /* AxisLabelFormatMode.Auto */) {
                const formatting = (0, get_axis_formatting_1.getAxisChartkitFormatting)(layerY2Placeholder, visualizationId);
                if (formatting) {
                    if (customConfig.axesFormatting.yAxis.length === 0) {
                        customConfig.axesFormatting.yAxis.push({});
                    }
                    customConfig.axesFormatting.yAxis.push(formatting);
                }
            }
            if ((layerYPlaceholder === null || layerYPlaceholder === void 0 ? void 0 : layerYPlaceholder.items.length) && (layerY2Placeholder === null || layerY2Placeholder === void 0 ? void 0 : layerY2Placeholder.items.length)) {
                const y1 = {};
                const y2 = {};
                (0, axis_1.addAxisFormatter)({
                    axisConfig: y1,
                    placeholder: layerYPlaceholder,
                });
                (0, axis_1.addAxisFormatter)({
                    axisConfig: y2,
                    placeholder: layerY2Placeholder,
                });
                customConfig.yAxis = [y1, y2];
            }
            else if (layerYPlaceholder === null || layerYPlaceholder === void 0 ? void 0 : layerYPlaceholder.items.length) {
                (0, axis_1.addAxisFormatter)({
                    axisConfig: customConfig.yAxis,
                    placeholder: layerYPlaceholder,
                });
            }
            else {
                (0, axis_1.addAxisFormatter)({
                    axisConfig: customConfig.yAxis,
                    placeholder: layerY2Placeholder,
                });
            }
        }
        else {
            customConfig.legend = {
                enabled: Boolean(colorItem ||
                    shapeItem ||
                    x2 ||
                    ySectionItems.length > 1 ||
                    y2SectionItems.length > 1) && (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings),
            };
            const { yAxisFormattings, yAxisSettings } = (0, helpers_1.getSegmentsYAxis)({
                segment,
                segmentsMap,
                placeholders: {
                    y: yPlaceholder,
                    y2: y2Placeholder,
                },
                visualizationId,
            });
            customConfig.yAxis = yAxisSettings;
            customConfig.axesFormatting.yAxis = yAxisFormattings;
        }
    }
    const shouldUseHtmlForLegend = [colorItem, shapeItem].some(index_1.isHtmlField);
    if (shouldUseHtmlForLegend) {
        (0, set_1.default)(customConfig, 'legend.useHTML', true);
    }
    return customConfig;
}
function getConfig(args) {
    var _a, _b, _c, _d;
    const { placeholders, shared } = args;
    const config = {};
    const xFields = ((_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.X)) === null || _a === void 0 ? void 0 : _a.items) || [];
    if (xFields.some(Boolean) && (0, shared_1.getIsNavigatorEnabled)(shared)) {
        // For old charts. In the new charts, we put the navigator settings in navigatorSettings and
        // adding to the config in config.ts
        config.highstock = {
            base_series_name: (_b = shared.extraSettings) === null || _b === void 0 ? void 0 : _b.navigatorSeriesName,
        };
    }
    const yFields = ((_c = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y)) === null || _c === void 0 ? void 0 : _c.items) || [];
    const y2Fields = ((_d = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y2)) === null || _d === void 0 ? void 0 : _d.items) || [];
    const hasFloatYFields = yFields.some(shared_1.isFloatField) || y2Fields.some(shared_1.isFloatField);
    if (hasFloatYFields) {
        config.precision = shared_1.MINIMUM_FRACTION_DIGITS;
    }
    return config;
}
function prepareHighchartsLine(args) {
    const { ChartEditor } = args;
    const preparedData = (0, prepare_line_data_1.prepareLineData)(args);
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
