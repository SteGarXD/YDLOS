"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareLines = void 0;
const isNil_1 = __importDefault(require("lodash/isNil"));
const shared_1 = require("../../../../../../../../../shared");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const getXAxisValue_1 = require("../getXAxisValue");
const getSegmentName_1 = require("../segments/getSegmentName");
const getSegmentsMap_1 = require("../segments/getSegmentsMap");
const mapDataToDimensionColoredLines_1 = require("./mapDataToDimensionColoredLines");
const mapDataToLines_1 = require("./mapDataToLines");
const mapDataToMeasureColoredLines_1 = require("./mapDataToMeasureColoredLines");
const getMappedDataToLines = (args) => {
    return (0, mapDataToLines_1.mapDataToLines)(args.mapFunctionArguments);
};
const getMappedDataToDimensionColoredLines = (args) => {
    let items;
    let isItemsAreEqual = false;
    const { isColorItemExist, isShapeItemExist, colorItem, shapeItem } = args.options;
    if (isColorItemExist && isShapeItemExist && shapeItem) {
        isItemsAreEqual = colorItem.guid === shapeItem.guid;
        items = [colorItem, shapeItem];
    }
    else if (isShapeItemExist && shapeItem) {
        items = [shapeItem];
    }
    else {
        items = [colorItem];
    }
    return (0, mapDataToDimensionColoredLines_1.mapDataToDimensionColoredLines)({
        ...args.mapFunctionArguments,
        isItemsAreEqual,
        items,
    });
};
const getMappedDataToMeasureColoredLines = (args) => {
    const keys = (0, mapDataToMeasureColoredLines_1.mapDataToMeasureColoredLines)(args.mapFunctionArguments);
    const { colorItem, isSortByMeasureColor, measureColorSortLine } = args.options;
    if (isSortByMeasureColor) {
        measureColorSortLine[(0, shared_1.getFakeTitleOrTitle)(colorItem)].data[keys.lastKey] =
            { value: keys.colorValue };
    }
    return {
        key: keys.key,
        lastKey: keys.lastKey,
    };
};
const mergeLabelDataWithLines = (args) => {
    const { labelItem, labelsValues, yValue, hideLabel, yItemFormatting, yDataType, values, order, keys, idToTitle, idToDataType, lines, convertMarkupToString = true, } = args;
    const key = keys.key;
    const lastKey = keys.lastKey;
    if (!labelItem || hideLabel) {
        lines[key].dataLabels = { enabled: false };
        return;
    }
    const labelDataType = idToDataType[labelItem.guid];
    const isMeasureValuesLabel = (0, shared_1.isMeasureValue)(labelItem);
    if (!labelsValues[key]) {
        labelsValues[key] = {};
    }
    let labelValue;
    if (isMeasureValuesLabel) {
        labelValue = yValue;
    }
    else {
        const labelItemTitle = idToTitle[labelItem.guid];
        const labelValueIndex = (0, misc_helpers_1.findIndexInOrder)(order, labelItem, labelItemTitle);
        labelValue = values[labelValueIndex];
    }
    if (!(0, isNil_1.default)(labelValue)) {
        if ((0, misc_helpers_1.isNumericalDataType)(labelDataType)) {
            labelsValues[key][lastKey] = Number(labelValue);
        }
        else if ((0, shared_1.isDateField)({ data_type: labelDataType })) {
            labelsValues[key][lastKey] = new Date(labelValue);
        }
        else if (convertMarkupToString && (0, shared_1.isMarkupField)({ data_type: labelDataType })) {
            labelsValues[key][lastKey] = (0, shared_1.markupToRawString)(labelValue);
        }
        else {
            labelsValues[key][lastKey] = labelValue;
        }
    }
    const isLabelPseudo = (0, shared_1.isPseudoField)(labelItem);
    const labelFinalDataType = isLabelPseudo ? yDataType : labelDataType;
    let labelFormatting;
    if (isLabelPseudo) {
        labelFormatting = yItemFormatting;
    }
    else {
        labelFormatting = (0, shared_1.getFormatOptions)(labelItem);
    }
    lines[key].dataLabels = (0, misc_helpers_1.getFormatOptionsFromFieldFormatting)(labelFormatting, labelFinalDataType);
};
const extendLineWithSegmentsData = (args) => {
    const { line, segmentNameKey } = args;
    if (line.segmentNameKey) {
        return line;
    }
    return {
        ...line,
        segmentNameKey,
    };
};
function getSeriesId(...str) {
    var _a;
    return (_a = str.find((s) => typeof s === 'string')) !== null && _a !== void 0 ? _a : '';
}
const prepareLines = (args) => {
    const { ySectionItems, idToTitle, idToDataType, order, values, isMultiDatasets, isColorizeByMeasureValue, isColorizeByMeasure, x2Field, colorItem, rawX2Value, rawXValue, x2IsDate, isSortByMeasureColor, measureColorSortLine, isShapeItemExist, isColorItemExist, isMultiAxis, shapeItem, xField, shapesConfig, labelItem, isSegmentsExists, segmentIndexInOrder, layers = [], colorMode, convertMarkupToString, } = args;
    const x2DataType = x2Field ? idToDataType[x2Field.guid] : null;
    const rawSegmentName = isSegmentsExists
        ? (0, getSegmentName_1.getSegmentName)(values, segmentIndexInOrder)
        : undefined;
    const yFields = ySectionItems.map((ySectionItem) => ySectionItem.field);
    // eslint-disable-next-line complexity
    ySectionItems.forEach((mergedItem) => {
        const { field, lines, labelsValues, nullsSetting, isFirstSection } = mergedItem;
        const yFieldTitle = idToTitle[field.guid] || field.title;
        const segmentNameKey = isFirstSection
            ? rawSegmentName
            : (0, getSegmentsMap_1.getY2SegmentNameKey)(rawSegmentName);
        const actualTitle = isMultiDatasets && field.datasetName
            ? `${yFieldTitle} (${field.datasetName})`
            : yFieldTitle;
        const shownTitle = field.fakeTitle || actualTitle;
        const yDataType = (idToDataType[field.guid] || field.data_type);
        const i = (0, misc_helpers_1.findIndexInOrder)(order, field, yFieldTitle);
        let yValue = values[i];
        const x2Value = (0, shared_1.isPseudoField)(x2Field) || !rawX2Value ? shownTitle : rawX2Value;
        if ((0, misc_helpers_1.isNumericalDataType)(yDataType)) {
            if (yValue === null) {
                yValue = nullsSetting === "as-0" /* AxisNullsMode.AsZero */ ? 0 : null;
            }
            else {
                yValue = Number(yValue);
            }
        }
        else if (yValue !== null && (0, shared_1.isDateField)({ data_type: yDataType })) {
            yValue = (0, getXAxisValue_1.getDateAxisValue)(yValue, yDataType);
        }
        const yItemFormatting = (0, shared_1.getFormatOptions)(field);
        const tooltipOptions = (0, misc_helpers_1.getFormatOptionsFromFieldFormatting)(yItemFormatting, yDataType);
        const seriesOptions = {
            tooltip: tooltipOptions,
        };
        let keys;
        if (isColorizeByMeasureValue || isColorizeByMeasure) {
            keys = getMappedDataToMeasureColoredLines({
                mapFunctionArguments: {
                    x2: x2Field,
                    lines,
                    yValue,
                    isColorizeByMeasureValue,
                    colorItem,
                    order,
                    values,
                    idToTitle,
                    seriesOptions,
                    shownTitle,
                    xValue: rawXValue,
                    x2Value,
                    x2DataType: x2DataType,
                    isX2Date: x2IsDate,
                    segmentName: segmentNameKey,
                },
                options: {
                    colorItem,
                    measureColorSortLine,
                    isSortByMeasureColor,
                },
            });
        }
        else if (isColorItemExist || isShapeItemExist) {
            keys = getMappedDataToDimensionColoredLines({
                mapFunctionArguments: {
                    idToTitle,
                    values,
                    order,
                    x2: x2Field,
                    x2IsDate,
                    x2Value,
                    xValue: rawXValue,
                    multiaxis: isMultiAxis,
                    shownTitle,
                    lines,
                    seriesOptions,
                    x2DataType,
                    yValue,
                    yItem: field,
                    hasShapes: isShapeItemExist,
                    hasColors: isColorItemExist,
                    segmentName: segmentNameKey,
                    layers,
                    colorMode,
                },
                options: {
                    colorItem,
                    shapeItem,
                    isColorItemExist,
                    isShapeItemExist,
                },
            });
        }
        else {
            keys = getMappedDataToLines({
                mapFunctionArguments: {
                    x2: x2Field,
                    x2Value,
                    xValue: rawXValue,
                    yValue,
                    lines,
                    yField: field,
                    yFields,
                    idToTitle,
                    seriesOptions,
                    shownTitle,
                    isPseudoColorExist: (0, shared_1.isPseudoField)(colorItem),
                    isPseudoShapeExist: (0, shared_1.isPseudoField)(shapeItem),
                    isColorMeasureNames: colorItem && (0, shared_1.isMeasureName)(colorItem),
                    shapesConfig,
                    x: xField,
                    segmentName: segmentNameKey,
                },
            });
        }
        const hideLabel = field.hideLabelMode === 'hide';
        mergeLabelDataWithLines({
            keys,
            lines,
            labelItem,
            hideLabel,
            labelsValues,
            yValue,
            idToTitle,
            idToDataType,
            order,
            values,
            yDataType,
            yItemFormatting,
            convertMarkupToString,
        });
        const currentLine = lines[keys.key];
        if (segmentNameKey) {
            lines[keys.key] = extendLineWithSegmentsData({
                line: currentLine,
                segmentNameKey,
            });
        }
        lines[keys.key].id = getSeriesId(currentLine.legendTitle, currentLine.title);
        if (keys.pointConflict) {
            lines[keys.key].pointConflict = true;
        }
        lines[keys.key].fieldTitle = (0, shared_1.getFakeTitleOrTitle)(field);
    });
};
exports.prepareLines = prepareLines;
