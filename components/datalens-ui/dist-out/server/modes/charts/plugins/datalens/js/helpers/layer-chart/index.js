"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayerChartMeta = exports.mergeResultForCombinedCharts = exports.extendCombinedChartGraphs = void 0;
exports.combineLayersIntoSingleChart = combineLayersIntoSingleChart;
const extendCombinedChartGraphs = (args) => {
    const { graphs, layer, layers, legendValues } = args;
    const charType = layer.id;
    const layerSettingsLayerId = layer.layerSettings.id;
    graphs.forEach((graph) => {
        graph.type = charType;
        graph.id = `${graph.id || graph.title}__${layerSettingsLayerId}`;
        if (graph.colorGuid) {
            const legendColorValueId = `${graph.colorGuid}__${graph.legendTitle}__${graph.shapeGuid}`;
            if (layers.length > 1) {
                graph.title = `${graph.measureFieldTitle}: ${graph.title}`;
            }
            if (legendValues[legendColorValueId]) {
                graph.id = legendValues[legendColorValueId];
                graph.showInLegend = false;
            }
            else {
                legendValues[legendColorValueId] = graph.id;
            }
        }
        switch (charType) {
            case 'line':
                {
                    const placeholders = layer.placeholders;
                    const hasItemsInYPlaceholder = placeholders[1].items.length;
                    const hasItemsInY2Placeholder = placeholders[2].items.length;
                    if (!hasItemsInYPlaceholder && hasItemsInY2Placeholder && layers.length > 1) {
                        graph.yAxis = 1;
                    }
                }
                break;
            case 'column':
                graph.stack = `${layerSettingsLayerId}__${graph.stack || ''}`;
                break;
            case 'area':
                graph.stack = layerSettingsLayerId;
                break;
            default:
                break;
        }
    });
};
exports.extendCombinedChartGraphs = extendCombinedChartGraphs;
function combineLayersIntoSingleChart({ layers }) {
    if (layers.length > 1) {
        return {
            ...layers[0],
            series: {
                options: layers.reduce((acc, layerData) => { var _a; return ({ ...acc, ...(_a = layerData.series) === null || _a === void 0 ? void 0 : _a.options }); }, {}),
                data: layers.reduce((acc, layerData) => { var _a, _b; return [...acc, ...((_b = (_a = layerData.series) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : [])]; }, []),
            },
        };
    }
    return layers[0];
}
const isChartWithoutData = (graph) => {
    const uniqueData = new Set(graph.data || []);
    const isNullChart = uniqueData.size === 1 && uniqueData.has(null);
    const isEmptyChart = uniqueData.size === 0;
    return isNullChart || isEmptyChart;
};
const mergeResultForCombinedCharts = (result) => {
    if (result.length === 0) {
        return [];
    }
    const [firstChart, ...restData] = result;
    const combinedChartResult = firstChart;
    restData.forEach((item) => {
        combinedChartResult.graphs.push(...item.graphs);
    });
    if (!combinedChartResult.graphs.length) {
        return combinedChartResult;
    }
    const hasOneGraphWithData = combinedChartResult.graphs.some((graph) => {
        return !isChartWithoutData(graph);
    });
    if (hasOneGraphWithData && isChartWithoutData(combinedChartResult.graphs[0])) {
        delete combinedChartResult.categories_ms;
    }
    combinedChartResult.graphs = combinedChartResult.graphs.filter((graph, index) => {
        if (hasOneGraphWithData) {
            return !isChartWithoutData(graph);
        }
        return !(isChartWithoutData(graph) && index !== 0);
    });
    return combinedChartResult;
};
exports.mergeResultForCombinedCharts = mergeResultForCombinedCharts;
const getLayerChartMeta = ({ isComboChart }) => {
    const layerChartsMeta = {};
    if (isComboChart) {
        layerChartsMeta.isCategoriesSortAvailable = true;
    }
    return layerChartsMeta;
};
exports.getLayerChartMeta = getLayerChartMeta;
