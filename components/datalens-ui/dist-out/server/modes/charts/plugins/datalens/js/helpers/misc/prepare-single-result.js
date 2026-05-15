"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = __importDefault(require("../../../../../../../configs/common"));
const shared_1 = require("../../../../../../../../shared");
const area_1 = require("../../../preparers/area");
const backend_pivot_table_1 = __importDefault(require("../../../preparers/backend-pivot-table"));
const bar_x_1 = require("../../../preparers/bar-x");
const bar_y_1 = require("../../../preparers/bar-y");
const flat_table_1 = __importDefault(require("../../../preparers/flat-table"));
const geopoint_1 = __importDefault(require("../../../preparers/geopoint"));
const geopolygon_1 = __importDefault(require("../../../preparers/geopolygon"));
const heatmap_1 = __importDefault(require("../../../preparers/heatmap"));
const line_1 = require("../../../preparers/line");
const gravity_charts_1 = require("../../../preparers/line/gravity-charts");
const line_time_1 = __importDefault(require("../../../preparers/line-time"));
const gauge_1 = __importDefault(require("../../../preparers/gauge"));
const metric_1 = __importDefault(require("../../../preparers/metric"));
const old_pivot_table_1 = __importDefault(require("../../../preparers/old-pivot-table/old-pivot-table"));
const pie_1 = require("../../../preparers/pie");
const polyline_1 = __importDefault(require("../../../preparers/polyline"));
const scatter_1 = require("../../../preparers/scatter");
const treemap_1 = require("../../../preparers/treemap");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const errors_1 = require("../../constants/errors");
const colors_1 = require("../colors");
const oversize_error_1 = require("../errors/oversize-error");
const utils_1 = require("../errors/oversize-error/utils");
// eslint-disable-next-line complexity
exports.default = ({ resultData, visualization, shared, idToTitle, idToDataType, ChartEditor, datasetsIds, loadedColorPalettes = {}, disableDefaultSorting = false, palettes, features, plugin, defaultColorPaletteId, }) => {
    var _a, _b;
    const { sharedData: { drillDownData }, chartType, } = shared;
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
    if (drillDownData) {
        const currentDrillDownField = drillDownData.fields[drillDownData.level];
        ChartEditor.updateConfig({
            drillDown: {
                breadcrumbs: drillDownData.breadcrumbs,
                dateFormat: (0, misc_helpers_1.getServerDateFormat)(currentDrillDownField === null || currentDrillDownField === void 0 ? void 0 : currentDrillDownField.data_type),
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
    const segments = shared.segments || [];
    switch (visualization.id) {
        case shared_1.WizardVisualizationId.Line: {
            rowsLimit = 75000;
            if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
                prepare = line_time_1.default;
            }
            else if (plugin === 'gravity-charts') {
                prepare = gravity_charts_1.prepareGravityChartLine;
            }
            else {
                prepare = line_1.prepareHighchartsLine;
            }
            break;
        }
        case shared_1.WizardVisualizationId.Area:
        case shared_1.WizardVisualizationId.Area100p: {
            rowsLimit = 75000;
            if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
                prepare = line_time_1.default;
            }
            else if (plugin === 'gravity-charts') {
                prepare = area_1.prepareGravityChartArea;
            }
            else {
                prepare = line_1.prepareHighchartsLine;
            }
            break;
        }
        case shared_1.WizardVisualizationId.Column:
        case shared_1.WizardVisualizationId.Column100p: {
            rowsLimit = 75000;
            if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
                prepare = line_time_1.default;
            }
            else if (plugin === 'gravity-charts') {
                prepare = bar_x_1.prepareGravityChartBarX;
            }
            else {
                prepare = bar_x_1.prepareHighchartsBarX;
            }
            break;
        }
        case shared_1.WizardVisualizationId.LineD3: {
            if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
                prepare = line_time_1.default;
            }
            else {
                prepare = gravity_charts_1.prepareGravityChartLine;
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
        case shared_1.WizardVisualizationId.BarXD3: {
            prepare = bar_x_1.prepareGravityChartBarX;
            rowsLimit = 75000;
            break;
        }
        case shared_1.WizardVisualizationId.Scatter:
            if (plugin === 'gravity-charts') {
                prepare = scatter_1.prepareGravityChartsScatter;
            }
            else {
                prepare = scatter_1.prepareHighchartsScatter;
            }
            rowsLimit = 75000;
            break;
        case shared_1.WizardVisualizationId.ScatterD3:
            prepare = scatter_1.prepareGravityChartsScatter;
            rowsLimit = 75000;
            break;
        case shared_1.WizardVisualizationId.Pie:
        case shared_1.WizardVisualizationId.Donut:
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
        case shared_1.WizardVisualizationId.Metric:
            prepare = metric_1.default;
            rowsLimit = 1000;
            break;
        case shared_1.WizardVisualizationId.Treemap:
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
        case shared_1.WizardVisualizationId.FlatTable:
            prepare = flat_table_1.default;
            rowsLimit = common_1.default.flatTableRowsLimit;
            break;
        case shared_1.WizardVisualizationId.Gauge:
            prepare = gauge_1.default;
            rowsLimit = 1000;
            break;
        case shared_1.WizardVisualizationId.PivotTable: {
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
    const isChartOversizeError = oversize || backendPivotCellsOversize || backendPivotColumnsOversize;
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
    let { shapes = [], shapesConfig = {}, colors = [], colorsConfig, labels = [], tooltips = [], tooltipConfig, geopointsConfig, sort = [], } = shared;
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
            tooltipConfig = {},
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
        fields: [],
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
        idToTitle,
        idToDataType,
        shared,
        ChartEditor,
        shapes,
        shapesConfig,
        segments,
        disableDefaultSorting,
        features,
        defaultColorPaletteId,
    };
    return prepare(prepareFunctionArgs);
};
