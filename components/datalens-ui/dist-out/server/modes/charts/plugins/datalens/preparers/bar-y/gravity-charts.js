"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGravityChartsBarY = prepareGravityChartsBarY;
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../shared");
const utils_1 = require("../../gravity-charts/utils");
const format_1 = require("../../gravity-charts/utils/format");
const color_helpers_1 = require("../../utils/color-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const axis_1 = require("../helpers/axis");
const legend_1 = require("../helpers/legend");
const utils_2 = require("../utils");
const prepare_bar_y_data_1 = require("./prepare-bar-y-data");
function prepareGravityChartsBarY(args) {
    var _a, _b, _c, _d, _e, _f;
    const { shared, visualizationId, colors, colorsConfig, labels, placeholders } = args;
    const { graphs, categories } = (0, prepare_bar_y_data_1.prepareBarYData)(args);
    const hasCategories = Boolean(categories === null || categories === void 0 ? void 0 : categories.length);
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xField = (_a = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items) === null || _a === void 0 ? void 0 : _a[0];
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yField = (_b = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) === null || _b === void 0 ? void 0 : _b[0];
    const labelField = labels === null || labels === void 0 ? void 0 : labels[0];
    const exportSettings = {
        columns: [
            (0, export_helpers_1.getExportColumnSettings)({ path: hasCategories ? 'category' : 'y', field: yField }),
            (0, export_helpers_1.getExportColumnSettings)({ path: 'x', field: xField }),
        ],
    };
    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'series.custom.colorValue', field: colorItem }));
    }
    const shouldUseHtmlForLabels = (0, shared_1.isMarkupField)(labelField) || (0, shared_1.isHtmlField)(labelField) || (0, shared_1.isMarkdownField)(labelField);
    const shouldUsePercentStacking = shared_1.PERCENT_VISUALIZATIONS.has(visualizationId);
    const dataLabelsInside = shouldUsePercentStacking ||
        ((_c = shared.extraSettings) === null || _c === void 0 ? void 0 : _c.labelsPosition) !== shared_1.LabelsPositions.Outside;
    let gradientColorMap = {};
    const shouldSetColorByValues = graphs.some((s) => s.data.some((d) => !d.color && d.colorValue));
    if (shouldSetColorByValues) {
        const colorValues = graphs
            .map((s) => s.data.map((point) => Number(point.colorValue)))
            .flat(2);
        const gradientColors = (0, color_helpers_1.colorizeByColorValues)({ colorsConfig, colorValues });
        gradientColorMap = gradientColors.reduce((acc, color, index) => {
            acc[String(colorValues[index])] = color;
            return acc;
        }, {});
    }
    const series = graphs.map((graph) => {
        var _a;
        const labelFormatting = graph.dataLabels
            ? (0, utils_2.mapToGravityChartValueFormat)({ field: labelField, formatSettings: graph.dataLabels })
            : undefined;
        const shouldUsePercentageAsLabel = labelFormatting &&
            'labelMode' in labelFormatting &&
            (labelFormatting === null || labelFormatting === void 0 ? void 0 : labelFormatting.labelMode) === 'percent';
        return {
            ...graph,
            type: 'bar-y',
            stackId: graph.stack,
            stacking: shouldUsePercentStacking ? 'percent' : 'normal',
            name: graph.title,
            data: graph.data.map((d) => {
                var _a;
                const { x, y, label: originalLabel, ...other } = d;
                const total = (_a = graphs.reduce((sum, g) => { var _a, _b; return sum + ((_b = (_a = g.data.find((point) => point.x === x)) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0); }, 0)) !== null && _a !== void 0 ? _a : 0;
                const percentage = (d.y / total) * 100;
                const label = shouldUsePercentageAsLabel ? percentage : originalLabel;
                let color = d.color;
                if (!color && typeof d.colorValue === 'number') {
                    color = gradientColorMap[String(d.colorValue)];
                }
                return { ...other, y: x, x: y, label, total, percentage, color };
            }),
            dataLabels: {
                enabled: (_a = graph.dataLabels) === null || _a === void 0 ? void 0 : _a.enabled,
                inside: dataLabelsInside,
                html: shouldUseHtmlForLabels,
                format: labelFormatting,
            },
            custom: {
                ...graph.custom,
                colorValue: graph.colorValue,
                exportSettings,
                oldDataLabels: graph.dataLabels,
            },
        };
    });
    const xAxisLabelNumberFormat = xPlaceholder
        ? (0, axis_1.getAxisFormatting)({
            placeholder: xPlaceholder,
            visualizationId,
        })
        : undefined;
    const config = {
        series: {
            data: series,
            options: {
                'bar-y': {
                    stackGap: 0,
                    borderWidth: 1,
                },
            },
        },
        xAxis: {
            type: 'linear',
            labels: {
                numberFormat: xAxisLabelNumberFormat !== null && xAxisLabelNumberFormat !== void 0 ? xAxisLabelNumberFormat : undefined,
            },
        },
        custom: {
            tooltip: {
                headerLabel: (0, shared_1.isDateField)(yField) && !hasCategories ? undefined : (0, shared_1.getFakeTitleOrTitle)(yField),
            },
        },
    };
    if (config.series.data.length && (0, legend_1.shouldUseGradientLegend)(colorItem, colorsConfig, shared)) {
        const points = graphs
            .map((graph) => { var _a; return ((_a = graph.data) !== null && _a !== void 0 ? _a : []).map((d) => ({ colorValue: d.colorValue })); })
            .flat(2);
        const colorScale = (0, legend_1.getLegendColorScale)({
            colorsConfig,
            points,
        });
        config.legend = {
            enabled: ((_d = shared.extraSettings) === null || _d === void 0 ? void 0 : _d.legendMode) !== 'hide',
            type: 'continuous',
            title: { text: (0, shared_1.getFakeTitleOrTitle)(colorItem), style: { fontWeight: '500' } },
            colorScale,
        };
    }
    else if (graphs.length <= 1) {
        config.legend = { enabled: false };
    }
    if (xField) {
        config.tooltip = {
            ...config.tooltip,
            valueFormat: (0, format_1.getFieldFormatOptions)({ field: xField }),
        };
    }
    if (hasCategories) {
        config.yAxis = [
            {
                type: 'category',
                categories: categories,
                order: 'reverse',
                labels: {
                    enabled: ((_e = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) === null || _e === void 0 ? void 0 : _e.hideLabels) !== 'yes',
                    html: (0, shared_1.isHtmlField)(yField) || (0, shared_1.isMarkdownField)(yField) || (0, shared_1.isMarkupField)(yField),
                    maxWidth: '33%',
                    padding: 0,
                },
            },
        ];
    }
    else {
        const axisLabelNumberFormat = yPlaceholder
            ? (0, axis_1.getAxisFormatting)({
                placeholder: yPlaceholder,
                visualizationId,
            })
            : undefined;
        config.yAxis = [
            {
                labels: {
                    enabled: ((_f = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) === null || _f === void 0 ? void 0 : _f.hideLabels) !== 'yes',
                    numberFormat: axisLabelNumberFormat !== null && axisLabelNumberFormat !== void 0 ? axisLabelNumberFormat : undefined,
                },
                maxPadding: 0,
                order: 'reverse',
            },
        ];
    }
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)(shared), config);
}
