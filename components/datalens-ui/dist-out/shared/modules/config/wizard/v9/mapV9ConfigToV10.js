"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV9ConfigToV10 = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const mapV9ConfigToV10 = (config) => {
    const affectedVisualizations = [
        constants_1.WizardVisualizationId.Pie,
        constants_1.WizardVisualizationId.Donut,
        constants_1.WizardVisualizationId.PieD3,
        constants_1.WizardVisualizationId.DonutD3,
    ];
    let visualization = config.visualization;
    if (affectedVisualizations.includes(visualization === null || visualization === void 0 ? void 0 : visualization.id)) {
        const placeholders = visualization.placeholders.map((p) => {
            if (p.id === constants_1.PlaceholderId.Dimensions) {
                return {
                    ...p,
                    id: constants_1.PlaceholderId.Colors,
                    type: constants_1.PlaceholderId.Colors,
                    required: false,
                };
            }
            return p;
        });
        visualization = {
            ...visualization,
            placeholders: placeholders,
        };
    }
    return {
        ...config,
        visualization,
        version: types_1.ChartsConfigVersion.V10,
    };
};
exports.mapV9ConfigToV10 = mapV9ConfigToV10;
