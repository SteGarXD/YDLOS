"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartColorsConfig = void 0;
const shared_1 = require("../../../../../../../../shared");
const constants_1 = require("../../../../../../../constants");
const getChartColorsConfig = ({ colorsConfig = {}, loadedColorPalettes, availablePalettes, defaultColorPaletteId, }) => {
    var _a, _b;
    const fallbackColors = (0, constants_1.selectServerPalette)({
        palette: colorsConfig.palette,
        availablePalettes,
        customColorPalettes: loadedColorPalettes,
        defaultColorPaletteId,
    });
    const fallbackGradientColors = (0, shared_1.selectAvailableGradientsColors)(colorsConfig.gradientMode || shared_1.GradientType.TWO_POINT, colorsConfig.gradientPalette || shared_1.TWO_POINT_DEFAULT_ID);
    let colors = fallbackColors;
    let gradientColors = fallbackGradientColors;
    if (colorsConfig.gradientPalette) {
        gradientColors =
            ((_a = loadedColorPalettes[colorsConfig.gradientPalette]) === null || _a === void 0 ? void 0 : _a.colors) || fallbackGradientColors;
    }
    if (colorsConfig.palette) {
        colors = ((_b = loadedColorPalettes[colorsConfig.palette]) === null || _b === void 0 ? void 0 : _b.colors) || fallbackColors;
    }
    return {
        ...colorsConfig,
        colors,
        gradientColors,
        loadedColorPalettes,
        availablePalettes,
    };
};
exports.getChartColorsConfig = getChartColorsConfig;
