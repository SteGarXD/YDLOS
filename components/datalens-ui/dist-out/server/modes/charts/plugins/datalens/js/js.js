"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraphPrivate = void 0;
const moment_1 = __importDefault(require("moment"));
const shared_1 = require("../../../../../../shared");
const color_palettes_1 = require("../../helpers/color-palettes");
const misc_1 = require("../../helpers/misc");
const area_1 = require("../preparers/area");
const backend_pivot_table_1 = __importDefault(require("../preparers/backend-pivot-table"));
const bar_x_1 = require("../preparers/bar-x");
const bar_y_1 = require("../preparers/bar-y");
const flat_table_1 = __importDefault(require("../preparers/flat-table"));
const geopoint_1 = __importDefault(require("../preparers/geopoint"));
const geopoint_with_cluster_1 = __importDefault(require("../preparers/geopoint-with-cluster"));
const geopolygon_1 = __importDefault(require("../preparers/geopolygon"));
const heatmap_1 = __importDefault(require("../preparers/heatmap"));
const line_1 = require("../preparers/line");
const gauge_1 = __importDefault(require("../preparers/gauge"));
const metric_1 = __importDefault(require("../preparers/metric"));
const old_pivot_table_1 = __importDefault(require("../preparers/old-pivot-table/old-pivot-table"));
const pie_1 = require("../preparers/pie");
const polyline_1 = __importDefault(require("../preparers/polyline"));
const scatter_1 = require("../preparers/scatter");
const treemap_1 = require("../preparers/treemap");
const config_helpers_1 = require("../utils/config-helpers");
const constants_1 = require("../utils/constants");
const hierarchy_helpers_1 = require("../utils/hierarchy-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
const errors_1 = require("./constants/errors");
const colors_1 = require("./helpers/colors");
const oversize_error_1 = require("./helpers/errors/oversize-error");
const utils_1 = require("./helpers/errors/oversize-error/utils");
const layer_chart_1 = require("./helpers/layer-chart");
const notifications_1 = require("./helpers/notifications");
const totals_1 = require("./helpers/totals");
function getValueForCompare(value, field, otherField) {
    if ((field === null || field === void 0 ? void 0 : field.dataType) === shared_1.DATASET_FIELD_TYPES.DATETIMETZ ||
        ((field === null || field === void 0 ? void 0 : field.dataType) && (0, shared_1.isDateType)(field.dataType) && field.dataType !== (otherField === null || otherField === void 0 ? void 0 : otherField.dataType))) {
        return moment_1.default.utc(value).valueOf();
    }
    if ((0, shared_1.isMarkupField)({ data_type: String(field === null || field === void 0 ? void 0 : field.dataType) }) && (0, shared_1.isMarkupItem)(value)) {
        return (0, shared_1.markupToRawString)(value);
    }
    return value;
}
function mergeData({ data, links }) {
    const mergedData = {
        result: {
            data: [],
            legend: [],
            order: [],
            totals: [],
        },
        fields: [],
        notifications: [],
        fieldsByDataset: {},
    };
    let masterDatasetId;
    const mergedOrder = [];
    Object.keys(data).forEach((key) => {
        var _a, _b, _c;
        // We get the key of the current dataset
        const [currentDatasetId] = (0, misc_1.getDatasetIdAndLayerIdFromKey)(key);
        const mappedFields = data[key].fields.map((item) => ({ ...item, guid: item.id }));
        if (data[key].pivot_data) {
            mergedData.result = data[key];
            mergedData.fields = mappedFields;
            mergedData.notifications = mergedData.notifications.concat(data[key].notifications || []);
            mergedData.fieldsByDataset[currentDatasetId] = mappedFields;
            return;
        }
        mergedData.fields = mergedData.fields.concat(mappedFields);
        mergedData.fieldsByDataset[currentDatasetId] = mappedFields;
        mergedData.notifications = mergedData.notifications.concat(data[key].notifications || []);
        const mergedRows = mergedData.result.data;
        const mergedLegends = mergedData.result.legend || [];
        const resultDataRows = data[key].result_data[0].rows;
        if (!resultDataRows.length) {
            return;
        }
        const legends = resultDataRows.map((el) => el.legend);
        const resultFields = data[key].fields;
        const lastResultRow = resultDataRows[resultDataRows.length - 1];
        const resultContainsTotals = lastResultRow === null || lastResultRow === void 0 ? void 0 : lastResultRow.legend.some((legendItemId) => {
            var _a;
            const field = resultFields.find((field) => field.legend_item_id === legendItemId);
            return ((_a = field === null || field === void 0 ? void 0 : field.role_spec) === null || _a === void 0 ? void 0 : _a.role) === 'total';
        });
        let isEmptyPlaceholder = false;
        const currentOrder = [];
        if ((lastResultRow === null || lastResultRow === void 0 ? void 0 : lastResultRow.legend.length) === 1) {
            const field = resultFields.find((field) => field.legend_item_id === (lastResultRow === null || lastResultRow === void 0 ? void 0 : lastResultRow.legend[0]));
            // A case where multi-datasets are used and the only thing that lies in the last row with data is an empty row
            // Occurs when only a Dimension is used in one of the datasets and the role: template is specified for it in the request
            // This placeholder then breaks the visualization if you don't get rid of it.
            // Therefore, we are looking for a field and if it is a template, we delete it from the array of strings.
            isEmptyPlaceholder = ((_a = field === null || field === void 0 ? void 0 : field.role_spec) === null || _a === void 0 ? void 0 : _a.role) === 'template';
        }
        if (resultContainsTotals || isEmptyPlaceholder) {
            resultDataRows.pop();
        }
        // If this is the first dataset, then this is the master dataset
        const isFirstDataset = mergedRows.length === 0;
        if (isFirstDataset) {
            masterDatasetId = currentDatasetId;
            // Merge all values
            resultDataRows.forEach((row, i) => {
                mergedRows[i] = [...row.data];
                mergedLegends[i] = [...row.legend];
            });
            const rowLegendIds = ((_b = resultDataRows[0]) === null || _b === void 0 ? void 0 : _b.legend) || [];
            rowLegendIds.forEach((legendId) => {
                const field = resultFields.find((f) => f.legend_item_id === legendId);
                if (field) {
                    mergedOrder.push({
                        datasetId: currentDatasetId,
                        title: field.title,
                        dataType: field.data_type,
                    });
                }
            });
        }
        else {
            // If this is not the first dataset, then we will merge the values by connections
            // We record the order of the fields in the current dataset
            // First we write down the original types
            const rowLegendIds = ((_c = resultDataRows[0]) === null || _c === void 0 ? void 0 : _c.legend) || [];
            rowLegendIds.forEach((legendId) => {
                const field = resultFields.find((field) => field.legend_item_id === legendId);
                if (field) {
                    currentOrder.push({
                        guid: field.id,
                        title: field.title,
                        dataType: field.data_type,
                    });
                }
            });
            // We write out the order of the fields from the wizard and the current dataset
            const fieldsInMaster = mergedOrder.map((entries) => {
                const entry = Array.isArray(entries) ? entries[0] : entries;
                return {
                    title: entry.title,
                    dataType: entry.dataType,
                };
            });
            // We find the necessary connections between the current dataset and the master
            const neededLinks = links.filter((link) => {
                return link.fields[currentDatasetId] && link.fields[masterDatasetId];
            });
            const indexInMasterByIndexInCurrent = {};
            const indexInCurrentByLinkIndex = {};
            neededLinks.forEach((link, linkIndex) => {
                const current = link.fields[currentDatasetId].field;
                const currentFieldData = mergedData.fields.find((field) => field.guid === current.guid) || current;
                const master = link.fields[masterDatasetId].field;
                const masterFieldData = mergedData.fields.find((field) => field.guid === master.guid) || master;
                const indexInMaster = fieldsInMaster.findIndex(({ title }) => title === masterFieldData.title);
                const indexInCurrent = currentOrder.findIndex(({ title }) => title === currentFieldData.title);
                indexInCurrentByLinkIndex[linkIndex] = indexInCurrent;
                indexInMasterByIndexInCurrent[indexInCurrent] = indexInMaster;
            });
            currentOrder.forEach((_title, i) => {
                const indexInMaster = indexInMasterByIndexInCurrent[i];
                const resultOrderItem = {
                    datasetId: currentDatasetId,
                    title: currentOrder[i].title,
                    dataType: currentOrder[i].dataType,
                };
                if (typeof indexInMaster === 'undefined') {
                    mergedOrder.push(resultOrderItem);
                }
                else {
                    const currentOrderItem = mergedOrder[indexInMaster];
                    if (!Array.isArray(currentOrderItem)) {
                        mergedOrder[indexInMaster] = [currentOrderItem];
                    }
                    mergedOrder[indexInMaster].push(resultOrderItem);
                }
            });
            const linkOrder = neededLinks.map((link) => {
                const left = mergedOrder.findIndex((item) => {
                    var _a;
                    const orderItem = Array.isArray(item) ? item[0] : item;
                    return orderItem.title === ((_a = link.fields[masterDatasetId]) === null || _a === void 0 ? void 0 : _a.field.title);
                });
                const right = currentOrder.findIndex((item) => {
                    var _a;
                    return item.title === ((_a = link.fields[currentDatasetId]) === null || _a === void 0 ? void 0 : _a.field.title);
                });
                return [left, right];
            });
            const sourceDataMap = {};
            mergedRows.forEach((row) => {
                const joinBy = linkOrder
                    .map(([left, right]) => {
                    const orderItems = mergedOrder[left];
                    const field = Array.isArray(orderItems) ? orderItems[0] : orderItems;
                    return getValueForCompare(row[left], field, currentOrder[right]);
                })
                    .join();
                sourceDataMap[joinBy] = row;
            });
            const newMergedRows = [];
            const rows = data[key].result_data[0].rows;
            rows.forEach((row) => {
                const joinBy = linkOrder
                    .map(([left, right]) => {
                    const orderItem = mergedOrder[left];
                    const otherField = Array.isArray(orderItem) ? orderItem[0] : orderItem;
                    return getValueForCompare(row.data[right], currentOrder[right], otherField);
                })
                    .join();
                let targetRow = sourceDataMap[joinBy];
                const possibleTargetRow = [];
                linkOrder.forEach(([left, right]) => {
                    possibleTargetRow[left] = row.data[right];
                });
                const unlinkedFields = [];
                // Merge unlinked indicators
                // TODO here it will still be necessary to check that this is an indicator when there is a type in fields
                row.data.forEach((value, i) => {
                    // If the field is not merged yet
                    if (typeof indexInMasterByIndexInCurrent[i] === 'undefined') {
                        unlinkedFields.push(value);
                    }
                });
                if (!targetRow || targetRow.length + unlinkedFields.length > mergedOrder.length) {
                    targetRow = possibleTargetRow;
                    newMergedRows.push(targetRow);
                }
                while (mergedOrder.length > targetRow.length + unlinkedFields.length) {
                    targetRow.push(null);
                }
                unlinkedFields.forEach((field) => {
                    targetRow.push(field);
                });
            });
            mergedData.result.data = [...mergedRows, ...newMergedRows];
            mergedData.result.legend = [...mergedLegends, ...legends];
        }
        if (resultContainsTotals) {
            mergedData.result.totals = (0, totals_1.getMergedTotals)({
                isFirstDataset,
                mergedOrder,
                lastResultRow,
                totals: mergedData.result.totals,
                currentOrder,
                resultDataRows,
            });
        }
    });
    mergedData.result.order = mergedOrder;
    return mergedData;
}
// eslint-disable-next-line complexity
function prepareSingleResult({ resultData, fields, notifications, visualization, shared, idToTitle, idToDataType, ChartEditor, datasetsIds, loadedColorPalettes, layerChartMeta, usedColors, palettes, features, plugin, defaultColorPaletteId, }) {
    var _a, _b;
    const isVisualizationWithLayers = Boolean(visualization.layerSettings);
    const commonPlaceholders = visualization.commonPlaceholders;
    (0, hierarchy_helpers_1.preprocessHierarchies)({
        visualizationId: visualization.id,
        placeholders: visualization.placeholders,
        params: ChartEditor.getParams(),
        sharedData: shared.sharedData,
        colors: isVisualizationWithLayers ? commonPlaceholders.colors : shared.colors,
        shapes: (isVisualizationWithLayers ? commonPlaceholders.shapes : shared.shapes) || [],
        segments: shared.segments || [],
    });
    const { sharedData: { drillDownData }, } = shared;
    let rowsLength;
    let cellsCount;
    let columnsCount;
    if (resultData === null || resultData === void 0 ? void 0 : resultData.pivot_data) {
        const pivotData = resultData.pivot_data;
        const rows = pivotData.rows || [];
        const columns = pivotData.columns || [];
        const rowsValues = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.values) || [];
        cellsCount = rows.length * rowsValues.length;
        columnsCount = columns.length;
    }
    else {
        rowsLength = resultData.data && resultData.data.length;
    }
    if (notifications.length) {
        notifications = (0, notifications_1.prepareNotifications)(notifications, visualization);
        ChartEditor.setChartsInsights(notifications);
    }
    if (drillDownData) {
        const currentDrillDownField = drillDownData.fields[drillDownData.level];
        ChartEditor.updateConfig({
            drillDown: {
                breadcrumbs: drillDownData.breadcrumbs,
                dateFormat: (0, misc_helpers_1.getServerDateFormat)((currentDrillDownField === null || currentDrillDownField === void 0 ? void 0 : currentDrillDownField.data_type) || ''),
            },
        });
        ChartEditor.updateParams({
            drillDownLevel: drillDownData.level,
            drillDownFilters: drillDownData.filters,
            isColorDrillDown: drillDownData.isColorDrillDown,
        });
    }
    if (rowsLength === 0) {
        return {};
    }
    let prepare;
    let rowsLimit;
    let cellsLimit;
    let columnsLimit;
    let shapes = [];
    let shapesConfig;
    const segments = shared.segments || [];
    switch (visualization.id) {
        case shared_1.WizardVisualizationId.Line: {
            shapes = shared.shapes || [];
            shapesConfig = shared.shapesConfig;
            if (plugin === 'gravity-charts') {
                prepare = line_1.prepareGravityChartLine;
            }
            else {
                prepare = line_1.prepareHighchartsLine;
            }
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.Area:
        case shared_1.WizardVisualizationId.Area100p: {
            if (plugin === 'gravity-charts') {
                prepare = area_1.prepareGravityChartArea;
            }
            else {
                prepare = line_1.prepareHighchartsLine;
            }
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.Bar:
        case shared_1.WizardVisualizationId.Bar100p: {
            if (plugin === 'gravity-charts') {
                prepare = bar_y_1.prepareGravityChartsBarY;
            }
            else {
                prepare = bar_y_1.prepareHighchartsBarY;
            }
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.BarYD3:
        case shared_1.WizardVisualizationId.BarY100pD3: {
            prepare = bar_y_1.prepareGravityChartsBarY;
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.LineD3: {
            shapes = shared.shapes || [];
            shapesConfig = shared.shapesConfig;
            prepare = line_1.prepareGravityChartLine;
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.Column:
        case shared_1.WizardVisualizationId.Column100p: {
            if (plugin === 'gravity-charts') {
                prepare = bar_x_1.prepareGravityChartBarX;
            }
            else {
                prepare = bar_x_1.prepareHighchartsBarX;
            }
            rowsLimit = 75000;
            break;
        }
        case 'bar-x-d3': {
            prepare = bar_x_1.prepareGravityChartBarX;
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.Scatter: {
            if (plugin === 'gravity-charts') {
                prepare = scatter_1.prepareGravityChartsScatter;
            }
            else {
                prepare = scatter_1.prepareHighchartsScatter;
            }
            shapes = shared.shapes || [];
            shapesConfig = shared.shapesConfig;
            rowsLimit = 75000;
            break;
        }
        case 'scatter-d3':
            shapes = shared.shapes || [];
            shapesConfig = shared.shapesConfig;
            prepare = scatter_1.prepareGravityChartsScatter;
            rowsLimit = 75000;
            break;
        case 'pie':
        case 'donut':
            if (plugin === 'gravity-charts') {
                prepare = pie_1.prepareD3Pie;
            }
            else {
                prepare = pie_1.prepareHighchartsPie;
            }
            rowsLimit = 1000;
            break;
        case shared_1.WizardVisualizationId.PieD3:
        case shared_1.WizardVisualizationId.DonutD3:
            prepare = pie_1.prepareD3Pie;
            rowsLimit = 1000;
            break;
        case 'metric':
            prepare = metric_1.default;
            rowsLimit = 1000;
            break;
        case shared_1.WizardVisualizationId.Gauge:
            prepare = gauge_1.default;
            rowsLimit = 1000;
            break;
        case 'treemap':
            if (plugin === 'gravity-charts') {
                prepare = treemap_1.prepareD3Treemap;
            }
            else {
                prepare = treemap_1.prepareHighchartsTreemap;
            }
            rowsLimit = 800;
            break;
        case shared_1.WizardVisualizationId.TreemapD3:
            prepare = treemap_1.prepareD3Treemap;
            rowsLimit = 800;
            break;
        case 'flatTable':
            prepare = flat_table_1.default;
            rowsLimit = 100000;
            break;
        case 'pivotTable': {
            const pivotFallbackEnabled = ((_b = shared.extraSettings) === null || _b === void 0 ? void 0 : _b.pivotFallback) === 'on';
            if (pivotFallbackEnabled) {
                prepare = old_pivot_table_1.default;
                rowsLimit = 40000;
            }
            else {
                prepare = backend_pivot_table_1.default;
                cellsLimit = 100000;
                columnsLimit = 800;
            }
            break;
        }
        case 'geopoint':
            prepare = geopoint_1.default;
            rowsLimit = 40000;
            break;
        case 'geopoint-with-cluster':
            prepare = geopoint_with_cluster_1.default;
            rowsLimit = 40000;
            break;
        case 'geopolygon':
            prepare = geopolygon_1.default;
            rowsLimit = 40000;
            break;
        case 'heatmap':
            prepare = heatmap_1.default;
            rowsLimit = 40000;
            break;
        case 'polyline':
            prepare = polyline_1.default;
            rowsLimit = 40000;
            break;
    }
    const oversize = (0, utils_1.isDefaultOversizeError)(rowsLength, rowsLimit);
    const backendPivotCellsOversize = (0, utils_1.isBackendPivotCellsOversizeError)(cellsCount, cellsLimit);
    const backendPivotColumnsOversize = (0, utils_1.isBackendPivotColumnsOversizeError)(columnsCount, columnsLimit);
    const { segmentsOversize, segmentsNumber } = (0, utils_1.isSegmentsOversizeError)({
        segments,
        idToTitle,
        order: resultData.order,
        data: resultData.data,
    });
    const isChartOversizeError = oversize || backendPivotCellsOversize || backendPivotColumnsOversize || segmentsOversize;
    if (isChartOversizeError) {
        let errorType;
        let limit;
        let current;
        if (backendPivotColumnsOversize) {
            errorType = errors_1.OversizeErrorType.PivotTableColumns;
            limit = columnsLimit;
            current = columnsCount;
        }
        else if (backendPivotCellsOversize) {
            errorType = errors_1.OversizeErrorType.PivotTableCells;
            limit = cellsLimit;
            current = cellsCount;
        }
        else if (segmentsOversize) {
            errorType = errors_1.OversizeErrorType.SegmentsNumber;
            limit = shared_1.MAX_SEGMENTS_NUMBER;
            current = segmentsNumber;
        }
        else {
            errorType = errors_1.OversizeErrorType.Default;
            limit = rowsLimit;
            current = rowsLength;
        }
        const oversizeError = (0, oversize_error_1.getOversizeError)({
            type: errorType,
            limit,
            current: current,
        });
        ChartEditor._setError(oversizeError);
        return {};
    }
    let { colors = [], colorsConfig, labels = [], tooltips = [], tooltipConfig, geopointsConfig, sort = [], } = shared;
    if (visualization.layerSettings) {
        ({
            geopointsConfig,
            colors,
            colorsConfig = {},
            labels,
            tooltips,
            sort,
            shapes = [],
            shapesConfig = {},
            tooltipConfig,
        } = visualization.commonPlaceholders);
    }
    const chartColorsConfig = (0, colors_1.getChartColorsConfig)({
        loadedColorPalettes,
        colorsConfig,
        availablePalettes: palettes,
        defaultColorPaletteId,
    });
    const prepareFunctionArgs = {
        placeholders: visualization.placeholders,
        colors,
        colorsConfig: chartColorsConfig,
        geopointsConfig,
        sort,
        visualizationId: visualization.id,
        layerSettings: visualization.layerSettings,
        labels,
        tooltips,
        tooltipConfig,
        datasets: datasetsIds,
        resultData,
        fields,
        idToTitle,
        idToDataType,
        shared,
        ChartEditor,
        shapes,
        shapesConfig,
        segments,
        layerChartMeta,
        usedColors,
        features,
        defaultColorPaletteId,
    };
    return prepare(prepareFunctionArgs);
}
const buildGraphPrivate = (args) => {
    var _a, _b, _c, _d;
    const { shared: chartSharedConfig, ChartEditor, data, palettes, features, plugin, defaultColorPaletteId, } = args;
    (0, misc_helpers_1.log)('LOADED DATA:');
    (0, misc_helpers_1.log)(data);
    const shared = (0, config_helpers_1.mapChartsConfigToServerConfig)(chartSharedConfig);
    const { colorPalettes: loadedColorPalettes, loadedData } = (0, color_palettes_1.extractColorPalettesFromData)(data);
    (0, misc_helpers_1.log)('LINKS:');
    (0, misc_helpers_1.log)(shared.links);
    Object.entries(loadedData).forEach(([key, value]) => {
        var _a;
        const query = (value.blocks || [])
            .map((block) => block.query)
            .filter(Boolean)
            .join('\n\n');
        if (query) {
            // For the inspector in ChartKit, we report the original request for data
            ChartEditor.setDataSourceInfo(key, { query });
        }
        if (value.data_export_forbidden) {
            // Hiding the data export button in the ChartKit menu
            (_a = ChartEditor.setExtra) === null || _a === void 0 ? void 0 : _a.call(ChartEditor, 'dataExportForbidden', true);
        }
    });
    const newParams = {};
    const idToTitle = {};
    const idToDataType = {};
    const layers = shared.visualization.layers;
    let datasetsMeta = [];
    let mergedData;
    const datasetsSchemaFields = shared.datasetsPartialFields;
    const datasetsIds = shared.datasetsIds;
    // If we have layers, then for each layer we get 1 set of merged data
    // If we don 't have layers , then we get 1 set of merged data according to the classics
    if (layers) {
        mergedData = [];
        layers.forEach((layer) => {
            const layerData = {};
            Object.keys(loadedData).forEach((key) => {
                var _a;
                const [_datasetId, layerId] = (0, misc_1.getDatasetIdAndLayerIdFromKey)(key);
                if (((_a = layer.layerSettings) === null || _a === void 0 ? void 0 : _a.id) === layerId) {
                    layerData[key.replace(layerId, '')] = loadedData[key];
                }
            });
            const layerMergedData = mergeData({
                data: layerData,
                links: shared.links,
            });
            const datasetFields = layerMergedData.fields;
            datasetFields.forEach((field) => {
                const fieldId = field.guid || field.id;
                newParams[fieldId] = [];
                idToTitle[fieldId] = field.title;
                idToDataType[fieldId] = field.data_type;
            });
            mergedData.push(layerMergedData);
            datasetsMeta = datasetsIds.map((id, datasetIndex) => {
                var _a;
                if (datasetsMeta[datasetIndex]) {
                    return datasetsMeta[datasetIndex];
                }
                if (!layerMergedData.fieldsByDataset[id]) {
                    return [];
                }
                const fields = {};
                const schema = (_a = datasetsSchemaFields[datasetIndex]) !== null && _a !== void 0 ? _a : [];
                schema.forEach((item) => {
                    fields[item.guid] = idToTitle[item.guid];
                });
                return {
                    id,
                    fields,
                    fieldsList: (0, misc_1.getFieldList)(layerMergedData.fieldsByDataset[id], layer.placeholders),
                };
            });
        });
    }
    else {
        mergedData = [
            mergeData({
                data: loadedData,
                links: shared.links,
            }),
        ];
        const datasetFields = mergedData[0].fields;
        datasetFields.forEach((field) => {
            const fieldId = field.guid || field.id;
            newParams[fieldId] = [];
            idToTitle[fieldId] = field.title;
            idToDataType[fieldId] = field.data_type;
        });
        datasetsMeta = datasetsIds.map((id, datasetIndex) => {
            var _a;
            if (!mergedData[0].fieldsByDataset[id]) {
                return [];
            }
            const fields = {};
            const schema = (_a = datasetsSchemaFields[datasetIndex]) !== null && _a !== void 0 ? _a : [];
            schema.forEach((item) => {
                fields[item.guid] = idToTitle[item.guid];
            });
            return {
                id,
                fields,
                fieldsList: (0, misc_1.getFieldList)(mergedData[0].fieldsByDataset[id], shared.visualization.placeholders),
            };
        });
    }
    ChartEditor.updateParams(newParams);
    ChartEditor.setExtra('datasets', datasetsMeta);
    (0, misc_helpers_1.log)('MERGED DATA:');
    (0, misc_helpers_1.log)(mergedData);
    let result = [];
    let bounds = null;
    if (layers) {
        const legendValues = {};
        const layerChartMeta = (0, layer_chart_1.getLayerChartMeta)({
            isComboChart: shared.visualization.id === 'combined-chart',
        });
        const usedColors = [];
        layers.forEach((layer, layerIndex) => {
            const resultData = mergedData[layerIndex].result;
            const fields = mergedData[layerIndex].fields;
            const notifications = mergedData[layerIndex].notifications;
            const localResult = prepareSingleResult({
                resultData,
                fields,
                notifications,
                shared: shared,
                visualization: layer,
                idToTitle,
                idToDataType,
                ChartEditor,
                datasetsIds,
                loadedColorPalettes,
                layerChartMeta,
                usedColors,
                palettes,
                features,
                plugin,
                defaultColorPaletteId,
            });
            if (localResult && localResult[0] && localResult[0].bounds) {
                const { bounds: localBounds } = localResult[0];
                const boundExists = Boolean(bounds && bounds[0] && bounds[1]);
                const localBoundExists = Boolean(localBounds && localBounds[0] && localBounds[1]);
                if (boundExists && localBoundExists) {
                    if (localBounds[0][constants_1.LAT] < bounds[0][constants_1.LAT]) {
                        bounds[0][constants_1.LAT] = localBounds[0][constants_1.LAT];
                    }
                    if (localBounds[0][constants_1.LONG] < bounds[0][constants_1.LONG]) {
                        bounds[0][constants_1.LONG] = localBounds[0][constants_1.LONG];
                    }
                    if (localBounds[1][constants_1.LAT] > bounds[1][constants_1.LAT]) {
                        bounds[1][constants_1.LAT] = localBounds[1][constants_1.LAT];
                    }
                    if (localBounds[1][constants_1.LONG] > bounds[1][constants_1.LONG]) {
                        bounds[1][constants_1.LONG] = localBounds[1][constants_1.LONG];
                    }
                }
                else if (localBoundExists) {
                    bounds = [...localBounds];
                }
            }
            if (shared.visualization.id === shared_1.WizardVisualizationId.CombinedChart) {
                if (plugin === 'gravity-charts') {
                    result.push(localResult);
                }
                else if (localResult === null || localResult === void 0 ? void 0 : localResult.graphs) {
                    (0, layer_chart_1.extendCombinedChartGraphs)({
                        graphs: localResult.graphs,
                        layer,
                        layers,
                        legendValues,
                    });
                    result = result.concat(localResult);
                }
            }
            else if (Array.isArray(localResult)) {
                result = [...result, ...localResult];
            }
        });
        if (shared.visualization.id === shared_1.WizardVisualizationId.CombinedChart) {
            if (plugin === 'gravity-charts') {
                result = (0, layer_chart_1.combineLayersIntoSingleChart)({ layers: result });
            }
            else {
                result = (0, layer_chart_1.mergeResultForCombinedCharts)(result);
            }
        }
    }
    else {
        const resultData = mergedData[0].result;
        const fields = mergedData[0].fields;
        const notifications = mergedData[0].notifications;
        result = prepareSingleResult({
            resultData,
            fields,
            notifications,
            shared: shared,
            visualization: shared.visualization,
            idToTitle,
            idToDataType,
            ChartEditor,
            datasetsIds,
            loadedColorPalettes,
            palettes,
            features,
            plugin,
            defaultColorPaletteId,
        });
        if ((_a = result === null || result === void 0 ? void 0 : result[0]) === null || _a === void 0 ? void 0 : _a.bounds) {
            bounds = result[0].bounds;
        }
    }
    if (bounds) {
        ChartEditor.updateHighchartsConfig({
            ...(Boolean(bounds) && { state: { bounds } }),
        });
    }
    const isTableChart = [
        shared_1.WizardVisualizationId.FlatTable,
        shared_1.WizardVisualizationId.PivotTable,
    ].includes(shared.visualization.id);
    if (isTableChart) {
        const page = ChartEditor.getCurrentPage();
        const limit = (_b = shared.extraSettings) === null || _b === void 0 ? void 0 : _b.limit;
        const shouldDisablePaginator = page === 1 && limit && limit > ((_d = (_c = result.rows) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0);
        if (shouldDisablePaginator) {
            ChartEditor.updateConfig({ paginator: { enabled: false } });
        }
    }
    (0, misc_helpers_1.log)('RESULT:');
    (0, misc_helpers_1.log)(result);
    return result;
};
exports.buildGraphPrivate = buildGraphPrivate;
