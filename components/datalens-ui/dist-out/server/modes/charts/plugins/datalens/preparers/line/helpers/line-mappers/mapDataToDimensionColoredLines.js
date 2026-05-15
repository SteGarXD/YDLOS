"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDataToDimensionColoredLines = void 0;
const shared_1 = require("../../../../../../../../../shared");
const ui_sandbox_1 = require("../../../../../../../../../shared/utils/ui-sandbox");
const constants_1 = require("../../../../utils/constants");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const utils_1 = require("../utils");
const getColoredLineLegendTitle_1 = require("./getColoredLineLegendTitle");
const getFieldTitleForValue = ({ hasField, defaultValue, yItem }) => {
    if (hasField) {
        return (0, misc_helpers_1.getFieldTitle)(yItem);
    }
    return defaultValue;
};
const getColorAndShapeValues = ({ yItem, formattedValue, combinedValue, }) => {
    const [colorValue, shapeValue] = (combinedValue === null || combinedValue === void 0 ? void 0 : combinedValue.split(constants_1.COLOR_SHAPE_SEPARATOR)) || [];
    if (colorValue && shapeValue) {
        return {
            colorValue,
            shapeValue,
        };
    }
    const colorAndShapeValues = {};
    const hasColors = Boolean(colorValue);
    const hasShapes = Boolean(shapeValue);
    const hasField = hasColors || hasShapes;
    colorAndShapeValues.colorValue =
        colorValue || getFieldTitleForValue({ yItem, hasField, defaultValue: formattedValue });
    colorAndShapeValues.shapeValue =
        shapeValue || getFieldTitleForValue({ yItem, hasField, defaultValue: formattedValue });
    return colorAndShapeValues;
};
const mapDataToDimensionColoredLines = ({ items, idToTitle, values, order, x2, x2IsDate, x2Value, xValue, multiaxis, shownTitle, lines, seriesOptions, x2DataType, yValue, yItem, hasColors, isItemsAreEqual, segmentName, layers, colorMode, }) => {
    const mappedItemsToValues = items.map((item) => {
        return (0, utils_1.getItemsValues)(item, { idToTitle, values, order });
    });
    const colorModeIsGradient = colorMode === shared_1.ColorMode.GRADIENT;
    let itemValues;
    if (isItemsAreEqual) {
        const { value, formattedValue } = mappedItemsToValues[0];
        itemValues = {
            value,
            formattedValue,
        };
        if (typeof value === 'string') {
            itemValues.extraValue = `${value}${constants_1.COLOR_SHAPE_SEPARATOR}${value}`;
        }
    }
    else {
        itemValues = mappedItemsToValues.reduce((acc, curr, index) => {
            let { formattedValue } = curr;
            let distinctValue = (0, shared_1.getDistinctValue)(curr.value);
            let extraValue = distinctValue;
            if (index !== items.length - 1) {
                distinctValue = `${distinctValue}-`;
                formattedValue = `${formattedValue}-`;
                extraValue = `${extraValue}${constants_1.COLOR_SHAPE_SEPARATOR}`;
            }
            else if (!hasColors) {
                extraValue = `${constants_1.COLOR_SHAPE_SEPARATOR}${extraValue}`;
            }
            return {
                ...acc,
                value: `${acc.value}${distinctValue}`,
                formattedValue: `${acc.formattedValue}${formattedValue}`,
                extraValue: `${acc.extraValue}${extraValue}`,
            };
        }, { value: '', formattedValue: '', extraValue: '' });
    }
    const key = (0, utils_1.getLineKey)({
        shownTitle,
        x2AxisValue: x2Value,
        isX2Axis: Boolean(x2),
        isMultiAxis: multiaxis,
        value: String(itemValues.value),
        segmentName,
    });
    if (!Object.hasOwnProperty.call(lines, key)) {
        lines[key] = {
            data: {},
            ...seriesOptions,
        };
        const line = lines[key];
        if (x2) {
            line.stack = x2Value;
            // Exactly ==
            // eslint-disable-next-line eqeqeq
            if (itemValues.value == x2Value) {
                line.title = String(itemValues.formattedValue);
                line.formattedName = String(itemValues.formattedValue);
            }
            else {
                if (x2IsDate) {
                    x2Value = (0, misc_helpers_1.formatDate)({
                        valueType: x2DataType,
                        value: x2Value,
                        format: x2.format,
                    });
                }
                line.title = `${itemValues.formattedValue}: ${x2Value}`;
                line.legendTitle = `${itemValues.formattedValue}`;
                line.formattedName = `${itemValues.formattedValue}: ${x2Value}`;
                line.drillDownFilterValue = String(itemValues.value);
            }
        }
        else if (multiaxis) {
            line.title = `${itemValues.formattedValue}: ${shownTitle}`;
            line.formattedName = `${itemValues.formattedValue}: ${shownTitle}`;
            line.drillDownFilterValue = String(itemValues.value);
        }
        else {
            const formattedValue = String(itemValues.formattedValue);
            line.title = formattedValue;
            line.formattedName = formattedValue;
            line.drillDownFilterValue = String(itemValues.value);
            if ((0, shared_1.isHtmlField)(items[0])) {
                line.legendTitle = (0, ui_sandbox_1.wrapHtml)(formattedValue);
            }
            else {
                line.legendTitle = (0, getColoredLineLegendTitle_1.getColoredLineLegendTitle)({
                    yItem,
                    colorItem: items[0],
                    formattedValue: formattedValue,
                    layers,
                });
            }
        }
        const { colorValue, shapeValue } = getColorAndShapeValues({
            yItem,
            formattedValue: String(itemValues.formattedValue),
            combinedValue: itemValues.extraValue,
        });
        line.colorValue = colorModeIsGradient ? Number(colorValue) : colorValue;
        line.shapeValue = shapeValue;
    }
    const lastKey = typeof xValue === 'undefined' ? shownTitle : xValue;
    const pointData = { value: yValue };
    if (colorModeIsGradient) {
        pointData.colorValue = Number(lines[key].colorValue);
    }
    const targetLineKey = lastKey;
    const pointConflict = typeof lines[key].data[targetLineKey] !== 'undefined';
    lines[key].data[targetLineKey] = pointData;
    return { key, lastKey, pointConflict };
};
exports.mapDataToDimensionColoredLines = mapDataToDimensionColoredLines;
