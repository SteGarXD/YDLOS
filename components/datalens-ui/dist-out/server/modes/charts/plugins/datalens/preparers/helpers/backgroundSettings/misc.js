"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentBackgroundGradient = void 0;
const shared_1 = require("../../../../../../../../shared");
const getCurrentBackgroundGradient = (gradientState, loadedColorPalettes) => {
    return (0, shared_1.selectCurrentRGBGradient)(gradientState.gradientMode, gradientState.gradientPalette, loadedColorPalettes);
};
exports.getCurrentBackgroundGradient = getCurrentBackgroundGradient;
