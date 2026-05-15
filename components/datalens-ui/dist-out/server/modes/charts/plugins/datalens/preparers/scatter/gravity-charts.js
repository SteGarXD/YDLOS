"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGravityChartsScatter = prepareGravityChartsScatter;
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../shared");
const utils_1 = require("../../gravity-charts/utils");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const axis_1 = require("../helpers/axis");
const legend_1 = require("../helpers/legend");
const prepare_scatter_1 = require("./prepare-scatter");
function mapScatterSeries(args) {
    var _a, _b, _c;
    const { xAxisType, yAxisType, graph } = args;
    const series = {
        type: 'scatter',
        name: graph.name || '',
        color: typeof graph.color === 'string' ? graph.color : undefined,
        data: ((_a = graph.data) === null || _a === void 0 ? void 0 : _a.map((item, index) => {
            var _a;
            const point = item;
            const pointData = {
                radius: (_a = point.marker) === null || _a === void 0 ? void 0 : _a.radius,
                custom: {
                    ...item.custom,
                    name: point.name,
                    xLabel: point.xLabel,
                    yLabel: point.yLabel,
                    colorValue: point.colorValue,
                    cLabel: point.cLabel,
                    shapeValue: point.shapeValue,
                    sLabel: point.sLabel,
                    sizeValue: point.sizeValue,
                    sizeLabel: point.sizeLabel,
                },
                color: typeof point.color === 'string' ? point.color : undefined,
            };
            if (xAxisType === 'category') {
                pointData.x = typeof item.x === 'number' ? item.x : index;
            }
            else {
                pointData.x = item.x;
            }
            if (yAxisType === 'category') {
                pointData.y = typeof item.y === 'number' ? item.y : index;
            }
            else {
                pointData.y = item.y;
            }
            return pointData;
        })) || [],
        // @ts-ignore
        custom: graph.custom,
    };
    if ((_b = graph.marker) === null || _b === void 0 ? void 0 : _b.symbol) {
        series.symbolType = (_c = graph.marker) === null || _c === void 0 ? void 0 : _c.symbol;
    }
    return series;
}
// eslint-disable-next-line complexity
function prepareGravityChartsScatter(args) {
    var _a;
    const { shared, idToDataType, placeholders, colors, colorsConfig, shapes, visualizationId } = args;
    const { categories: preparedXCategories, graphs, x, y, z, color, shape, size, } = (0, prepare_scatter_1.prepareScatter)(args);
    const xCategories = preparedXCategories;
    const exportSettings = {
        columns: [
            (0, export_helpers_1.getExportColumnSettings)({ path: 'x', field: x }),
            (0, export_helpers_1.getExportColumnSettings)({ path: 'y', field: y }),
        ],
    };
    if (z) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'custom.name', field: z }));
    }
    if (size) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'custom.sizeValue', field: size }));
    }
    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'custom.colorValue', field: colorItem }));
    }
    const shapeItem = shapes[0];
    if (shapeItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'custom.shapeValue', field: shapeItem }));
    }
    const seriesCustomData = {
        xTitle: (0, shared_1.getFakeTitleOrTitle)(x),
        yTitle: (0, shared_1.getFakeTitleOrTitle)(y),
        pointTitle: (0, shared_1.getFakeTitleOrTitle)(z),
        colorTitle: (0, shared_1.getFakeTitleOrTitle)(color),
        sizeTitle: (0, shared_1.getFakeTitleOrTitle)(size),
        shapeTitle: (0, shared_1.getFakeTitleOrTitle)(shape),
        exportSettings,
    };
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (0, shared_1.getXAxisMode)({ config: chartConfig });
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xAxisType = (0, axis_1.getAxisType)({
        field: x,
        settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
        axisMode: xAxisMode,
    });
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yAxisType = (0, axis_1.getAxisType)({
        field: y,
        settings: yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings,
    });
    let xAxis = {};
    if (xAxisType === 'category' && (xCategories === null || xCategories === void 0 ? void 0 : xCategories.length)) {
        xAxis = {
            type: 'category',
            // @ts-ignore There may be a type mismatch due to the wrapper over html, markup and markdown
            categories: xCategories,
            labels: {
                html: (0, shared_1.isHtmlField)(x) || (0, shared_1.isMarkdownField)(x) || (0, shared_1.isMarkupField)(x),
            },
        };
    }
    else {
        if ((0, shared_1.isDateField)(x)) {
            xAxis.type = 'datetime';
        }
        if ((0, shared_1.isNumberField)(x)) {
            xAxis.type = ((_a = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) === null || _a === void 0 ? void 0 : _a.type) === 'logarithmic' ? 'logarithmic' : 'linear';
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
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    let legend = {
        html: [x, y, z].some((field) => (0, shared_1.isHtmlField)(field) || (0, shared_1.isMarkdownField)(field) || (0, shared_1.isMarkupField)(field)),
    };
    if (graphs.length && gradientMode) {
        const points = graphs
            .map((graph) => { var _a; return ((_a = graph.data) !== null && _a !== void 0 ? _a : []).map((d) => ({ colorValue: d.colorValue })); })
            .flat(2);
        const colorScale = (0, legend_1.getLegendColorScale)({
            colorsConfig,
            points,
        });
        legend = {
            enabled: true,
            type: 'continuous',
            title: { text: (0, shared_1.getFakeTitleOrTitle)(color), style: { fontWeight: '500' } },
            colorScale,
        };
    }
    else if (graphs.length <= 1) {
        legend.enabled = false;
    }
    const axisLabelNumberFormat = yPlaceholder
        ? (0, axis_1.getAxisFormatting)({
            placeholder: yPlaceholder,
            visualizationId,
        })
        : undefined;
    const config = {
        xAxis,
        yAxis: [
            {
                labels: {
                    numberFormat: axisLabelNumberFormat !== null && axisLabelNumberFormat !== void 0 ? axisLabelNumberFormat : undefined,
                    html: yAxisType === 'category' &&
                        ((0, shared_1.isHtmlField)(y) || (0, shared_1.isMarkdownField)(y) || (0, shared_1.isMarkupField)(y)),
                },
                maxPadding: 0,
            },
        ],
        series: {
            data: graphs.map((graph) => ({
                ...mapScatterSeries({ graph, xAxisType, yAxisType }),
                custom: seriesCustomData,
            })),
        },
        legend,
    };
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)(shared), config);
}
