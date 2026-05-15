"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareD3Pie = prepareD3Pie;
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../shared");
const fields_1 = require("../../../../../../../shared/modules/fields");
const index_1 = require("../../../../../../../shared/types/index");
const utils_1 = require("../../gravity-charts/utils");
const format_1 = require("../../gravity-charts/utils/format");
const export_helpers_1 = require("../../utils/export-helpers");
const legend_1 = require("../helpers/legend");
const prepare_pie_data_1 = __importDefault(require("./prepare-pie-data"));
const utils_2 = require("./utils");
function prepareD3Pie(args) {
    var _a, _b, _c, _d;
    const { shared, labels, visualizationId, ChartEditor, colorsConfig, idToDataType } = args;
    const { graphs, label, measure, totals, color, dimension } = (0, prepare_pie_data_1.default)(args);
    const isLabelsEnabled = Boolean((labels === null || labels === void 0 ? void 0 : labels.length) && label && (measure === null || measure === void 0 ? void 0 : measure.hideLabelMode) !== 'hide');
    const shouldUseHtmlForLabels = (0, index_1.isMarkupField)(label) || (0, index_1.isHtmlField)(label) || (0, index_1.isMarkdownField)(label);
    const labelField = (0, shared_1.isMeasureValue)(label) ? measure : label;
    let data = [];
    if (measure && graphs.length > 0) {
        const graph = graphs[0];
        const total = (_b = (_a = graph.data) === null || _a === void 0 ? void 0 : _a.reduce((sum, d) => sum + (d.y || 0), 0)) !== null && _b !== void 0 ? _b : 0;
        const labelFormatting = labelField ? (0, shared_1.getFormatOptions)(labelField) : undefined;
        const seriesConfig = {
            type: 'pie',
            minRadius: '50%',
            dataLabels: {
                enabled: isLabelsEnabled,
                html: shouldUseHtmlForLabels,
                format: isLabelsEnabled ? (0, format_1.getFieldFormatOptions)({ field: labelField }) : undefined,
            },
            data: (_d = (_c = graph.data) === null || _c === void 0 ? void 0 : _c.map((item) => {
                const percentage = item.y / total;
                return {
                    ...item,
                    value: item.y,
                    color: item.color,
                    formattedValue: (0, utils_2.getFormattedValue)(String(item.y), {
                        ...measure,
                        data_type: idToDataType[measure.guid],
                    }),
                    percentage,
                    label: (labelFormatting === null || labelFormatting === void 0 ? void 0 : labelFormatting.labelMode) === 'percent' ? percentage : item.label,
                };
            })) !== null && _d !== void 0 ? _d : [],
        };
        seriesConfig.custom = {
            exportSettings: {
                columns: [
                    {
                        name: ChartEditor.getTranslation('chartkit.data-provider', 'categories'),
                        field: 'name',
                    },
                    (0, export_helpers_1.getExportColumnSettings)({ path: 'value', field: measure }),
                ],
            },
        };
        if ((0, utils_2.isDonut)({ visualizationId })) {
            seriesConfig.innerRadius = '50%';
            if (measure && totals) {
                seriesConfig.custom = {
                    ...seriesConfig.custom,
                    totals: (0, shared_1.formatNumber)(Number(totals), (0, shared_1.getFormatOptions)(measure)),
                };
            }
        }
        data.push(seriesConfig);
    }
    else {
        data = [];
    }
    let legend = {};
    if (graphs.length && (0, utils_2.isColoringByMeasure)(args)) {
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
            title: { text: (0, fields_1.getFakeTitleOrTitle)(measure), style: { fontWeight: '500' } },
            colorScale,
        };
    }
    else {
        const shouldUseHtmlForLegend = [dimension, color].some(index_1.isHtmlField);
        if (shouldUseHtmlForLegend) {
            legend.html = true;
        }
    }
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)(shared), {
        chart: {
            margin: { top: 20, left: 12, right: 12, bottom: 20 },
            zoom: { enabled: false },
        },
        series: {
            data: data.filter((s) => s.data.length),
        },
        legend,
    });
}
