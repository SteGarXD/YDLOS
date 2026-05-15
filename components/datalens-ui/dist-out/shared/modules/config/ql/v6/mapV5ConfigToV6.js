"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV5ConfigToV6 = void 0;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const versions_1 = require("../../../../types/ql/versions");
function getNewPaletteId(value) {
    return value === null || value === void 0 ? void 0 : value.replace('-palette', '');
}
function replacePalettesField(item) {
    if (item && typeof item === 'object') {
        if ('metricFontColorPalette' in item) {
            item.metricFontColorPalette = getNewPaletteId(item.metricFontColorPalette);
        }
        else if ('palette' in item) {
            item.palette = getNewPaletteId(item.palette);
        }
        else {
            Object.values(item).forEach(replacePalettesField);
        }
    }
}
const mapV5ConfigToV6 = (config) => {
    const newConfig = (0, cloneDeep_1.default)(config);
    replacePalettesField(newConfig);
    return {
        ...newConfig,
        version: versions_1.QlConfigVersions.V6,
    };
};
exports.mapV5ConfigToV6 = mapV5ConfigToV6;
