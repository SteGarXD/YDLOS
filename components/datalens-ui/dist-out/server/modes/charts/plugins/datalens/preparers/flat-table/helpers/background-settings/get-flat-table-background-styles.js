"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlatTableBackgroundStyles = void 0;
const shared_1 = require("../../../../../../../../../shared");
const constants_1 = require("../../../../../../../../constants");
const constants_2 = require("../../../../utils/constants");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const getDiscreteBackgroundColorStyle = (args) => {
    const { idToTitle, order, column, values, backgroundSettings, idToDataType, loadedColorPalettes, availablePalettes, defaultColorPaletteId, } = args;
    const { settings, colorFieldGuid } = backgroundSettings;
    const colorFieldTitle = idToTitle[colorFieldGuid];
    const colorFieldDataType = idToDataType[colorFieldGuid];
    const valueIndex = (0, misc_helpers_1.findIndexInOrder)(order, column, colorFieldTitle);
    const rawValue = values[valueIndex];
    let value = null;
    if (colorFieldDataType === 'markup') {
        if (rawValue) {
            value = (0, shared_1.markupToRawString)(rawValue);
        }
    }
    else {
        value = (0, shared_1.getDistinctValue)(rawValue);
    }
    if (!value) {
        return;
    }
    const paletteSettings = settings.paletteState;
    const mountedColors = paletteSettings.mountedColors || {};
    const mountedColorValue = mountedColors[value];
    let colors;
    if ((paletteSettings === null || paletteSettings === void 0 ? void 0 : paletteSettings.palette) && loadedColorPalettes[paletteSettings.palette]) {
        colors = loadedColorPalettes[paletteSettings.palette].colors;
    }
    else {
        colors = (0, constants_1.selectServerPalette)({
            palette: paletteSettings.palette,
            availablePalettes,
            defaultColorPaletteId,
        });
    }
    const colorValue = (0, constants_2.getColor)(Number(mountedColorValue), colors);
    if (!colorValue) {
        return;
    }
    // eslint-disable-next-line consistent-return
    return {
        backgroundColor: colorValue,
        color: '#FFF',
    };
};
const getContinuousBackgroundColorStyle = (args) => {
    const { currentRowIndex, backgroundColorsByMeasure, backgroundSettings } = args;
    const colors = backgroundColorsByMeasure[backgroundSettings.settingsId];
    const backgroundColor = colors[currentRowIndex];
    if (backgroundColor) {
        return {
            backgroundColor,
            color: '#FFF',
        };
    }
    return {};
};
const getFlatTableBackgroundStyles = (args) => {
    const { column, values, idToTitle, order, backgroundColorsByMeasure, currentRowIndex, idToDataType, loadedColorPalettes, availablePalettes, defaultColorPaletteId, } = args;
    const backgroundSettings = column.backgroundSettings;
    if (!backgroundSettings) {
        return;
    }
    const { settings } = backgroundSettings;
    if (settings.isContinuous) {
        // eslint-disable-next-line consistent-return
        return getContinuousBackgroundColorStyle({
            backgroundColorsByMeasure,
            currentRowIndex,
            backgroundSettings,
        });
    }
    // eslint-disable-next-line consistent-return
    return getDiscreteBackgroundColorStyle({
        column,
        values,
        backgroundSettings,
        order,
        idToTitle,
        idToDataType,
        loadedColorPalettes,
        availablePalettes,
        defaultColorPaletteId,
    });
};
exports.getFlatTableBackgroundStyles = getFlatTableBackgroundStyles;
