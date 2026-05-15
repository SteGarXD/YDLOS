"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorizePivotTableByColorField = exports.getColorSettings = exports.getCurrentRowColorValues = void 0;
const shared_1 = require("../../../../../../../../shared");
const color_helpers_1 = require("../../../utils/color-helpers");
const misc_1 = require("./misc");
const getCurrentRowColorValues = (row, annotationsMap) => {
    return row.values.reduce((acc, cell) => {
        if (!cell) {
            acc.push(null);
            return acc;
        }
        const colorAnnotation = (0, misc_1.getAnnotation)(cell, annotationsMap, "color" /* ApiV2Annotations.Color */);
        if (!colorAnnotation) {
            acc.push(null);
            return acc;
        }
        const [colorValue] = colorAnnotation;
        const isInvalidColorValue = colorValue === undefined ||
            colorValue === null ||
            colorValue === '' ||
            isNaN(Number(colorValue));
        if (isInvalidColorValue) {
            acc.push(null);
            return acc;
        }
        acc.push(Number(colorValue));
        return acc;
    }, []);
};
exports.getCurrentRowColorValues = getCurrentRowColorValues;
const getColorSettings = (args) => {
    const { rows, annotationsMap } = args;
    if (!rows.length) {
        return undefined;
    }
    const flatColorValues = [];
    const colorValuesByRow = rows.reduce((colorValues, row) => {
        const currentRowColorValues = (0, exports.getCurrentRowColorValues)(row, annotationsMap);
        flatColorValues.push(...currentRowColorValues);
        colorValues.push(currentRowColorValues);
        return colorValues;
    }, []);
    const valuesWithoutNull = flatColorValues.filter((n) => n !== null);
    const min = valuesWithoutNull.length ? Math.min(...valuesWithoutNull) : 0;
    const max = valuesWithoutNull.length ? Math.max(...valuesWithoutNull) : 0;
    return {
        colorValues: colorValuesByRow,
        min,
        max,
    };
};
exports.getColorSettings = getColorSettings;
const colorizePivotTableByColorField = (args) => {
    const { colors, colorsConfig, rows, rowHeaderLength, rowsData, annotationsMap } = args;
    const filteredColors = colors.filter((el) => !(0, shared_1.isMeasureName)(el));
    if (!filteredColors.length) {
        return;
    }
    const colorSettings = (0, exports.getColorSettings)({ rows: rowsData, annotationsMap });
    if (!colorSettings) {
        return;
    }
    const { colorValues, min, max } = colorSettings;
    const nilValue = colorsConfig.nullMode === shared_1.GradientNullModes.AsZero ? 0 : null;
    rows.forEach((row, rowIndex) => {
        for (let i = rowHeaderLength; i < row.cells.length; i++) {
            const cell = row.cells[i];
            const rawColorValue = colorValues[rowIndex][i - rowHeaderLength];
            const colorValue = rawColorValue === null ? nilValue : rawColorValue;
            const isInvalidColorValue = colorValue === null;
            if (isInvalidColorValue || (cell.css && cell.css.backgroundColor)) {
                continue;
            }
            cell.css = {
                ...cell.css,
                ...(0, color_helpers_1.colorizePivotTableCell)(colorValue, colorsConfig, [min, max]),
            };
        }
    });
};
exports.colorizePivotTableByColorField = colorizePivotTableByColorField;
