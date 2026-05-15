"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addColorPaletteRequest = addColorPaletteRequest;
exports.getColorPalettesRequests = getColorPalettesRequests;
exports.extractColorPalettesFromData = extractColorPalettesFromData;
exports.getColorsSettings = getColorsSettings;
const lodash_1 = require("lodash");
const shared_1 = require("../../../../../shared");
const constants_1 = require("../../../../constants");
function isCustomColorPaletteId(value, systemPalettes) {
    const isSystem = (0, shared_1.isSystemGradientPaletteId)(value) || (0, shared_1.isSystemPaletteId)(value, systemPalettes);
    return !isSystem && (0, shared_1.isEntryId)(value);
}
function addColorPaletteRequest({ colorPaletteId, palettes, result, }) {
    if (isCustomColorPaletteId(colorPaletteId, palettes)) {
        // eslint-disable-next-line no-param-reassign
        result[`colorPalettes_${colorPaletteId}`] = {
            method: 'GET',
            url: `/_us_color_palettes/${colorPaletteId}`,
            hideInInspector: true,
        };
    }
}
function getColorPalettesRequests(args) {
    var _a, _b, _c, _d;
    const { config, palettes } = args;
    const visualization = config.visualization;
    const result = {};
    const colorPalettes = new Set();
    if ((0, shared_1.isVisualizationWithLayers)(visualization)) {
        visualization.layers.forEach((layer) => {
            const colorConfig = layer.commonPlaceholders.colorsConfig;
            colorPalettes.add((colorConfig === null || colorConfig === void 0 ? void 0 : colorConfig.palette) || (colorConfig === null || colorConfig === void 0 ? void 0 : colorConfig.gradientPalette) || '');
        });
    }
    else {
        const colorPaletteId = ((_a = config.colorsConfig) === null || _a === void 0 ? void 0 : _a.palette) ||
            ((_b = config.colorsConfig) === null || _b === void 0 ? void 0 : _b.gradientPalette) ||
            ((_c = config.extraSettings) === null || _c === void 0 ? void 0 : _c.metricFontColorPalette) ||
            '';
        colorPalettes.add(colorPaletteId);
    }
    colorPalettes.forEach((colorPaletteId) => addColorPaletteRequest({ colorPaletteId, palettes, result }));
    (_d = visualization.placeholders) === null || _d === void 0 ? void 0 : _d.forEach((placeholder) => {
        placeholder.items.forEach((item) => {
            var _a, _b, _c, _d, _e;
            const { backgroundSettings, barsSettings } = item;
            if (backgroundSettings && backgroundSettings.enabled) {
                const gradientPaletteId = (_b = (_a = backgroundSettings.settings) === null || _a === void 0 ? void 0 : _a.gradientState) === null || _b === void 0 ? void 0 : _b.gradientPalette;
                if (gradientPaletteId) {
                    addColorPaletteRequest({ colorPaletteId: gradientPaletteId, palettes, result });
                }
                const regularPaletteId = (_d = (_c = backgroundSettings.settings) === null || _c === void 0 ? void 0 : _c.paletteState) === null || _d === void 0 ? void 0 : _d.palette;
                if (regularPaletteId) {
                    addColorPaletteRequest({ colorPaletteId: regularPaletteId, palettes, result });
                }
            }
            if (barsSettings && barsSettings.enabled) {
                const gradientPaletteId = (_e = barsSettings.colorSettings.settings) === null || _e === void 0 ? void 0 : _e.palette;
                if (gradientPaletteId) {
                    addColorPaletteRequest({ colorPaletteId: gradientPaletteId, palettes, result });
                }
            }
        });
    });
    return result;
}
function extractColorPalettesFromData(data) {
    const palettes = {};
    const loadedData = {};
    Object.keys(data).forEach((key) => {
        if (key.includes('colorPalettes_')) {
            const paletteId = key.replace('colorPalettes_', '');
            palettes[paletteId] = data[key][0];
        }
        else {
            loadedData[key] = data[key];
        }
    });
    return { colorPalettes: palettes, loadedData };
}
function getColorsSettings({ defaultColorPaletteId, colorsConfig, field, customColorPalettes, availablePalettes, }) {
    var _a, _b;
    let mountedColors = {};
    let colors = [];
    if ((colorsConfig === null || colorsConfig === void 0 ? void 0 : colorsConfig.mountedColors) &&
        ((field === null || field === void 0 ? void 0 : field.guid) === colorsConfig.fieldGuid || colorsConfig.coloredByMeasure)) {
        mountedColors = (_a = colorsConfig.mountedColors) !== null && _a !== void 0 ? _a : {};
    }
    else if (field) {
        const fieldSettings = (0, shared_1.getFieldUISettings)({ field });
        mountedColors = (_b = fieldSettings === null || fieldSettings === void 0 ? void 0 : fieldSettings.colors) !== null && _b !== void 0 ? _b : {};
        colors = (0, constants_1.selectServerPalette)({
            palette: fieldSettings === null || fieldSettings === void 0 ? void 0 : fieldSettings.palette,
            availablePalettes,
            customColorPalettes,
            defaultColorPaletteId,
        });
    }
    if ((0, lodash_1.isEmpty)(colors)) {
        colors = (0, constants_1.selectServerPalette)({
            palette: colorsConfig === null || colorsConfig === void 0 ? void 0 : colorsConfig.palette,
            availablePalettes,
            customColorPalettes,
            defaultColorPaletteId,
        });
    }
    return { mountedColors, colors };
}
