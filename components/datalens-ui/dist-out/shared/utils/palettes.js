"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorByColorSettings = getColorByColorSettings;
function getColorByColorSettings({ currentColors, colorIndex, color, fallbackIndex = 0, }) {
    if (typeof colorIndex === 'number') {
        return currentColors[colorIndex] || currentColors[fallbackIndex];
    }
    if (color) {
        return color;
    }
    return currentColors[fallbackIndex];
}
