"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../shared");
const distincts_helpers_1 = require("../../../../../../../shared/modules/colors/distincts-helpers");
const colors_1 = require("../../../ql/utils/colors");
const value_helpers_1 = require("../../../ql/utils/value-helpers");
const color_helpers_1 = require("../../utils/color-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
// eslint-disable-next-line complexity
function prepareLineTime(options) {
    var _a;
    const { placeholders, resultData, colors, idToTitle, colorsConfig, defaultColorPaletteId, shared, ChartEditor, } = options;
    const { data, order } = resultData;
    const xField = placeholders[0].items[0];
    if (!xField) {
        return { timeline: [] };
    }
    const xFieldDataType = xField.data_type;
    const xFieldIndex = (0, misc_helpers_1.findIndexInOrder)(order, xField, idToTitle[xField.guid] || xField.title);
    const xFieldIsDate = (0, shared_1.isDateField)(xField);
    const yPlaceholderSettings = ((_a = placeholders[1]) === null || _a === void 0 ? void 0 : _a.settings) || {};
    const yFields = placeholders[1].items;
    const yFieldIndexes = yFields.map((yField) => (0, misc_helpers_1.findIndexInOrder)(order, yField, idToTitle[yField.guid] || yField.title));
    const colorIndexes = colors.map((color) => (0, misc_helpers_1.findIndexInOrder)(order, color, idToTitle[color.guid] || color.title));
    const result = { timeline: [], timeZone: 'UTC' };
    if (yFields.length > 0 && xField) {
        let xValues = [];
        let colorValues = [];
        const dataMatrix = {};
        data.forEach((row) => {
            var _a;
            let xValue = row[xFieldIndex];
            if (typeof xValue !== 'undefined' && xValue !== null && xFieldIsDate) {
                // CHARTS-6632 - revision/study of yagr is necessary, after that moment.utc(xValue) is possible.valueOf();
                xValue = (((_a = (0, shared_1.getUtcDateTime)(xValue)) === null || _a === void 0 ? void 0 : _a.valueOf()) || 0) / 1000;
            }
            else if (xFieldDataType === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
                xValue = (0, value_helpers_1.formatUnknownTypeValue)(xValue);
            }
            xValues.push(xValue);
            yFieldIndexes.forEach((yFieldIndex, i) => {
                const yValue = row[yFieldIndex];
                if (colorIndexes.length > 0) {
                    let colorValue = '';
                    colorIndexes.forEach((colorIndex, j) => {
                        const colorValuePart = colors[j].type === 'PSEUDO' ? yFields[i].title : row[colorIndex];
                        colorValue = (0, distincts_helpers_1.getLineTimeDistinctValue)(colorValuePart, colorValue);
                    });
                    let dataCell = dataMatrix[String(xValue)];
                    if (typeof dataCell === 'undefined') {
                        dataCell = dataMatrix[String(xValue)] = {};
                    }
                    if (typeof dataCell === 'object' && dataCell !== null) {
                        dataCell[String(colorValue)] = (0, value_helpers_1.parseNumberValue)(yValue);
                    }
                    colorValues.push(colorValue);
                }
                else {
                    dataMatrix[String(xValue)] = (0, value_helpers_1.parseNumberValue)(yValue);
                }
            });
        });
        xValues = Array.from(new Set(xValues)).sort();
        colorValues = Array.from(new Set(colorValues)).sort();
        result.timeline = xValues.map((value) => Number(value));
        if (colors.length > 0) {
            const graphs = colorValues.map((colorValue) => {
                return {
                    id: (0, value_helpers_1.renderValue)(colorValue),
                    name: (0, value_helpers_1.renderValue)(colorValue),
                    colorValue: (0, value_helpers_1.renderValue)(colorValue),
                    colorGuid: colors[0].guid || null,
                    color: 'rgb(0,127,0)',
                    data: [],
                };
            });
            xValues.forEach((xValue) => {
                const dataCell = dataMatrix[String(xValue)];
                if (typeof dataCell === 'object' && dataCell !== null) {
                    colorValues.forEach((colorValue, i) => {
                        if (typeof dataCell[String(colorValue)] === 'undefined') {
                            if (yPlaceholderSettings.nulls === "as-0" /* AxisNullsMode.AsZero */) {
                                graphs[i].data.push(0);
                            }
                            else {
                                graphs[i].data.push(null);
                            }
                        }
                        else {
                            graphs[i].data.push(dataCell[String(colorValue)]);
                        }
                    });
                }
            });
            result.graphs = graphs;
        }
        else {
            result.graphs = [];
            yFields.forEach((y) => {
                var _a;
                const graph = {
                    id: y.title,
                    name: y.title,
                    data: xValues.map((xValue) => {
                        return dataMatrix[String(xValue)];
                    }),
                };
                const formatting = (0, shared_1.getFormatOptions)(y);
                const tooltipOptions = (0, misc_helpers_1.getFormatOptionsFromFieldFormatting)(formatting, y.data_type);
                // TODO: add other options when they will be available in Chartkit
                // https://github.com/gravity-ui/chartkit/issues/476
                ChartEditor.updateLibraryConfig({
                    tooltip: {
                        precision: tooltipOptions.chartKitPrecision,
                    },
                });
                (_a = result.graphs) === null || _a === void 0 ? void 0 : _a.push(graph);
            });
        }
    }
    else if (xField) {
        let xValues = [];
        data.forEach((row) => {
            var _a;
            let xValue = row[xFieldIndex];
            if (typeof xValue !== 'undefined' && xValue !== null && xFieldIsDate) {
                // CHARTS-6632 - revision/study of yagr is necessary, after that moment.utc(xValue) is possible.valueOf();
                xValue = (((_a = (0, shared_1.getUtcDateTime)(xValue)) === null || _a === void 0 ? void 0 : _a.valueOf()) || 0).valueOf() / 1000;
            }
            else if (xFieldDataType === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
                xValue = (0, value_helpers_1.formatUnknownTypeValue)(xValue);
            }
            xValues.push(xValue);
        });
        xValues = Array.from(new Set(xValues)).sort();
        result.timeline = xValues.map((value) => Number(value));
        result.graphs = [
            {
                data: data.map(() => {
                    return null;
                }),
            },
        ];
        return result;
    }
    else {
        result.graphs = [];
        return result;
    }
    result.graphs.sort((graph1, graph2) => {
        if (graph1.name && graph2.name) {
            return collator.compare(String(graph1.name), String(graph2.name));
        }
        else {
            return 0;
        }
    });
    result.graphs.forEach((graph) => {
        graph.spanGaps = yPlaceholderSettings.nulls === "connect" /* AxisNullsMode.Connect */;
    });
    const useColorizingWithPalettes = colorsConfig.mountedColors && Object.keys(colorsConfig.mountedColors).length > 0;
    if (useColorizingWithPalettes) {
        // Use usual colorizing with datalens palettes
        (0, color_helpers_1.mapAndColorizeGraphsByPalette)({
            graphs: result.graphs,
            colorsConfig,
            isColorsItemExists: Boolean(colors),
            defaultColorPaletteId,
            colorField: undefined,
        });
    }
    else {
        // Else apply colorizing from YAGR for compatibility with Monitoring
        let colorData;
        if (shared.visualization.id === 'area' && result.graphs.length > 1) {
            colorData = (0, colors_1.getColorsForNames)(result.graphs.map(({ name }) => String(name)), { type: 'gradient' });
        }
        else {
            colorData = (0, colors_1.getColorsForNames)(result.graphs.map(({ name }) => String(name)));
        }
        result.graphs.forEach((graph, i) => {
            graph.color = colorData[i];
        });
        if (result.graphs.length > 1 && (0, misc_helpers_1.isLegendEnabled)(shared.extraSettings)) {
            ChartEditor.updateLibraryConfig({
                legend: {
                    show: true,
                },
            });
        }
    }
    result.axes = [
        {
            scale: 'x',
            plotLines: [
                {
                    width: 3,
                    color: '#ffa0a0',
                },
            ],
        },
    ];
    return result;
}
exports.default = prepareLineTime;
