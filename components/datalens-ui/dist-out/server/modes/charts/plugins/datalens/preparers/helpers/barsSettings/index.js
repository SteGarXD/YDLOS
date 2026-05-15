"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBarSettingsValue = exports.getBarSettingsViewOptions = void 0;
const shared_1 = require("../../../../../../../../shared");
const palettes_1 = require("../../../../../../../../shared/utils/palettes");
const constants_1 = require("../../../../../../../constants");
const color_helpers_1 = require("../../../utils/color-helpers");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const getMinAndMaxValues = (columnValues) => {
    const parsedValues = columnValues
        .filter((v) => v !== null && v !== undefined)
        .map(Number);
    const min = Math.min(...parsedValues);
    const max = Math.max(...parsedValues);
    return {
        min,
        max,
    };
};
const getCurrentBarGradient = (colors, loadedColorPalettes) => {
    return (0, shared_1.selectCurrentRGBGradient)(colors.gradientType, colors.palette, loadedColorPalettes);
};
const getBarThresholdValues = (thresholds, columnValues) => {
    const preparedMinAndMax = getMinAndMaxValues(columnValues);
    const max = thresholds.mode === 'manual' && typeof thresholds.max !== 'undefined'
        ? Number(thresholds.max)
        : preparedMinAndMax.max;
    const min = thresholds.mode === 'manual' && typeof thresholds.min !== 'undefined'
        ? Number(thresholds.min)
        : preparedMinAndMax.min;
    const range = max - min;
    const mid = thresholds.mode === 'manual' && typeof thresholds.mid !== 'undefined'
        ? Number(thresholds.mid)
        : range / 2;
    const rangeMiddle = mid === range / 2 ? mid : mid - min;
    return { min, max, mid, range, rangeMiddle };
};
const getTwoColorBarColor = (rowValue, colors, currentColors) => {
    const parsedValue = parseFloat(rowValue);
    const isPositive = parsedValue >= 0;
    return (0, palettes_1.getColorByColorSettings)({
        currentColors,
        colorIndex: isPositive ? colors.positiveColorIndex : colors.negativeColorIndex,
        color: isPositive ? colors.positiveColor : colors.negativeColor,
        fallbackIndex: isPositive ? 2 : 1,
    });
};
const getGradientBarColor = (args) => {
    const { colors, columnValues, currentColumnValue, loadedColorPalettes } = args;
    const currentGradient = getCurrentBarGradient(colors, loadedColorPalettes);
    const gradientColors = (0, color_helpers_1.getRgbColors)(currentGradient.colors.map(shared_1.transformHexToRgb), Boolean(colors.reversed));
    const { rangeMiddle, range, min } = getBarThresholdValues(colors.thresholds, columnValues);
    const rangeMiddleRatio = rangeMiddle / range;
    let delta;
    if (range === 0) {
        delta = 0.5;
    }
    else {
        const colorValue = currentColumnValue ? Number(currentColumnValue) : null;
        delta = (0, shared_1.getRangeDelta)(colorValue, min, range);
    }
    if (typeof delta === 'number') {
        return (0, shared_1.getRgbColorValue)(delta, colors.gradientType, rangeMiddleRatio, gradientColors);
    }
    return '';
};
const getBarSettingsViewOptions = (args) => {
    const { barsSettings, columnValues } = args;
    const barViewOptions = {
        view: 'bar',
        showLabel: barsSettings.showLabels,
    };
    let min, max;
    if (barsSettings.scale.mode === 'auto') {
        const minAndMaxValues = getMinAndMaxValues(columnValues);
        min = minAndMaxValues.min;
        max = minAndMaxValues.max;
    }
    else {
        min =
            typeof barsSettings.scale.settings.min === 'undefined'
                ? barsSettings.scale.settings.min
                : Number(barsSettings.scale.settings.min);
        max =
            typeof barsSettings.scale.settings.max === 'undefined'
                ? barsSettings.scale.settings.max
                : Number(barsSettings.scale.settings.max);
    }
    const isMinCorrect = typeof min === 'number' && !isNaN(min) && min <= 0;
    const isMaxCorrect = typeof max === 'number' && !isNaN(max) && max >= 0;
    const isMinEqualMax = isMinCorrect && isMaxCorrect && min === max;
    if (isMinEqualMax) {
        barViewOptions.max = min;
    }
    else {
        barViewOptions.min = isMinCorrect ? min : undefined;
        barViewOptions.max = isMaxCorrect ? max : undefined;
    }
    barViewOptions.align = barsSettings.align === 'default' ? undefined : barsSettings.align;
    return barViewOptions;
};
exports.getBarSettingsViewOptions = getBarSettingsViewOptions;
const getBarSettingsValue = (args) => {
    const { defaultColorPaletteId, field, rowValue, columnValues, isTotalCell, loadedColorPalettes, availablePalettes, } = args;
    const barSettings = field.barsSettings;
    const formatOptions = (0, shared_1.getFormatOptions)(field);
    let barColor;
    const currentColors = (0, constants_1.selectServerPalette)({
        palette: barSettings.colorSettings.settings.palette,
        availablePalettes,
        customColorPalettes: loadedColorPalettes,
        defaultColorPaletteId,
    });
    switch (barSettings.colorSettings.colorType) {
        case 'one-color':
            barColor = (0, palettes_1.getColorByColorSettings)({
                currentColors,
                color: barSettings.colorSettings.settings.color,
                colorIndex: barSettings.colorSettings.settings.colorIndex,
            });
            break;
        case 'two-color':
            barColor = getTwoColorBarColor(rowValue, barSettings.colorSettings.settings, currentColors);
            break;
        case 'gradient':
            barColor = getGradientBarColor({
                columnValues,
                colors: barSettings.colorSettings.settings,
                currentColumnValue: rowValue,
                loadedColorPalettes,
            });
            break;
        default:
            barColor = '';
    }
    const parsedValue = parseFloat(rowValue);
    return {
        value: isNaN(parsedValue) ? 0 : parsedValue,
        barColor,
        formattedValue: isNaN(parsedValue)
            ? rowValue
            : (0, misc_helpers_1.chartKitFormatNumberWrapper)(parsedValue, formatOptions),
        showBar: !isTotalCell || (isTotalCell && barSettings.showBarsInTotals),
    };
};
exports.getBarSettingsValue = getBarSettingsValue;
