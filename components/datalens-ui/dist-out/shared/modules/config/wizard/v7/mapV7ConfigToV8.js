"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV7ConfigToV8 = void 0;
const constants_1 = require("../../../../constants");
// import placeholderId this way because if it will be imported from constants
// it will be failed when playwright runs tests.
// the TypeError will occur and says that PlaceholderId is undefined
const placeholder_1 = require("../../../../constants/placeholder");
const types_1 = require("../../../../types");
const PLACEHOLDERS_WITH_TOTALS_SETTINGS = {
    [placeholder_1.PlaceholderId.PivotTableRows]: true,
    [placeholder_1.PlaceholderId.PivotTableColumns]: true,
};
const setGrandTotalsSettingToPlaceholderItems = (placeholder, isGrandTotalsEnabled) => {
    const placeholderItems = placeholder.items || [];
    let updatedItems = placeholderItems;
    if (placeholderItems.length) {
        updatedItems = [
            { ...placeholderItems[0], subTotalsSettings: { enabled: isGrandTotalsEnabled } },
            ...placeholderItems.slice(1),
        ];
    }
    return {
        ...placeholder,
        items: updatedItems,
    };
};
const mapV7ConfigToV8 = (config) => {
    const visualization = config.visualization;
    const extraSettings = config.extraSettings;
    let updatedVisualization;
    if (visualization.id === constants_1.WizardVisualizationId.PivotTable) {
        const updatedPlaceholders = (visualization.placeholders || []).map((placeholder) => {
            if (PLACEHOLDERS_WITH_TOTALS_SETTINGS[placeholder.id]) {
                return setGrandTotalsSettingToPlaceholderItems(placeholder, (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.totals) === 'on');
            }
            return placeholder;
        });
        updatedVisualization = {
            ...visualization,
            placeholders: updatedPlaceholders,
        };
    }
    else {
        updatedVisualization = visualization;
    }
    return {
        ...config,
        visualization: updatedVisualization,
        version: types_1.ChartsConfigVersion.V8,
    };
};
exports.mapV7ConfigToV8 = mapV7ConfigToV8;
