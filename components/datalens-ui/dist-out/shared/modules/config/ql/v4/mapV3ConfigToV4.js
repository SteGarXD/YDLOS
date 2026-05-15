"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV3ConfigToV4 = void 0;
const constants_1 = require("../../../../constants");
const versions_1 = require("../../../../types/ql/versions");
const mapV3ConfigToV4 = (config) => {
    const affectedVisualizations = [
        constants_1.WizardVisualizationId.Pie,
        constants_1.WizardVisualizationId.Donut,
        constants_1.WizardVisualizationId.PieD3,
        constants_1.WizardVisualizationId.DonutD3,
    ];
    let visualization = config.visualization;
    if (affectedVisualizations.includes(visualization === null || visualization === void 0 ? void 0 : visualization.id)) {
        const currentPlaceholders = visualization.placeholders || [];
        let placeholders = currentPlaceholders;
        if (!currentPlaceholders.some((p) => p.id === constants_1.PlaceholderId.Colors)) {
            const dimensionsPlaceholder = {
                id: constants_1.PlaceholderId.Dimensions,
                type: constants_1.PlaceholderId.Dimensions,
                items: [],
            };
            const colorsPlaceholder = {
                items: [],
                ...currentPlaceholders.find((p) => p.id === constants_1.PlaceholderId.Dimensions),
                id: constants_1.PlaceholderId.Colors,
                type: constants_1.PlaceholderId.Colors,
                required: false,
            };
            const measuresPlaceholder = {
                items: [],
                id: constants_1.PlaceholderId.Measures,
                type: constants_1.PlaceholderId.Measures,
                ...currentPlaceholders.find((p) => p.id === constants_1.PlaceholderId.Measures),
            };
            placeholders = [
                dimensionsPlaceholder,
                colorsPlaceholder,
                measuresPlaceholder,
            ];
        }
        visualization = {
            ...visualization,
            placeholders,
        };
    }
    return {
        ...config,
        visualization,
        version: versions_1.QlConfigVersions.V4,
    };
};
exports.mapV3ConfigToV4 = mapV3ConfigToV4;
