"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRgbColorValue = exports.getRangeDelta = void 0;
exports.getColorsByMeasureField = getColorsByMeasureField;
exports.mapAndColorizePointsByPalette = mapAndColorizePointsByPalette;
exports.colorizeByColorValues = colorizeByColorValues;
exports.hexToRgb = hexToRgb;
exports.mapAndColorizeTableCells = mapAndColorizeTableCells;
exports.mapAndColorizeHashTableByPalette = mapAndColorizeHashTableByPalette;
exports.mapAndColorizeHashTableByGradient = mapAndColorizeHashTableByGradient;
exports.mapAndColorizePointsByGradient = mapAndColorizePointsByGradient;
exports.mapAndColorizeGraphsByPalette = mapAndColorizeGraphsByPalette;
exports.mapAndColorizeGraphsByGradient = mapAndColorizeGraphsByGradient;
exports.getCurrentGradient = getCurrentGradient;
exports.getRgbColors = getRgbColors;
exports.colorizePivotTableCell = colorizePivotTableCell;
exports.getThresholdValues = getThresholdValues;
const isNumber_1 = __importDefault(require("lodash/isNumber"));
const shared_1 = require("../../../../../../shared");
Object.defineProperty(exports, "getRangeDelta", { enumerable: true, get: function () { return shared_1.getRangeDelta; } });
Object.defineProperty(exports, "getRgbColorValue", { enumerable: true, get: function () { return shared_1.getRgbColorValue; } });
const color_palettes_1 = require("../../helpers/color-palettes");
const colors_1 = require("../preparers/helpers/colors");
const constants_1 = require("./constants");
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : {};
}
function getColorsByMeasureField(options) {
    const { values, colorsConfig, gradientThresholdValues, sameRangeDelta = 0.5 } = options;
    const { min, rangeMiddle, range, mid } = gradientThresholdValues;
    const rangeMiddleRatio = range === 0 ? 0.5 : rangeMiddle / range;
    const currentGradient = getCurrentGradient(colorsConfig);
    const colors = getRgbColors(currentGradient.colors, Boolean(colorsConfig.reversed));
    const useGradient = colorsConfig.useGradient !== false;
    const discreteThreeColors = !useGradient &&
        colorsConfig.gradientMode === shared_1.GradientType.THREE_POINT &&
        colors.length >= 3;
    const rgbColors = {};
    if (discreteThreeColors) {
        let hexColors = (colorsConfig.gradientColors || []).slice(0, 3).filter(Boolean);
        if (colorsConfig.reversed && hexColors.length === 3) {
            hexColors = [hexColors[2], hexColors[1], hexColors[0]];
        }
        if (hexColors.length === 3) {
            values.forEach((colorValue, i) => {
                if (colorValue === null)
                    return;
                const num = Number(colorValue);
                const key = String(values[i]);
                const idx = num < min ? 0 : num < mid ? 1 : 2;
                rgbColors[key] = hexColors[idx];
            });
            return rgbColors;
        }
    }
    let deltas;
    if (range === 0) {
        deltas = values.map(() => {
            return sameRangeDelta;
        });
    }
    else {
        deltas = values.map((colorValue) => (0, shared_1.getRangeDelta)(colorValue, min, range));
    }
    deltas.forEach((delta, i) => {
        if (delta !== null) {
            const key = String(values[i]);
            rgbColors[key] = (0, shared_1.getRgbColorValue)(delta, colorsConfig.gradientMode || '', rangeMiddleRatio, colors);
        }
    });
    return rgbColors;
}
function mapAndColorizeTableCells(rows, colorsConfig) {
    const colorValues = rows.map((row) => {
        return row.cells.map((cell) => {
            if (typeof cell === 'object' && cell && 'color' in cell) {
                return typeof cell.color !== 'number' || Number.isNaN(cell.color)
                    ? null
                    : cell.color;
            }
            return null;
        });
    });
    const maxColorValues = colorValues.map((row) => Math.max(...row.map(Number)));
    const gradientThresholdValues = getThresholdValues(colorsConfig, maxColorValues);
    const gradientColors = getColorsByMeasureField({
        values: colorValues.flat(2),
        colorsConfig,
        gradientThresholdValues,
    });
    rows.forEach((row) => {
        row.cells.forEach((cell) => {
            if (typeof cell === 'object') {
                const colorValue = typeof cell.color !== 'number' || Number.isNaN(cell.color) ? null : cell.color;
                const backgroundColor = colorValue === null ? undefined : gradientColors[colorValue];
                if (backgroundColor && !cell.css) {
                    cell.css = {
                        backgroundColor,
                        color: '#FFF',
                    };
                }
            }
        });
    });
}
function colorizePivotTableCell(colorValue, colorsConfig, colorValuesForMaxMin) {
    const gradientColors = getColorsByMeasureField({
        values: [colorValue],
        colorsConfig,
        gradientThresholdValues: getThresholdValues(colorsConfig, colorValuesForMaxMin),
    });
    const backgroundColor = gradientColors[String(colorValue)];
    if (backgroundColor) {
        return {
            backgroundColor,
            color: '#FFF',
            value: colorValue,
        };
    }
    return undefined;
}
function mapAndColorizeHashTableByGradient(hashTable, colorsConfig) {
    const colorValues = Object.values(hashTable).map((colorValue) => {
        if (colorValue === null) {
            return null;
        }
        const value = Number(colorValue);
        return isNaN(value) ? null : value;
    });
    const colorValuesForMaxMin = colorValues.filter((value) => value !== null);
    const gradientThresholdValues = getThresholdValues(colorsConfig, colorValuesForMaxMin);
    const { min, rangeMiddle, max } = gradientThresholdValues;
    const gradientColors = getColorsByMeasureField({
        values: colorValues,
        colorsConfig,
        gradientThresholdValues,
    });
    const acc = {};
    const colorData = Object.entries(hashTable).reduce((acc, [key, value]) => {
        const colorValue = Number(value);
        const backgroundColor = gradientColors[colorValue];
        if (backgroundColor) {
            acc[key] = {
                backgroundColor,
                color: '#FFF',
                value: Number(colorValue),
            };
        }
        return acc;
    }, acc);
    return { colorData, min, mid: min + rangeMiddle, max };
}
function mapAndColorizeHashTableByPalette({ hashTable, colors, mountedColors, }) {
    const knownValues = [];
    const result = {};
    Object.keys(hashTable).forEach((key) => {
        const value = hashTable[key];
        let colorIndex = knownValues.indexOf(value);
        let color;
        if (colorIndex === -1) {
            knownValues.push(value);
            colorIndex = knownValues.length - 1;
        }
        if (mountedColors && mountedColors[value]) {
            color = (0, constants_1.getMountedColor)({ mountedColors, colors, value });
        }
        else {
            color = (0, constants_1.getColor)(colorIndex, colors);
        }
        result[key] = { backgroundColor: color };
    });
    return result;
}
function mapAndColorizePointsByGradient(points, colorsConfig) {
    const colorValues = points.map((point) => {
        if (typeof point.colorValue === 'number') {
            return point.colorValue;
        }
        return null;
    });
    const colorValuesForMaxMin = colorValues.filter((value) => value !== null);
    const gradientThresholdValues = getThresholdValues(colorsConfig, colorValuesForMaxMin);
    if (gradientThresholdValues.range !== 0) {
        const gradientColors = getColorsByMeasureField({
            values: colorValues,
            colorsConfig,
            gradientThresholdValues,
        });
        points.forEach((point) => {
            const colorValue = point.colorValue;
            if (typeof colorValue === 'number' && gradientColors[colorValue]) {
                point.color = gradientColors[colorValue];
            }
        });
    }
}
function mapAndColorizeGraphsByGradient(graphs, colorsConfig) {
    const colorValues = getColorValuesAmongSeries(graphs);
    const gradientThresholdValues = getThresholdValues(colorsConfig, colorValues);
    const gradientColors = getColorsByMeasureField({
        values: colorValues,
        colorsConfig,
        gradientThresholdValues,
    });
    if (gradientThresholdValues.range !== 0) {
        graphs.forEach((graph) => {
            const points = graph.data;
            points.forEach((point) => {
                const pointColorValue = point.colorValue;
                if (typeof pointColorValue === 'number' && gradientColors[pointColorValue]) {
                    point.color = gradientColors[pointColorValue];
                }
            });
        });
    }
}
function mapAndColorizePointsByPalette({ points, colorsConfig, colorField, defaultColorPaletteId, }) {
    const series = [];
    const knownValues = [];
    const { mountedColors, colors } = (0, color_palettes_1.getColorsSettings)({
        field: colorField,
        colorsConfig: colorsConfig,
        defaultColorPaletteId,
        availablePalettes: colorsConfig.availablePalettes,
        customColorPalettes: colorsConfig.loadedColorPalettes,
    });
    points.forEach((point) => {
        const value = point.colorValue;
        let colorIndex = knownValues.indexOf(value);
        if (colorIndex === -1) {
            knownValues.push(value);
            colorIndex = knownValues.length - 1;
            let color;
            if (point.colorValue && mountedColors[point.colorValue]) {
                color = (0, constants_1.getMountedColor)({ mountedColors, colors, value: point.colorValue });
            }
            else {
                color = (0, constants_1.getColor)(colorIndex, colors);
            }
            series[colorIndex] = {
                data: [point],
                color,
                name: value || '',
            };
        }
        else {
            const data = series[colorIndex].data;
            if (data) {
                data.push(point);
            }
        }
    });
    return series;
}
function mapAndColorizeGraphsByPalette({ graphs, colorsConfig, isColorsItemExists, isShapesItemExists, isSegmentsExists, usedColors = [], colorField, defaultColorPaletteId, }) {
    const { mountedColors, colors } = (0, color_palettes_1.getColorsSettings)({
        field: colorField,
        colorsConfig,
        defaultColorPaletteId,
        availablePalettes: colorsConfig.availablePalettes,
        customColorPalettes: colorsConfig.loadedColorPalettes,
    });
    // eslint-disable-next-line complexity
    graphs.forEach((graph, i) => {
        let colorKey;
        const colorValue = graph.colorValue;
        const shapeValue = graph.shapeValue;
        const colorTitle = graph.colorKey || graph.legendTitle || graph.name;
        if ((colorValue && colorValue === colorTitle) || (colorValue && shapeValue)) {
            // ../technotes.md -> utils/colors-helpers p3
            colorKey = colorValue;
        }
        else if (isColorsItemExists) {
            // ../technotes.md -> utils/colors-helpers p2
            colorKey = (colorTitle || '').split(':')[0];
        }
        else {
            colorKey = colorTitle;
        }
        if (colorKey && mountedColors[colorKey]) {
            graph.color = (0, constants_1.getMountedColor)({ mountedColors, colors, value: colorKey });
        }
        else {
            let value = graph.colorValue;
            if (isColorsItemExists && !isShapesItemExists && graph.legendTitle) {
                value = graph.legendTitle;
            }
            let colorIndex;
            if (isShapesItemExists && !isColorsItemExists) {
                colorIndex = usedColors.indexOf(value);
            }
            else {
                // we use the index from forEach in the case of coloring the second y axis
                colorIndex = graph.yAxis === 0 || isSegmentsExists ? usedColors.indexOf(value) : i;
            }
            if (colorIndex === -1) {
                usedColors.push(value);
                colorIndex = usedColors.length - 1;
            }
            graph.color = (0, constants_1.getColor)(colorIndex, colors);
        }
    });
    return graphs;
}
function getCurrentGradient(colorsConfig) {
    return {
        id: colorsConfig.gradientPalette,
        colors: colorsConfig.gradientColors.map(shared_1.transformHexToRgb),
    };
}
function getThresholdValues(colorsConfig, colorValues) {
    const list = colorValues.filter((d) => d !== null).map(Number);
    const max = colorsConfig.thresholdsMode === 'manual' &&
        typeof colorsConfig.rightThreshold !== 'undefined'
        ? Number(colorsConfig.rightThreshold)
        : Math.max(...list);
    const min = colorsConfig.thresholdsMode === 'manual' &&
        typeof colorsConfig.leftThreshold !== 'undefined'
        ? Number(colorsConfig.leftThreshold)
        : Math.min(...list);
    const range = max - min;
    const mid = colorsConfig.thresholdsMode === 'manual' &&
        colorsConfig.gradientMode === shared_1.GradientType.THREE_POINT &&
        typeof colorsConfig.middleThreshold !== 'undefined'
        ? Number(colorsConfig.middleThreshold)
        : max - range / 2;
    const rangeMiddle = mid === range / 2 ? mid : mid - min;
    return { min, range, rangeMiddle, max, mid };
}
function getRgbColors(gradientColors, isReversed) {
    if (!gradientColors) {
        return [];
    }
    // Avoiding using the object by reference
    const colors = [...gradientColors];
    if (isReversed) {
        colors.reverse();
    }
    return colors;
}
function getColorValuesAmongSeries(graphs) {
    return graphs.reduce((acc, graph) => {
        const colorValues = graph.data
            .filter((point) => typeof point.colorValue === 'number')
            .map((point) => point.colorValue);
        return [...acc, ...colorValues];
    }, []);
}
const MAX_COLOR_DELTA_VALUE = 1;
function getColorFn(colors) {
    if (colors.length > 2) {
        const firstColors = (0, colors_1.interpolateRgbBasis)(colors.slice(0, 2));
        const lastColors = (0, colors_1.interpolateRgbBasis)(colors.slice(1));
        return (colorValue) => colorValue >= 0.5 ? lastColors((colorValue - 0.5) * 2) : firstColors(colorValue * 2);
    }
    return (0, colors_1.interpolateRgbBasis)(colors);
}
function colorizeByColorValues({ colorValues, colorsConfig, }) {
    const { min, mid, max } = getThresholdValues(colorsConfig, colorValues.filter(isNumber_1.default));
    const currentGradient = getCurrentGradient(colorsConfig);
    const colors = getRgbColors(currentGradient.colors, Boolean(colorsConfig.reversed));
    const getRgbColor = getColorFn(colors);
    let deltas;
    if (min === max) {
        // If all values are the same, then we paint in the maximum color.
        deltas = colorValues.map((colorValue) => {
            if (colorValue === null) {
                return null;
            }
            return MAX_COLOR_DELTA_VALUE;
        });
    }
    else {
        deltas = colorValues.map((colorValue) => {
            if (colorValue === null) {
                return null;
            }
            if (colorValue <= min) {
                return 0;
            }
            if (colorValue >= max) {
                return 1;
            }
            return colorValue >= mid
                ? (0, shared_1.getRangeDelta)(colorValue, 2 * mid - max, 2 * (max - mid))
                : (0, shared_1.getRangeDelta)(colorValue, min, 2 * (mid - min));
        });
    }
    return deltas.map((delta) => {
        if (delta === null) {
            return null;
        }
        const { red, green, blue } = getRgbColor(delta);
        return `rgb(${red}, ${green}, ${blue})`;
    });
}
