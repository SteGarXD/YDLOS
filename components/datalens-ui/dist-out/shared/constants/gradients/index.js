"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSystemGradientPaletteId = exports.GRADIENT_PALETTES = exports.selectGradient = exports.selectCurrentRGBGradient = exports.selectAvailableGradientsColors = exports.selectAvailableGradients = exports.GradientNullModes = exports.ColorMode = exports.GradientType = exports.THREE_POINT_DEFAULT_ID = exports.TWO_POINT_DEFAULT_ID = void 0;
exports.transformHexToRgb = transformHexToRgb;
const default_1 = require("./default");
Object.defineProperty(exports, "THREE_POINT_DEFAULT_ID", { enumerable: true, get: function () { return default_1.THREE_POINT_DEFAULT_ID; } });
Object.defineProperty(exports, "TWO_POINT_DEFAULT_ID", { enumerable: true, get: function () { return default_1.TWO_POINT_DEFAULT_ID; } });
const three_point_gradients_1 = require("./three-point-gradients");
const two_point_gradients_1 = require("./two-point-gradients");
var GradientType;
(function (GradientType) {
    GradientType["TWO_POINT"] = "2-point";
    GradientType["THREE_POINT"] = "3-point";
})(GradientType || (exports.GradientType = GradientType = {}));
var ColorMode;
(function (ColorMode) {
    ColorMode["PALETTE"] = "palette";
    ColorMode["GRADIENT"] = "gradient";
})(ColorMode || (exports.ColorMode = ColorMode = {}));
exports.GradientNullModes = {
    Ignore: 'ignore',
    AsZero: 'as-0',
};
const GRADIENTS = {
    [GradientType.TWO_POINT]: two_point_gradients_1.TWO_POINT_GRADIENTS,
    [GradientType.THREE_POINT]: three_point_gradients_1.THREE_POINT_GRADIENTS,
};
const selectAvailableGradients = (gradientType) => GRADIENTS[gradientType];
exports.selectAvailableGradients = selectAvailableGradients;
const selectAvailableGradientsColors = (gradientType, gradientId) => {
    var _a, _b;
    const colors = (_b = (_a = GRADIENTS[gradientType]) === null || _a === void 0 ? void 0 : _a[gradientId]) === null || _b === void 0 ? void 0 : _b.colors;
    if (colors) {
        return colors;
    }
    if (gradientType === GradientType.TWO_POINT) {
        return default_1.TWO_POINT_DEFAULT_GRADIENT[default_1.TWO_POINT_DEFAULT_ID].colors;
    }
    return default_1.THREE_POINT_DEFAULT_GRADIENT[default_1.THREE_POINT_DEFAULT_ID].colors;
};
exports.selectAvailableGradientsColors = selectAvailableGradientsColors;
const selectCurrentRGBGradient = (gradientType, gradientId, loadedColorPalettes) => {
    if (loadedColorPalettes[gradientId]) {
        return loadedColorPalettes[gradientId];
    }
    else {
        return GRADIENTS[gradientType][gradientId];
    }
};
exports.selectCurrentRGBGradient = selectCurrentRGBGradient;
const selectGradient = (gradientType, gradientId) => gradientType === GradientType.TWO_POINT
    ? default_1.TWO_POINT_DEFAULT_GRADIENT[gradientId].id
    : default_1.THREE_POINT_DEFAULT_GRADIENT[gradientId].id;
exports.selectGradient = selectGradient;
function transformHexToRgb(color) {
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);
    return { red, green, blue };
}
exports.GRADIENT_PALETTES = {
    ...two_point_gradients_1.TWO_POINT_GRADIENT_PALETTES,
    ...three_point_gradients_1.THREE_POINT_GRADIENT_PALETTES,
};
const isSystemGradientPaletteId = (value) => {
    return Boolean(two_point_gradients_1.TWO_POINT_GRADIENTS[value] || three_point_gradients_1.THREE_POINT_GRADIENTS[value]);
};
exports.isSystemGradientPaletteId = isSystemGradientPaletteId;
