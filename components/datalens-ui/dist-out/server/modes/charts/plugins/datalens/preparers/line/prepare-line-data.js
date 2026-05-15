"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareLineData = prepareLineData;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const isNil_1 = __importDefault(require("lodash/isNil"));
const shared_1 = require("../../../../../../../shared");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_helpers_1 = require("../../utils/color-helpers");
const config_helpers_1 = require("../../utils/config-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const shape_helpers_1 = require("../../utils/shape-helpers");
const action_params_1 = require("../helpers/action-params");
const segments_1 = require("../helpers/segments");
const helpers_1 = require("./helpers");
const colorizeByGradient_1 = require("./helpers/color-helpers/colorizeByGradient");
const getSortedLineKeys_1 = require("./helpers/getSortedLineKeys");
// eslint-disable-next-line complexity
function prepareLineData(args) {
    var _a, _b, _c;
    const { ChartEditor, placeholders, resultData: { data, order }, colors, colorsConfig, sort, labels, idToTitle, idToDataType, visualizationId, datasets = [], shared, shapes, shapesConfig, segments, layerChartMeta, usedColors, disableDefaultSorting = false, defaultColorPaletteId, } = args;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnable = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xField = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
    const xDataType = xField ? idToDataType[xField.guid] : null;
    const xIsDate = Boolean(xDataType && (0, shared_1.isDateField)({ data_type: xDataType }));
    const xIsNumber = Boolean(xDataType && (0, shared_1.isNumberField)({ data_type: xDataType }));
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (0, shared_1.getXAxisMode)({ config: chartConfig });
    const isHtmlX = (0, shared_1.isHtmlField)(xField);
    const x2 = (0, shared_1.isVisualizationWithSeveralFieldsXPlaceholder)(visualizationId)
        ? xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[1]
        : undefined;
    const x2DataType = x2 ? idToDataType[x2.guid] : null;
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const y2Placeholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y2);
    const ySectionItems = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const y2SectionItems = (y2Placeholder === null || y2Placeholder === void 0 ? void 0 : y2Placeholder.items) || [];
    const mergedYSections = [...ySectionItems, ...y2SectionItems];
    const isMultiAxis = Boolean(ySectionItems.length && y2SectionItems.length);
    const sortItem = sort === null || sort === void 0 ? void 0 : sort[0];
    const isSortItemExists = sort.length > 0;
    const isSortingXAxis = sort === null || sort === void 0 ? void 0 : sort.some((s) => s.guid === (xField === null || xField === void 0 ? void 0 : xField.guid));
    const isSortingYAxis = mergedYSections.some((item) => item.guid === (sortItem === null || sortItem === void 0 ? void 0 : sortItem.guid));
    const isSortCategoriesAvailable = xAxisMode === "discrete" /* AxisMode.Discrete */ &&
        (layerChartMeta ? Boolean(layerChartMeta.isCategoriesSortAvailable) : true);
    const colorItem = colors[0];
    const colorFieldDataType = colorItem ? idToDataType[colorItem.guid] : null;
    const isHtmlColor = (0, shared_1.isHtmlField)(colorItem);
    const shapeItem = shapes[0];
    const isHtmlShape = (0, shared_1.isHtmlField)(shapeItem);
    const gradientMode = colorItem &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: colorItem, colorFieldDataType, colorsConfig });
    const labelItem = labels === null || labels === void 0 ? void 0 : labels[0];
    const labelsLength = labels && labels.length;
    const isMarkdownLabel = (0, shared_1.isMarkdownField)(labelItem);
    const isMarkupLabel = (0, shared_1.isMarkupField)(labelItem);
    const isHtmlLabel = (0, shared_1.isHtmlField)(labelItem);
    const segmentField = segments[0];
    const segmentIndexInOrder = (0, helpers_1.getSegmentsIndexInOrder)(order, segmentField, idToTitle);
    const segmentsMap = (0, segments_1.getSegmentMap)(args);
    const isSegmentsExists = !(0, isEmpty_1.default)(segmentsMap);
    const isHtmlSegment = (0, shared_1.isHtmlField)(segmentField);
    const segmentTitleFormatter = (0, misc_helpers_1.getSeriesTitleFormatter)({ fields: [segmentField] });
    const isShapeItemExist = Boolean(shapeItem && shapeItem.type !== 'PSEUDO');
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
    const nullsY1 = (_b = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) === null || _b === void 0 ? void 0 : _b.nulls;
    const nullsY2 = (_c = y2Placeholder === null || y2Placeholder === void 0 ? void 0 : y2Placeholder.settings) === null || _c === void 0 ? void 0 : _c.nulls;
    const categoriesMap = new Map();
    const seriesNameFormatter = (0, misc_helpers_1.getSeriesTitleFormatter)({ fields: [colorItem, shapeItem] });
    const categoryField = xField
        ? { ...xField, data_type: xDataType !== null && xDataType !== void 0 ? xDataType : xField === null || xField === void 0 ? void 0 : xField.data_type }
        : undefined;
    const categoriesFormatter = (0, misc_helpers_1.getCategoryFormatter)({
        field: categoryField,
    });
    if (isHtmlLabel || isHtmlX || isHtmlColor || isHtmlShape || isHtmlSegment) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    if (mergedYSections.length) {
        let categories = [];
        const categories2 = [];
        const lines1 = {};
        const lines2 = {};
        const labelsValues = {};
        const mergedYSectionItems = [ySectionItems, y2SectionItems].reduce((acc, fields, index) => {
            const isFirstSection = index === 0;
            const items = fields.map((field) => {
                return {
                    field,
                    lines: isFirstSection ? lines1 : lines2,
                    nullsSetting: isFirstSection ? nullsY1 : nullsY2,
                    isFirstSection,
                    labelsValues,
                };
            });
            return acc.concat(...items);
        }, []);
        data.forEach((values) => {
            var _a;
            let xValue;
            if (xField) {
                xValue = (0, helpers_1.getXAxisValue)({
                    x: xField,
                    ys1: ySectionItems,
                    order,
                    values,
                    idToTitle,
                    categories,
                    xIsDate,
                    xIsNumber,
                    xDataType: xDataType,
                    xIsPseudo: (0, shared_1.isPseudoField)(xField),
                    categoriesMap,
                });
                if ((xValue === null || xValue === undefined) && !(0, shared_1.isPseudoField)(xField)) {
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
                    xIsNumber: Boolean(x2DataType && (0, shared_1.isNumberField)({ data_type: x2DataType })),
                    xDataType: x2DataType,
                    xIsDate: Boolean(x2DataType && (0, shared_1.isDateField)({ data_type: x2DataType })),
                    xIsPseudo: (0, shared_1.isPseudoField)(x2),
                    categoriesMap,
                });
                if ((x2Value === null || x2Value === undefined) && !(0, shared_1.isPseudoField)(x2)) {
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
                isSegmentsExists,
                x2Field: x2,
                colorItem,
                rawXValue: xValue,
                rawX2Value: x2Value,
                x2IsDate: Boolean(x2DataType && (0, shared_1.isDateField)({ data_type: x2DataType })),
                isSortByMeasureColor,
                measureColorSortLine,
                isShapeItemExist,
                isColorItemExist,
                isMultiAxis,
                shapeItem,
                xField: xField,
                shapesConfig,
                labelItem,
                segmentIndexInOrder,
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
        const isSortBySegments = Boolean(isSortItemExists && segmentField && sortItem.guid === segmentField.guid);
        const isSortableXAxis = visualizationId !== shared_1.WizardVisualizationId.Area &&
            !(0, shared_1.isPercentVisualization)(visualizationId);
        if (!disableDefaultSorting) {
            categories = (0, helpers_1.getSortedCategories)({
                lines,
                colorItem,
                categories,
                ySectionItems,
                isSortWithYSectionItem: Boolean(ySectionItems.length && isSortableXAxis),
                sortItem,
                isSortAvailable: isSortItemExists && isSortCategoriesAvailable,
                isXNumber: xIsNumber,
                measureColorSortLine,
                isSegmentsExists,
                isSortBySegments,
            });
        }
        const sortedLineKeys = (0, getSortedLineKeys_1.getSortedLineKeys)({
            colorItem,
            lines,
            isSortAvailable: isSortItemExists,
            isSortBySegments,
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
            (0, shared_1.isPseudoField)(xField) ||
            isSortNumberTypeXAxisByMeasure ||
            disableDefaultSorting;
        const orderedLineKeys = [lineKeys1, lineKeys2];
        orderedLineKeys.forEach((lineKeys, lineKeysIndex) => {
            lineKeys.forEach((lineKey) => {
                var _a, _b, _c;
                let line;
                let nulls;
                if (lineKeysIndex === 0) {
                    line = lines1[lineKey];
                    nulls = nullsY1;
                }
                else {
                    line = lines2[lineKey];
                    nulls = nullsY2;
                }
                nulls = (0, shared_1.getAxisNullsSettings)(nulls, visualizationId);
                const innerLabels = labelsValues[lineKey];
                const customSeriesData = {};
                const shouldUsePreviousValueForEmptyPoint = visualizationId === shared_1.WizardVisualizationId.Area &&
                    nulls === "use-previous" /* AxisNullsMode.UsePrevious */;
                let prevYValue = null;
                const graph = {
                    id: line.id,
                    title: seriesNameFormatter((_a = line.title) !== null && _a !== void 0 ? _a : 'Null'),
                    tooltip: line.tooltip,
                    dataLabels: {
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
                        if (shouldUsePreviousValueForEmptyPoint) {
                            if ((0, isNil_1.default)(value)) {
                                value = prevYValue !== null && prevYValue !== void 0 ? prevYValue : value;
                            }
                            else {
                                prevYValue = value;
                            }
                        }
                        // We can skip a point only if we put x in each point instead of categories
                        if (!isXCategoryAxis &&
                            typeof value === 'undefined' &&
                            nulls === "connect" /* AxisNullsMode.Connect */) {
                            return null;
                        }
                        const y = typeof value === 'number' ? Number(value) : null;
                        const dataLabels = {
                            enabled: Boolean(labelsLength && labelItem),
                        };
                        const point = {
                            x: i,
                            y,
                            colorValue,
                            dataLabels,
                        };
                        if (line.segmentNameKey) {
                            const currentSegment = segmentsMap[line.segmentNameKey];
                            const pointValue = `${currentSegment.title}: ${line.title}`;
                            point.custom = {
                                tooltipPointName: isHtmlSegment
                                    ? (0, ui_sandbox_1.wrapHtml)(pointValue)
                                    : pointValue,
                            };
                        }
                        if (!isXCategoryAxis) {
                            const pointX = category;
                            point.x = pointX;
                            if (xField && (0, misc_helpers_1.isNumericalDataType)(xField.data_type)) {
                                const formatting = (0, shared_1.getFormatOptions)(xField);
                                if (formatting) {
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
                            (0, action_params_1.addActionParamValue)(actionParams, xField, category);
                            (0, action_params_1.addActionParamValue)(actionParams, yField, point.y);
                            point.custom = {
                                ...point.custom,
                                actionParams,
                            };
                        }
                        return point;
                    })
                        .filter((point) => point !== null),
                    legendTitle: (_c = (_b = line.legendTitle) !== null && _b !== void 0 ? _b : line.title) !== null && _c !== void 0 ? _c : 'Null',
                    formattedName: colorItem ? undefined : seriesNameFormatter(line.formattedName),
                    drillDownFilterValue: line.drillDownFilterValue,
                    colorKey: line.colorKey,
                    colorGuid: (colorItem === null || colorItem === void 0 ? void 0 : colorItem.guid) || null,
                    shapeGuid: (shapeItem === null || shapeItem === void 0 ? void 0 : shapeItem.guid) || null,
                    measureFieldTitle: line.fieldTitle,
                };
                // For one point (non-zero), the setting of the connection empty values has a strange effect:
                // the value stops being displayed on the graph
                if (graph.data.length > 1) {
                    graph.connectNulls = nulls === "connect" /* AxisNullsMode.Connect */;
                }
                if (line.pointConflict) {
                    graph.pointConflict = true;
                }
                if (line.segmentNameKey) {
                    const currentSegment = segmentsMap[line.segmentNameKey];
                    graph.yAxis = currentSegment.index;
                    customSeriesData.segmentTitle = segmentTitleFormatter(currentSegment.title);
                }
                else if (lineKeysIndex === 0 || ySectionItems.length === 0) {
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
                    // bar-x only
                    (0, action_params_1.addActionParamValue)(actionParams, x2, line.stack);
                    // bar-y only
                    const [, yField2] = ySectionItems || [];
                    (0, action_params_1.addActionParamValue)(actionParams, yField2, line.stack);
                    (0, action_params_1.addActionParamValue)(actionParams, colorItem, line.colorValue);
                    (0, action_params_1.addActionParamValue)(actionParams, shapeItem, line.shapeValue);
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
                isShapesItemExists: isShapeItemExist,
                isColorsItemExists: isColorItemExist,
                isSegmentsExists: isSegmentsExists,
                usedColors,
                colorField: colorItem,
                defaultColorPaletteId,
            });
        }
        if (visualizationId === shared_1.WizardVisualizationId.Line ||
            visualizationId === shared_1.WizardVisualizationId.LineD3) {
            (0, shape_helpers_1.mapAndShapeGraph)({
                graphs,
                shapesConfig,
                isSegmentsExists,
                isShapesDefault: shapes.length === 0 || (0, shared_1.isPseudoField)(shapes[0]),
            });
        }
        if (isMarkdownLabel) {
            ChartEditor.updateConfig({ useMarkdown: true });
        }
        if (isMarkupLabel) {
            ChartEditor.updateConfig({ useMarkup: true });
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
                data: categories.map(() => null),
            },
        ];
        // If there are dates on the X axis, then we pass them as dates
        if (xIsDate && xAxisMode !== "discrete" /* AxisMode.Discrete */) {
            return { graphs, categories_ms: categories };
        }
        return {
            graphs,
            categories: categories.map(categoriesFormatter),
        };
    }
}
