"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBarYData = prepareBarYData;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const shared_1 = require("../../../../../../../shared");
const color_helpers_1 = require("../../utils/color-helpers");
const config_helpers_1 = require("../../utils/config-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const action_params_1 = require("../helpers/action-params");
const helpers_1 = require("../line/helpers");
const colorizeByGradient_1 = require("../line/helpers/color-helpers/colorizeByGradient");
const getSortedLineKeys_1 = require("../line/helpers/getSortedLineKeys");
// eslint-disable-next-line complexity
function prepareBarYData({ ChartEditor, placeholders, resultData, colors, colorsConfig, sort, labels, idToTitle, idToDataType, visualizationId, datasets = [], shared, shapesConfig, layerChartMeta, usedColors, disableDefaultSorting = false, defaultColorPaletteId, }) {
    var _a, _b, _c;
    const { data, order } = resultData;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnable = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const x = placeholders[0].items[0];
    const xDataType = x ? idToDataType[x.guid] : null;
    const xIsNumber = (0, shared_1.isNumberField)(x);
    const xIsPseudo = (0, shared_1.isPseudoField)(x);
    const xIsDate = (0, shared_1.isDateField)(x);
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (0, shared_1.getXAxisMode)({ config: chartConfig });
    const x2 = (0, shared_1.isVisualizationWithSeveralFieldsXPlaceholder)(visualizationId)
        ? placeholders[0].items[1]
        : undefined;
    const x2DataType = x2 ? idToDataType[x2.guid] : null;
    const x2IsNumber = (0, shared_1.isNumberField)(x2);
    const x2IsDate = (0, shared_1.isDateField)(x2);
    const x2IsPseudo = (0, shared_1.isPseudoField)(x2);
    const yPlaceholder = placeholders[1];
    const ySectionItems = yPlaceholder.items;
    const sortItems = sort;
    const sortItem = sortItems === null || sortItems === void 0 ? void 0 : sortItems[0];
    const isSortItemExists = Boolean(sort && sort.length);
    const sortXItem = sort.find((s) => x && s.guid === x.guid);
    const isSortingXAxis = Boolean(isSortItemExists && sortXItem);
    const isSortingYAxis = isSortItemExists && ySectionItems.find((item) => (item === null || item === void 0 ? void 0 : item.guid) === sort[0].guid);
    const isSortCategoriesAvailable = layerChartMeta
        ? Boolean(layerChartMeta.isCategoriesSortAvailable)
        : true;
    const colorItem = colors[0];
    const colorFieldDataType = colorItem ? idToDataType[colorItem.guid] : null;
    const gradientMode = colorItem &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: colorItem, colorFieldDataType, colorsConfig });
    const labelItem = labels === null || labels === void 0 ? void 0 : labels[0];
    const isMarkdownLabel = (0, shared_1.isMarkdownField)(labelItem);
    const isMarkupLabel = (0, shared_1.isMarkupField)(labelItem);
    const isHtmlLabel = (0, shared_1.isHtmlField)(labelItem);
    const isColorItemExist = Boolean(colorItem && colorItem.type !== 'PSEUDO');
    const isColorizeByMeasure = (0, shared_1.isMeasureField)(colorItem);
    const colorMode = colorsConfig.colorMode;
    const isColorizeByMeasureValue = (0, shared_1.isMeasureValue)(colorItem);
    /*
        Specially reduced LinesRecord object. It has only one key that is equal to the colorItem header.
        Needed at the moment when the user sorts the graph according to the same indicator by which it is colored.
        For this sort, you need to get values from orders and match them to categories.
    */
    const measureColorSortLine = {};
    const isSortByMeasureColor = sortItem && colorItem && sortItem.guid === colorItem.guid;
    if (isSortByMeasureColor) {
        measureColorSortLine[(0, shared_1.getFakeTitleOrTitle)(colorItem)] = { data: {} };
    }
    const nullsY1 = (_c = (_b = placeholders === null || placeholders === void 0 ? void 0 : placeholders[1]) === null || _b === void 0 ? void 0 : _b.settings) === null || _c === void 0 ? void 0 : _c.nulls;
    const categoriesMap = new Map();
    const categoryField = x ? { ...x, data_type: xDataType !== null && xDataType !== void 0 ? xDataType : x === null || x === void 0 ? void 0 : x.data_type } : undefined;
    const categoriesFormatter = (0, misc_helpers_1.getCategoryFormatter)({
        field: categoryField,
    });
    const seriesNameFormatter = (0, misc_helpers_1.getSeriesTitleFormatter)({ fields: [colorItem] });
    if (ySectionItems.length) {
        let categories = [];
        const categories2 = [];
        const lines1 = {};
        const lines2 = {};
        const labelsValues = {};
        const mergedYSectionItems = ySectionItems.map((field) => {
            return {
                field,
                lines: lines1,
                nullsSetting: nullsY1,
                isFirstSection: true,
                labelsValues,
            };
        });
        data.forEach((values) => {
            var _a;
            let xValue;
            if (x) {
                xValue = (0, helpers_1.getXAxisValue)({
                    x,
                    ys1: ySectionItems,
                    order,
                    values,
                    idToTitle,
                    categories,
                    xIsDate,
                    xIsNumber,
                    xDataType: xDataType,
                    xIsPseudo: Boolean(xIsPseudo),
                    categoriesMap,
                });
                if ((xValue === null || xValue === undefined) && !xIsPseudo) {
                    return;
                }
            }
            else if (ySectionItems.length > 1) {
                const value = (xValue = 'Measure Names');
                if (!categoriesMap.has(value)) {
                    categoriesMap.set(value, true);
                    categories.push(value);
                }
            }
            else {
                const ySectionItem = ySectionItems[0];
                const value = (xValue = ySectionItem.fakeTitle || idToTitle[ySectionItem.guid]);
                if (!categoriesMap.has(value)) {
                    categoriesMap.set(value, true);
                    categories.push(value);
                }
            }
            let x2Value;
            if (x2) {
                x2Value = (0, helpers_1.getXAxisValue)({
                    x: x2,
                    ys1: ySectionItems,
                    categories: categories2,
                    idToTitle,
                    order,
                    values,
                    xIsNumber: x2IsNumber,
                    xDataType: x2DataType,
                    xIsDate: x2IsDate,
                    xIsPseudo: x2IsPseudo,
                    categoriesMap,
                });
                if ((x2Value === null || x2Value === undefined) && !x2IsPseudo) {
                    return;
                }
            }
            (0, helpers_1.prepareLines)({
                ySectionItems: mergedYSectionItems,
                idToTitle,
                idToDataType,
                order,
                values,
                isMultiDatasets: datasets.length > 1,
                isColorizeByMeasureValue,
                isColorizeByMeasure,
                isSegmentsExists: false,
                x2Field: x2,
                colorItem,
                rawXValue: xValue,
                rawX2Value: x2Value,
                x2IsDate,
                isSortByMeasureColor,
                measureColorSortLine,
                isShapeItemExist: false,
                isColorItemExist,
                isMultiAxis: false,
                shapeItem: undefined,
                xField: x,
                shapesConfig,
                labelItem,
                segmentIndexInOrder: -1,
                layers: (_a = shared.visualization) === null || _a === void 0 ? void 0 : _a.layers,
                colorMode,
                convertMarkupToString: false,
            });
        });
        let lineKeys1 = Object.keys(lines1);
        let lineKeys2 = Object.keys(lines2);
        if (xIsDate && !disableDefaultSorting) {
            categories.sort(misc_helpers_1.numericCollator);
        }
        const lines = [lines1, lines2];
        const isSortableXAxis = !(0, shared_1.isPercentVisualization)(visualizationId);
        if (!disableDefaultSorting) {
            categories = (0, helpers_1.getSortedCategories)({
                lines,
                colorItem,
                categories,
                ySectionItems,
                isSortWithYSectionItem: Boolean(ySectionItems.length && isSortableXAxis),
                sortItem: sortItems[0],
                isSortAvailable: isSortItemExists && isSortCategoriesAvailable,
                isXNumber: xIsNumber,
                measureColorSortLine,
                isSegmentsExists: false,
                isSortBySegments: false,
            });
        }
        const sortedLineKeys = (0, getSortedLineKeys_1.getSortedLineKeys)({
            colorItem,
            lines,
            isSortAvailable: isSortItemExists,
            isSortBySegments: false,
            sortItem,
            yField: ySectionItems[0],
            visualizationId: visualizationId,
            categories,
        });
        lineKeys1 = sortedLineKeys[0] || lineKeys1;
        lineKeys2 = sortedLineKeys[1] || lineKeys2;
        const graphs = [];
        const uniqueTitles = [];
        const isXDiscrete = xAxisMode === "discrete" /* AxisMode.Discrete */;
        const isSortNumberTypeXAxisByMeasure = isSortCategoriesAvailable &&
            isSortItemExists &&
            xIsNumber &&
            !isSortingXAxis &&
            (isSortingYAxis || isSortByMeasureColor);
        const isXCategoryAxis = isXDiscrete ||
            xDataType === 'string' ||
            xIsPseudo ||
            isSortNumberTypeXAxisByMeasure ||
            disableDefaultSorting;
        const orderedLineKeys = [lineKeys1, lineKeys2];
        orderedLineKeys.forEach((lineKeys, lineKeysIndex) => {
            lineKeys.forEach((lineKey) => {
                let line;
                let nulls;
                if (lineKeysIndex === 0) {
                    line = lines1[lineKey];
                    nulls = nullsY1;
                }
                else {
                    line = lines2[lineKey];
                    nulls = undefined;
                }
                const innerLabels = labelsValues[lineKey];
                const customSeriesData = {};
                const graph = {
                    id: line.id,
                    title: seriesNameFormatter(line.title || 'Null'),
                    tooltip: line.tooltip,
                    dataLabels: {
                        enabled: Boolean(labelItem),
                        ...line.dataLabels,
                        useHTML: isMarkdownLabel || isMarkupLabel || isHtmlLabel,
                    },
                    data: categories
                        .map((category, i) => {
                        const lineData = line.data[category];
                        const colorValue = lineData === null || lineData === void 0 ? void 0 : lineData.colorValue;
                        let value = lineData === null || lineData === void 0 ? void 0 : lineData.value;
                        if (typeof value === 'undefined' && nulls === "as-0" /* AxisNullsMode.AsZero */) {
                            value = 0;
                        }
                        // We can skip a point only if we put x in each point instead of categories
                        if (!isXCategoryAxis && typeof value === 'undefined') {
                            return null;
                        }
                        const y = typeof value === 'number' ? Number(value) : null;
                        const point = {
                            x: i,
                            y,
                            colorValue,
                        };
                        if (!isXCategoryAxis) {
                            const pointX = category;
                            point.x = pointX;
                            if ((0, shared_1.isNumberField)(x)) {
                                const formatting = (0, shared_1.getFormatOptions)(x);
                                if (!(0, isEmpty_1.default)(formatting)) {
                                    point.xFormatted = (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(pointX), {
                                        lang: 'ru',
                                        ...formatting,
                                    });
                                }
                            }
                        }
                        point.label = (0, misc_helpers_1.getLabelValue)(innerLabels === null || innerLabels === void 0 ? void 0 : innerLabels[category], {
                            isMarkdownLabel,
                            isMarkupLabel,
                            isHtmlLabel,
                        });
                        if (isActionParamsEnable) {
                            const [yField] = ySectionItems || [];
                            const actionParams = {};
                            (0, action_params_1.addActionParamValue)(actionParams, x, category);
                            (0, action_params_1.addActionParamValue)(actionParams, yField, point.y);
                            point.custom = {
                                ...point.custom,
                                actionParams,
                            };
                        }
                        return point;
                    })
                        .filter((point) => point !== null),
                    legendTitle: line.legendTitle || line.title || 'Null',
                    formattedName: colorItem ? undefined : line.formattedName,
                    drillDownFilterValue: line.drillDownFilterValue,
                    colorKey: line.colorKey,
                    colorGuid: (colorItem === null || colorItem === void 0 ? void 0 : colorItem.guid) || null,
                    shapeGuid: null,
                    connectNulls: nulls === "connect" /* AxisNullsMode.Connect */,
                    measureFieldTitle: line.fieldTitle,
                };
                if (line.pointConflict) {
                    graph.pointConflict = true;
                }
                if (lineKeysIndex === 0 || ySectionItems.length === 0) {
                    graph.yAxis = 0;
                }
                else {
                    graph.yAxis = 1;
                }
                if (uniqueTitles.indexOf(graph.legendTitle) === -1) {
                    uniqueTitles.push(graph.legendTitle);
                }
                else {
                    graph.showInLegend = false;
                }
                if (x2) {
                    graph.stack = line.stack;
                }
                graph.colorValue = line.colorValue;
                graph.shapeValue = line.shapeValue;
                graph.colorShapeValue = line.colorShapeValue;
                graph.custom = customSeriesData;
                if (isActionParamsEnable) {
                    const actionParams = {};
                    const [, yField2] = ySectionItems || [];
                    (0, action_params_1.addActionParamValue)(actionParams, yField2, line.stack);
                    (0, action_params_1.addActionParamValue)(actionParams, colorItem, line.colorValue);
                    graph.custom = {
                        ...graph.custom,
                        actionParams,
                    };
                }
                graphs.push(graph);
            });
        });
        if (gradientMode) {
            (0, colorizeByGradient_1.colorizeByGradient)(visualizationId, {
                graphs,
                colorsConfig,
            });
        }
        else {
            (0, color_helpers_1.mapAndColorizeGraphsByPalette)({
                graphs,
                colorsConfig,
                isShapesItemExists: false,
                isColorsItemExists: isColorItemExist,
                isSegmentsExists: false,
                usedColors,
                colorField: colorItem,
                defaultColorPaletteId,
            });
        }
        if (isMarkdownLabel) {
            ChartEditor.updateConfig({ useMarkdown: true });
        }
        if (isMarkupLabel) {
            ChartEditor.updateConfig({ useMarkup: true });
        }
        if (isHtmlLabel || (0, shared_1.isHtmlField)(x) || (0, shared_1.isHtmlField)(colorItem)) {
            ChartEditor.updateConfig({ useHtml: true });
        }
        if (isXCategoryAxis) {
            return {
                graphs,
                categories: categories.map(categoriesFormatter),
            };
        }
        else {
            return { graphs };
        }
    }
    else {
        // If no fields are selected for the Y axis, we draw only the X axis.
        const categories = [];
        data.forEach((values) => {
            const value = values[0];
            if (value === null) {
                return;
            }
            let xValue;
            if (xIsDate) {
                const time = new Date(value);
                if (xDataType === 'genericdatetime') {
                    time.setTime((0, misc_helpers_1.getTimezoneOffsettedTime)(time));
                }
                xValue = time.getTime();
            }
            else if (xIsNumber) {
                xValue = Number(value);
            }
            else {
                xValue = value;
            }
            if (!categoriesMap.has(xValue)) {
                categoriesMap.set(xValue, true);
                categories.push(xValue);
            }
        });
        // Default sorting
        if ((!isSortItemExists || !isSortCategoriesAvailable) && !disableDefaultSorting) {
            if (xIsNumber) {
                categories.sort(misc_helpers_1.numericCollator);
            }
            else {
                categories.sort(misc_helpers_1.collator.compare);
            }
        }
        // Generating data
        const graphs = [
            {
                data: categories.map((_, index) => ({ y: null, x: index })),
            },
        ];
        // If there are dates on the X axis, then we pass them as dates
        if (xIsDate && xAxisMode !== "discrete" /* AxisMode.Discrete */) {
            return { graphs, categories_ms: categories };
        }
        else {
            return {
                graphs,
                categories: categories.map(categoriesFormatter),
            };
        }
    }
}
