"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDataToLines = void 0;
const shared_1 = require("../../../../../../../../../shared");
const common_helpers_1 = require("../../../../../../../../../shared/modules/colors/common-helpers");
const get_formatted_value_1 = require("../../../helpers/get-formatted-value");
const utils_1 = require("../utils");
const helpers_1 = require("./helpers");
const mapDataToLines = ({ x2, x2Value, xValue, yValue, lines, seriesOptions, shownTitle, isPseudoShapeExist, isPseudoColorExist, shapesConfig, x, segmentName, yField, yFields, idToTitle, isColorMeasureNames, }) => {
    const key = (0, utils_1.getLineKey)({
        shownTitle,
        isX2Axis: Boolean(x2),
        value: undefined,
        isMultiAxis: false,
        x2AxisValue: x2Value,
        segmentName,
    });
    if (!Object.hasOwnProperty.call(lines, key)) {
        lines[key] = {
            data: {},
            ...seriesOptions,
        };
        const line = lines[key];
        line.colorKey = yField.fakeTitle || idToTitle[yField.guid] || yField.title;
        if (x2) {
            line.stack = x2Value;
            const formattedX2Value = (0, get_formatted_value_1.getFormattedValue)(x2, x2Value);
            // Exactly ==
            // eslint-disable-next-line eqeqeq
            if (shownTitle == formattedX2Value) {
                line.title = `${shownTitle}`;
                line.legendTitle = `${shownTitle}`;
            }
            else if (x && (0, shared_1.isMeasureNameOrValue)(x)) {
                line.title = `${formattedX2Value}`;
                line.legendTitle = `${shownTitle}: ${formattedX2Value}`;
            }
            else {
                line.title = `${shownTitle}: ${formattedX2Value}`;
                line.legendTitle = `${shownTitle}: ${formattedX2Value}`;
            }
        }
        else {
            line.title = shownTitle;
        }
        if (isPseudoColorExist) {
            const colorKey = (0, common_helpers_1.getColorsConfigKey)(yField, yFields || [], {
                isMeasureNames: isColorMeasureNames,
            });
            if (colorKey) {
                line.colorKey = colorKey;
                line.colorValue = colorKey;
            }
            else {
                line.colorValue = shownTitle;
            }
        }
        if (isPseudoShapeExist) {
            const mountedValues = (shapesConfig === null || shapesConfig === void 0 ? void 0 : shapesConfig.mountedShapes) || {};
            line.shapeValue = (0, helpers_1.getColorShapeMappingValue)({
                mountedValues,
                shownTitle,
                colorAndShapeKey: yField.fakeTitle || idToTitle[yField.guid] || yField.title,
            });
        }
    }
    const lastKey = typeof xValue === 'undefined' ? shownTitle : xValue;
    const targetLineKey = lastKey;
    const pointConflict = typeof lines[key].data[targetLineKey] !== 'undefined';
    lines[key].data[targetLineKey] = { value: yValue };
    return { key, lastKey, pointConflict };
};
exports.mapDataToLines = mapDataToLines;
