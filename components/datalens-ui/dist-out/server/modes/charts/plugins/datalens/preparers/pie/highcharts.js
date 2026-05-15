"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsPie = prepareHighchartsPie;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const get_gradient_stops_1 = require("../../utils/get-gradient-stops");
const misc_helpers_1 = require("../../utils/misc-helpers");
const prepare_pie_data_1 = __importDefault(require("./prepare-pie-data"));
const utils_1 = require("./utils");
function prepareHighchartsPie(args) {
    const { ChartEditor, colorsConfig, labels, shared } = args;
    const { graphs, totals, measure, label, color, dimension } = (0, prepare_pie_data_1.default)(args);
    const labelsLength = labels && labels.length;
    const isHideLabel = (measure === null || measure === void 0 ? void 0 : measure.hideLabelMode) === 'hide';
    const customConfig = {
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: Boolean(labelsLength && label && !isHideLabel),
                },
            },
        },
    };
    const pie = graphs[0];
    if (pie && pie.data) {
        if ((0, utils_1.isColoringByMeasure)(args)) {
            pie.showInLegend = false;
            const colorValues = pie.data.map((point) => Number(point.colorValue));
            const points = pie.data;
            const minColorValue = Math.min(...colorValues);
            const maxColorValue = Math.max(...colorValues);
            customConfig.colorAxis = {
                startOnTick: false,
                endOnTick: false,
                min: minColorValue,
                max: maxColorValue,
                stops: (0, get_gradient_stops_1.getHighchartsGradientStops)({
                    colorsConfig,
                    points,
                    minColorValue,
                    maxColorValue,
                }),
            };
            customConfig.legend = {
                title: {
                    text: (0, shared_1.getFakeTitleOrTitle)(color),
                },
                enabled: (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings),
                symbolWidth: null,
            };
        }
    }
    const shouldUseHtmlForLegend = [dimension, color].some(shared_1.isHtmlField);
    if (shouldUseHtmlForLegend) {
        (0, set_1.default)(customConfig, 'legend.useHTML', true);
    }
    ChartEditor.updateHighchartsConfig(customConfig);
    return { graphs, totals };
}
