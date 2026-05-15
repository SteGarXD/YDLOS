"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV12ConfigToV13 = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const OLD_DEFAULT_PALETTE_ID = 'default-palette';
// replace 'default-palette' (old default20) with classic20 palette
const mapV12ConfigToV13 = (config) => {
    var _a, _b, _c;
    // there are differences only in the type of extraSettings
    const migratedConfig = { ...config, version: types_1.ChartsConfigVersion.V13 };
    if (((_a = config.visualization) === null || _a === void 0 ? void 0 : _a.id) === constants_1.WizardVisualizationId.Metric &&
        config.extraSettings &&
        config.extraSettings.metricFontColorPalette === OLD_DEFAULT_PALETTE_ID) {
        const migratedExtraSettings = {
            ...config.extraSettings,
            metricFontColorPalette: constants_1.COMMON_PALETTE_ID.CLASSIC_20,
        };
        return {
            ...migratedConfig,
            extraSettings: migratedExtraSettings,
        };
    }
    else if (((_b = config.visualization) === null || _b === void 0 ? void 0 : _b.id) === constants_1.WizardVisualizationId.PivotTable ||
        ((_c = config.visualization) === null || _c === void 0 ? void 0 : _c.id) === constants_1.WizardVisualizationId.FlatTable) {
        const migratedPlaceholders = config.visualization.placeholders.map((placeholder) => {
            const migratedItems = placeholder.items.map((item) => {
                var _a, _b, _c;
                const migratedItem = { ...item };
                if ((_a = migratedItem.backgroundSettings) === null || _a === void 0 ? void 0 : _a.settings.paletteState.palette) {
                    migratedItem.backgroundSettings.settings.paletteState.palette =
                        migratedItem.backgroundSettings.settings.paletteState.palette ===
                            OLD_DEFAULT_PALETTE_ID
                            ? constants_1.COMMON_PALETTE_ID.CLASSIC_20
                            : migratedItem.backgroundSettings.settings.paletteState.palette;
                }
                if ((_c = (_b = migratedItem.barsSettings) === null || _b === void 0 ? void 0 : _b.colorSettings) === null || _c === void 0 ? void 0 : _c.settings.palette) {
                    migratedItem.barsSettings.colorSettings.settings.palette =
                        migratedItem.barsSettings.colorSettings.settings.palette ===
                            OLD_DEFAULT_PALETTE_ID
                            ? constants_1.COMMON_PALETTE_ID.CLASSIC_20
                            : migratedItem.barsSettings.colorSettings.settings.palette;
                }
                return migratedItem;
            });
            return { ...placeholder, items: migratedItems };
        });
        return {
            ...migratedConfig,
            visualization: { ...config.visualization, placeholders: migratedPlaceholders },
        };
        // tables also has colorsConfig but only for gradients and we don't touch them.
        // indicators also has colorsConfig but it is not used
    }
    else if (config.colorsConfig && config.colorsConfig.palette === OLD_DEFAULT_PALETTE_ID) {
        return {
            ...migratedConfig,
            colorsConfig: { ...config.colorsConfig, palette: constants_1.COMMON_PALETTE_ID.CLASSIC_20 },
        };
    }
    return migratedConfig;
};
exports.mapV12ConfigToV13 = mapV12ConfigToV13;
