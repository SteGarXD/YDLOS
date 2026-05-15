"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsScatter = prepareHighchartsScatter;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const get_gradient_stops_1 = require("../../utils/get-gradient-stops");
const misc_helpers_1 = require("../../utils/misc-helpers");
const axis_1 = require("../helpers/axis");
const prepare_scatter_1 = require("./prepare-scatter");
// eslint-disable-next-line complexity
function prepareHighchartsScatter(options) {
    var _a;
    const { ChartEditor, shared, placeholders, idToTitle, idToDataType, visualizationId } = options;
    const { graphs, categories, x, y, z, color, shape, minColorValue, maxColorValue, colorsConfig, size, } = (0, prepare_scatter_1.prepareScatter)(options);
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        colorsConfig &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    const points = graphs.map((graph) => graph.data).flat(2);
    if (!x || !y) {
        return {
            graphs,
        };
    }
    const legendIsHidden = ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.legendMode) === "hide" /* LegendDisplayMode.Hide */;
    if (ChartEditor) {
        const xPlaceholder = placeholders.find((placeholder) => placeholder.id === 'x');
        const yPlaceholder = placeholders.find((placeholder) => placeholder.id === 'y');
        const xPlaceholderSettings = xPlaceholder.settings;
        const yPlaceholderSettings = yPlaceholder.settings;
        const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
        const customConfig = {
            axesFormatting: { xAxis: [], yAxis: [] },
            xAxis: {},
            yAxis: {},
            exporting: {
                csv: {
                    custom: {
                        columnHeaderMap: (0, export_helpers_1.getFieldsExportingOptions)({
                            x,
                            y,
                            sizeValue: size,
                            colorValue: color,
                        }),
                        categoryHeader: (0, export_helpers_1.getFieldExportingOptions)(z || x),
                    },
                    columnHeaderFormatter: shared_1.ChartkitHandlers.WizardExportColumnNamesFormatter,
                },
            },
        };
        if ((xPlaceholderSettings === null || xPlaceholderSettings === void 0 ? void 0 : xPlaceholderSettings.title) === 'auto') {
            customConfig.xAxis = {
                title: {
                    text: x.fakeTitle || idToTitle[x.guid],
                },
            };
        }
        if ((yPlaceholderSettings === null || yPlaceholderSettings === void 0 ? void 0 : yPlaceholderSettings.title) === 'auto') {
            const yDataType = idToDataType[y.guid];
            const yIsDate = (0, shared_1.isDateField)({ data_type: yDataType });
            customConfig.yAxis = {
                type: yIsDate ? 'datetime' : undefined,
                title: {
                    text: y.fakeTitle || idToTitle[y.guid],
                },
            };
        }
        (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.xAxis, visualizationId, xPlaceholder);
        (0, axis_1.addAxisFormatting)(customConfig.axesFormatting.yAxis, visualizationId, yPlaceholder);
        (0, axis_1.addAxisFormatter)({
            axisConfig: customConfig.xAxis,
            placeholder: xPlaceholder,
            chartConfig,
        });
        (0, axis_1.addAxisFormatter)({
            axisConfig: customConfig.yAxis,
            placeholder: yPlaceholder,
        });
        if (gradientMode) {
            if (colorsConfig &&
                typeof minColorValue === 'number' &&
                typeof maxColorValue === 'number') {
                customConfig.colorAxis = {
                    min: minColorValue,
                    max: maxColorValue,
                    stops: (0, get_gradient_stops_1.getHighchartsGradientStops)({
                        colorsConfig,
                        points,
                        minColorValue,
                        maxColorValue,
                    }),
                };
            }
            if (!legendIsHidden && (0, misc_helpers_1.isNumericalDataType)(color.data_type)) {
                customConfig.legend = {
                    enabled: true,
                };
            }
        }
        const shouldUseHtmlForXAxis = (0, shared_1.isHtmlField)(x) || (0, shared_1.isMarkdownField)(x);
        if (shouldUseHtmlForXAxis) {
            (0, set_1.default)(customConfig, 'xAxis.labels.useHTML', true);
        }
        const shouldUseHtmlForYAxis = (0, shared_1.isHtmlField)(y) || (0, shared_1.isMarkdownField)(y);
        if (shouldUseHtmlForYAxis) {
            (0, set_1.default)(customConfig, 'yAxis.labels.useHTML', true);
        }
        const shouldUseHtmlForLegend = (0, shared_1.isMarkdownField)(color) ||
            (0, shared_1.isHtmlField)(color) ||
            (0, shared_1.isMarkdownField)(shape) ||
            (0, shared_1.isHtmlField)(shape);
        if (shouldUseHtmlForLegend) {
            (0, set_1.default)(customConfig, 'legend.useHTML', true);
        }
        ChartEditor.updateHighchartsConfig(customConfig);
    }
    return {
        graphs,
        categories,
    };
}
