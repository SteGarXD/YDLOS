"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGravityChartArea = prepareGravityChartArea;
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../shared");
const utils_1 = require("../../gravity-charts/utils");
const dataLabels_1 = require("../../gravity-charts/utils/dataLabels");
const format_1 = require("../../gravity-charts/utils/format");
const config_helpers_1 = require("../../utils/config-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const axis_1 = require("../helpers/axis");
const prepare_line_data_1 = require("../line/prepare-line-data");
function prepareGravityChartArea(args) {
    var _a, _b, _c;
    const { visualizationId, labels, placeholders, disableDefaultSorting = false, shared, idToDataType, colors, } = args;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xField = (_a = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items) === null || _a === void 0 ? void 0 : _a[0];
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yFields = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const labelField = labels === null || labels === void 0 ? void 0 : labels[0];
    const isDataLabelsEnabled = Boolean(labelField);
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (_b = (0, shared_1.getXAxisMode)({ config: chartConfig })) !== null && _b !== void 0 ? _b : "discrete" /* AxisMode.Discrete */;
    const isCategoriesXAxis = !xField ||
        (0, axis_1.getAxisType)({
            field: xField,
            settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
            axisMode: xAxisMode,
        }) === 'category' ||
        disableDefaultSorting;
    if (!xField || !yFields.length) {
        return {
            series: {
                data: [],
            },
        };
    }
    const preparedData = (0, prepare_line_data_1.prepareLineData)(args);
    const xCategories = preparedData.categories;
    const exportSettings = {
        columns: [
            (0, export_helpers_1.getExportColumnSettings)({ path: 'x', field: xField }),
            (0, export_helpers_1.getExportColumnSettings)({ path: 'y', field: yFields[0] }),
        ],
    };
    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'series.custom.colorValue', field: colorItem }));
    }
    const shouldUseHtmlForLabels = (0, shared_1.isMarkupField)(labelField) || (0, shared_1.isHtmlField)(labelField) || (0, shared_1.isMarkdownField)(labelField);
    const shouldUsePercentStacking = visualizationId === shared_1.WizardVisualizationId.Area100p;
    const seriesData = preparedData.graphs.map((graph) => {
        return {
            name: graph.title,
            type: 'area',
            stackId: graph.stack,
            stacking: shouldUsePercentStacking ? 'percent' : 'normal',
            color: graph.color,
            data: graph.data.reduce((acc, item, index) => {
                const dataItem = {
                    y: (item === null || item === void 0 ? void 0 : item.y) || 0,
                    custom: item.custom,
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
            dataLabels: {
                enabled: isDataLabelsEnabled,
                html: shouldUseHtmlForLabels,
            },
            custom: {
                ...graph.custom,
                exportSettings,
                colorValue: graph.colorValue,
                shapeValue: graph.shapeValue,
            },
            yAxis: graph.yAxis,
        };
    });
    let legend;
    if (seriesData.length <= 1) {
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
            xAxis.type = ((_c = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) === null || _c === void 0 ? void 0 : _c.type) === 'logarithmic' ? 'logarithmic' : 'linear';
        }
    }
    const config = {
        series: {
            data: seriesData,
        },
        xAxis,
        legend,
    };
    if (yFields[0]) {
        config.tooltip = {
            valueFormat: (0, format_1.getFieldFormatOptions)({ field: yFields[0] }),
        };
    }
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)({
        extraSettings: shared.extraSettings,
        visualization: { placeholders, id: visualizationId },
    }), config);
}
