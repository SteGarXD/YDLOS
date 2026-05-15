"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGraph = buildGraph;
const shared_1 = require("../../../../../../../shared");
const common_helpers_1 = require("../../../../../../../shared/modules/colors/common-helpers");
const ql_1 = require("../../../../../../../shared/modules/config/ql");
const prepare_single_result_1 = __importDefault(require("../../../datalens/js/helpers/misc/prepare-single-result"));
const color_palettes_1 = require("../../../helpers/color-palettes");
const misc_1 = require("../../../helpers/misc");
const misc_helpers_1 = require("../../utils/misc-helpers");
const line_1 = __importDefault(require("./../../preparers/line"));
const line_time_1 = __importDefault(require("./../../preparers/line-time"));
const metric_1 = __importDefault(require("./../../preparers/metric"));
const pie_1 = __importDefault(require("./../../preparers/pie"));
const preview_table_1 = __importDefault(require("./../../preparers/preview-table"));
const table_1 = __importDefault(require("./../../preparers/table"));
const constants_1 = require("./../../utils/constants");
const visualization_utils_1 = require("./../../utils/visualization-utils");
// eslint-disable-next-line complexity
function buildGraph(args) {
    var _a;
    const { shared, ChartEditor, features, palettes, qlConnectionTypeMap, plugin, defaultColorPaletteId, } = args;
    const data = ChartEditor.getLoadedData();
    (0, misc_helpers_1.log)('LOADED DATA:', data);
    let tablePreviewData;
    let prepare;
    let result;
    const config = (0, ql_1.mapQlConfigToLatestVersion)(shared, { i18n: ChartEditor.getTranslation });
    const { colorPalettes: loadedColorPalettes, loadedData } = (0, color_palettes_1.extractColorPalettesFromData)(data);
    const { columns, rows } = (0, misc_helpers_1.getColumnsAndRows)({
        chartType: config.chartType,
        ChartEditor,
        queries: config.queries,
        connectionType: config.connection.type,
        data: loadedData,
        qlConnectionTypeMap,
    });
    if (typeof columns === 'undefined' ||
        columns.length === 0 ||
        typeof rows === 'undefined' ||
        rows.length === 0) {
        return {};
    }
    (0, misc_helpers_1.log)('RECOGNIZED COLUMNS:', columns);
    (0, misc_helpers_1.log)('RECOGNIZED ROWS:', rows);
    if (config.connection.dataExportForbidden) {
        // Hiding the data export button in the ChartKit menu
        (_a = ChartEditor.setExtra) === null || _a === void 0 ? void 0 : _a.call(ChartEditor, 'dataExportForbidden', true);
    }
    const sharedVisualization = config.visualization;
    const { colors: sharedColors, labels: sharedLabels, shapes: sharedShapes, order: sharedOrder, } = config;
    if (sharedVisualization === null || sharedVisualization === void 0 ? void 0 : sharedVisualization.placeholders) {
        // Branch for actual ql charts
        const order = [];
        const resultData = {
            data: rows,
            order,
            totals: [],
        };
        const datasetId = 'ql-mocked-dataset';
        const orderedColumns = [...columns].sort((columnA, columnB) => {
            return columnA.name > columnB.name ? 1 : -1;
        });
        const columnNames = new Set();
        // Converting dashsql columns to wizard fields
        const fields = columns.map((column) => {
            const guessedType = (column.biType ||
                shared_1.DATASET_FIELD_TYPES.STRING);
            let fieldGuid;
            if (columnNames.has(column.name)) {
                const orderedIndex = orderedColumns.findIndex((orderedColumn) => orderedColumn.name === column.name);
                fieldGuid = `${column.name}-${orderedIndex}`;
            }
            else {
                columnNames.add(column.name);
                fieldGuid = column.name;
            }
            return {
                guid: fieldGuid,
                title: column.name,
                datasetId,
                data_type: guessedType,
                cast: guessedType,
                type: shared_1.DatasetFieldType.Dimension,
                calc_mode: 'direct',
                inspectHidden: true,
                formulaHidden: true,
                noEdit: true,
            };
        });
        // Adding pseudo column named "Column names"
        if (fields.length > 1 &&
            fields.findIndex(({ type }) => type === shared_1.DatasetFieldType.Pseudo) === -1) {
            fields.push({
                title: 'Column Names',
                type: shared_1.DatasetFieldType.Pseudo,
                data_type: shared_1.DATASET_FIELD_TYPES.STRING,
                inspectHidden: true,
                formulaHidden: true,
                noEdit: true,
                guid: '',
                datasetId: '',
                cast: shared_1.DATASET_FIELD_TYPES.STRING,
                calc_mode: 'direct',
            });
        }
        const distincts = [];
        // Generating distincts from data
        rows.forEach((row) => {
            row.forEach((value, j) => {
                if (!distincts[j]) {
                    distincts[j] = new Set();
                }
                if (!distincts[j].has(value)) {
                    distincts[j].add(String(value));
                }
            });
        });
        const resultDistincts = {};
        fields.forEach((column, i) => {
            if (distincts[i]) {
                resultDistincts[column.guid] = Array.from(distincts[i]).sort();
            }
        });
        const idToTitle = {};
        const idToDataType = {};
        const datasetsIds = [];
        fields.forEach((column) => {
            idToTitle[column.guid] = column.title;
            idToDataType[column.guid] = column.data_type;
            order.push({
                datasetId,
                title: column.title,
            });
        });
        let newColors = sharedColors;
        let newLabels = sharedLabels;
        let newShapes = sharedShapes;
        let newVisualization = sharedVisualization;
        const visualizationIsEmpty = sharedVisualization.placeholders.every((placeholder) => placeholder.items.length === 0);
        if (visualizationIsEmpty) {
            const isMultipleDistinctsAvailable = features[shared_1.Feature.MultipleColorsInVisualization] &&
                (0, common_helpers_1.isChartSupportMultipleColors)(config.chartType, sharedVisualization.id);
            // Visualization is empty, so we need to autofill it
            const { colors, visualization } = (0, visualization_utils_1.migrateOrAutofillVisualization)({
                visualization: sharedVisualization,
                fields,
                rows,
                order: sharedOrder,
                colors: sharedColors,
                distinctsMap: isMultipleDistinctsAvailable ? resultDistincts : undefined,
            });
            if (colors) {
                newColors = colors;
            }
            if (visualization) {
                newVisualization = visualization;
            }
        }
        else {
            newVisualization = (0, visualization_utils_1.mapVisualizationPlaceholdersItems)({
                visualization: sharedVisualization,
                fields,
            });
            newColors = (0, visualization_utils_1.mapItems)({
                fields,
                items: sharedColors,
            });
            newLabels = (0, visualization_utils_1.mapItems)({
                fields,
                items: sharedLabels,
            });
            newShapes = (0, visualization_utils_1.mapItems)({
                fields,
                items: sharedShapes,
            });
        }
        const available = [...fields];
        const disableDefaultSorting = (0, misc_helpers_1.doesQueryContainOrderBy)(shared.queryValue);
        const prepareSingleResultArgs = {
            resultData,
            shared: {
                ...config,
                available,
                colors: newColors,
                labels: newLabels,
                shapes: newShapes,
                sort: [],
                sharedData: {},
            },
            visualization: newVisualization,
            idToTitle,
            idToDataType,
            ChartEditor,
            datasetsIds,
            loadedColorPalettes,
            disableDefaultSorting,
            palettes,
            features,
            plugin,
            defaultColorPaletteId,
        };
        result = (0, prepare_single_result_1.default)(prepareSingleResultArgs);
        if (config.preview) {
            result.tablePreviewData = (0, preview_table_1.default)({
                shared: config,
                columns,
                rows,
                ChartEditor,
            });
        }
        if ((0, misc_helpers_1.visualizationCanHaveContinuousAxis)(newVisualization)) {
            const targetPlaceholderId = [
                shared_1.VISUALIZATION_IDS.BAR,
                shared_1.VISUALIZATION_IDS.BAR_100P,
            ].includes(newVisualization.id)
                ? shared_1.PlaceholderId.Y
                : shared_1.PlaceholderId.X;
            const targetPlaceholder = newVisualization.placeholders.find(({ id }) => id === targetPlaceholderId);
            if (targetPlaceholder && targetPlaceholder.items[0]) {
                if (disableDefaultSorting) {
                    targetPlaceholder.settings = {
                        axisModeMap: {
                            [targetPlaceholder.items[0].guid]: "discrete" /* AxisMode.Discrete */,
                        },
                        disableAxisMode: true,
                    };
                }
                else {
                    targetPlaceholder.settings = {
                        disableAxisMode: false,
                    };
                }
            }
        }
        if (Array.isArray(result) && result[0]) {
            result[0].metadata = {
                visualization: newVisualization,
                available,
                colors: newColors,
                labels: newLabels,
                shapes: newShapes,
                distincts: resultDistincts,
            };
        }
        else {
            result.metadata = {
                visualization: newVisualization,
                available,
                colors: newColors,
                labels: newLabels,
                shapes: newShapes,
                distincts: resultDistincts,
            };
            if (result.graphs) {
                const pointConflict = result.graphs.some((graph) => graph.pointConflict);
                if (pointConflict) {
                    result.metadata.pointConflict = pointConflict;
                }
            }
        }
        ChartEditor.setExtra('datasets', [
            {
                id: datasetId,
                fieldsList: (0, misc_1.getFieldList)(fields, newVisualization.placeholders),
            },
        ]);
        (0, misc_helpers_1.log)('RESULT:', result);
        return result;
    }
    else if ((0, shared_1.isMonitoringOrPrometheusChart)(config.chartType)) {
        // Branch for older ql charts of promql type
        // Deprecated
        // Works only for old-saved charts from dashboards
        if (config.preview) {
            tablePreviewData = (0, preview_table_1.default)({ shared: config, columns, rows, ChartEditor });
        }
        const { id } = config.visualization;
        if (constants_1.LINEAR_VISUALIZATIONS.has(id)) {
            prepare = line_time_1.default;
        }
        else if (constants_1.PIE_VISUALIZATIONS.has(id)) {
            prepare = pie_1.default;
        }
        else if (id === shared_1.VISUALIZATION_IDS.METRIC) {
            prepare = metric_1.default;
        }
        else if (id === shared_1.VISUALIZATION_IDS.TABLE) {
            prepare = table_1.default;
        }
    }
    else {
        // Branch for older ql charts of sql type
        // Deprecated
        // Works only for old-saved charts from dashboards
        if (config.preview) {
            tablePreviewData = (0, preview_table_1.default)({ shared: config, columns, rows, ChartEditor });
        }
        const { id } = config.visualization;
        let rowsLimit;
        switch (id) {
            case shared_1.VISUALIZATION_IDS.LINE:
            case shared_1.VISUALIZATION_IDS.AREA:
            case shared_1.VISUALIZATION_IDS.AREA_100P:
            case shared_1.VISUALIZATION_IDS.COLUMN:
            case shared_1.VISUALIZATION_IDS.COLUMN_100P:
            case shared_1.VISUALIZATION_IDS.BAR:
            case shared_1.VISUALIZATION_IDS.BAR_100P:
                prepare = line_1.default;
                rowsLimit = 75000;
                break;
            case shared_1.VISUALIZATION_IDS.PIE:
            case shared_1.VISUALIZATION_IDS.DONUT:
                prepare = pie_1.default;
                rowsLimit = 1000;
                break;
            case shared_1.VISUALIZATION_IDS.METRIC:
                prepare = metric_1.default;
                rowsLimit = 1000;
                break;
            case shared_1.VISUALIZATION_IDS.TABLE:
                prepare = table_1.default;
                rowsLimit = 100000;
                break;
            default:
                return {};
        }
        if (rows.length > rowsLimit) {
            ChartEditor._setError({
                code: 'ERR.CHARTS.ROWS_NUMBER_OVERSIZE',
                details: {
                    rowsLength: rows.length,
                    rowsLimit: rowsLimit,
                },
            });
            return {};
        }
    }
    if (prepare) {
        result = prepare({ shared: config, columns, rows, ChartEditor, tablePreviewData });
    }
    (0, misc_helpers_1.log)('RESULT:', result);
    return result;
}
