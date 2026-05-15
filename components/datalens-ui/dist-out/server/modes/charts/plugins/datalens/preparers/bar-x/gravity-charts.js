"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGravityChartBarX = prepareGravityChartBarX;
const merge_1 = __importDefault(require("lodash/merge"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const shared_1 = require("../../../../../../../shared");
const utils_1 = require("../../gravity-charts/utils");
const dataLabels_1 = require("../../gravity-charts/utils/dataLabels");
const format_1 = require("../../gravity-charts/utils/format");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const axis_1 = require("../helpers/axis");
const legend_1 = require("../helpers/legend");
const segments_1 = require("../helpers/segments");
const prepare_bar_x_1 = require("./prepare-bar-x");
// eslint-disable-next-line complexity
function prepareGravityChartBarX(args) {
    var _a, _b, _c, _d;
    const { shared, labels, placeholders, disableDefaultSorting = false, idToDataType, colors, colorsConfig, visualizationId, } = args;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xField = (_a = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items) === null || _a === void 0 ? void 0 : _a[0];
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yField = (_b = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) === null || _b === void 0 ? void 0 : _b[0];
    const labelField = labels === null || labels === void 0 ? void 0 : labels[0];
    const isDataLabelsEnabled = Boolean(labelField);
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (_c = (0, shared_1.getXAxisMode)({ config: chartConfig })) !== null && _c !== void 0 ? _c : "discrete" /* AxisMode.Discrete */;
    const isCategoriesXAxis = !xField ||
        (0, axis_1.getAxisType)({
            field: xField,
            settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
            axisMode: xAxisMode,
        }) === 'category' ||
        disableDefaultSorting;
    if (!xField && !yField) {
        return {
            series: {
                data: [],
            },
        };
    }
    const preparedData = (0, prepare_bar_x_1.prepareBarX)(args);
    const xCategories = xField
        ? preparedData.categories
        : yField
            ? [(0, shared_1.getFakeTitleOrTitle)(yField)]
            : [];
    const exportSettings = {
        columns: [
            (0, export_helpers_1.getExportColumnSettings)({ path: isCategoriesXAxis ? 'category' : 'x', field: xField }),
            (0, export_helpers_1.getExportColumnSettings)({ path: 'y', field: yField }),
        ],
    };
    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'series.custom.colorValue', field: colorItem }));
    }
    const shouldUseHtmlForLabels = (0, shared_1.isMarkupField)(labelField) || (0, shared_1.isHtmlField)(labelField) || (0, shared_1.isMarkdownField)(labelField);
    const shouldUsePercentStacking = shared_1.PERCENT_VISUALIZATIONS.has(visualizationId);
    const seriesData = preparedData.graphs.map((graph) => {
        var _a;
        return {
            name: graph.title,
            type: 'bar-x',
            color: graph.color,
            stackId: graph.stack,
            stacking: shouldUsePercentStacking ? 'percent' : 'normal',
            data: graph.data.reduce((acc, item, index) => {
                const dataItem = {
                    y: (item === null || item === void 0 ? void 0 : item.y) || 0,
                    custom: item === null || item === void 0 ? void 0 : item.custom,
                    color: item === null || item === void 0 ? void 0 : item.color,
                };
                if (isDataLabelsEnabled) {
                    if ((item === null || item === void 0 ? void 0 : item.y) === null) {
                        dataItem.label = '';
                    }
                    else if (shouldUseHtmlForLabels) {
                        dataItem.label = item === null || item === void 0 ? void 0 : item.label;
                    }
                    else {
                        dataItem.label = (0, dataLabels_1.getFormattedLabel)(item === null || item === void 0 ? void 0 : item.label, labelField);
                    }
                }
                if (isCategoriesXAxis) {
                    dataItem.x = index;
                }
                else if (!item && xCategories) {
                    dataItem.x = xCategories[index];
                }
                else {
                    dataItem.x = item === null || item === void 0 ? void 0 : item.x;
                }
                acc.push(dataItem);
                return acc;
            }, []),
            custom: { ...graph.custom, colorValue: graph.colorValue, exportSettings },
            dataLabels: {
                enabled: isDataLabelsEnabled,
                inside: ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.labelsPosition) !== shared_1.LabelsPositions.Outside,
                html: shouldUseHtmlForLabels,
            },
            yAxis: graph.yAxis,
        };
    });
    let legend;
    if (seriesData.length && (0, legend_1.shouldUseGradientLegend)(colorItem, colorsConfig, shared)) {
        const points = preparedData.graphs
            .map((graph) => { var _a; return ((_a = graph.data) !== null && _a !== void 0 ? _a : []).map((d) => ({ colorValue: d === null || d === void 0 ? void 0 : d.colorValue })); })
            .flat(2);
        const colorScale = (0, legend_1.getLegendColorScale)({
            colorsConfig,
            points,
        });
        legend = {
            enabled: true,
            type: 'continuous',
            title: { text: (0, shared_1.getFakeTitleOrTitle)(colorItem), style: { fontWeight: '500' } },
            colorScale,
        };
    }
    else if (seriesData.length <= 1) {
        legend = { enabled: false };
    }
    let xAxis = {};
    if (isCategoriesXAxis) {
        xAxis = {
            type: 'category',
            categories: xCategories === null || xCategories === void 0 ? void 0 : xCategories.map(String),
        };
    }
    else {
        if ((0, shared_1.isDateField)(xField)) {
            xAxis.type = 'datetime';
        }
        if ((0, shared_1.isNumberField)(xField)) {
            xAxis.type = ((_d = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) === null || _d === void 0 ? void 0 : _d.type) === 'logarithmic' ? 'logarithmic' : 'linear';
        }
        const xAxisLabelNumberFormat = xPlaceholder
            ? (0, axis_1.getAxisFormatting)({
                placeholder: xPlaceholder,
                visualizationId,
            })
            : undefined;
        if (xAxisLabelNumberFormat) {
            xAxis.labels = { numberFormat: xAxisLabelNumberFormat };
        }
    }
    const segmentsMap = (0, segments_1.getSegmentMap)(args);
    const segments = (0, sortBy_1.default)(Object.values(segmentsMap), (s) => s.index);
    const isSplitEnabled = new Set(segments.map((d) => d.index)).size > 1;
    const axisLabelNumberFormat = yPlaceholder
        ? (0, axis_1.getAxisFormatting)({
            placeholder: yPlaceholder,
            visualizationId,
        })
        : undefined;
    const config = {
        series: {
            data: seriesData,
        },
        legend,
        xAxis,
        yAxis: segments.map((d) => {
            return {
                labels: {
                    numberFormat: axisLabelNumberFormat !== null && axisLabelNumberFormat !== void 0 ? axisLabelNumberFormat : undefined,
                },
                plotIndex: d.index,
                position: d.isOpposite ? 'right' : 'left',
                title: isSplitEnabled ? { text: d.title } : undefined,
            };
        }),
        split: {
            enable: isSplitEnabled,
            gap: '40px',
            plots: segments.map(() => {
                return {};
            }),
        },
    };
    if (yField) {
        config.tooltip = {
            valueFormat: (0, format_1.getFieldFormatOptions)({ field: yField }),
        };
    }
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)({
        extraSettings: shared.extraSettings,
        visualization: { placeholders, id: visualizationId },
    }), config);
}
