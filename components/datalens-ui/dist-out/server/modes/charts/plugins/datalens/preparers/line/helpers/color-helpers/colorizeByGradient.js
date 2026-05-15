"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorizeByGradient = void 0;
const shared_1 = require("../../../../../../../../../shared");
const color_helpers_1 = require("../../../../utils/color-helpers");
const colorizeColumnAndBarGraphs = (graphs, colorsConfig) => {
    (0, color_helpers_1.mapAndColorizeGraphsByGradient)(graphs, colorsConfig);
};
const colorizeByGradient = (visualizationId, options) => {
    switch (visualizationId) {
        case shared_1.WizardVisualizationId.Column:
        case shared_1.WizardVisualizationId.Column100p:
        case shared_1.WizardVisualizationId.BarXD3:
        case shared_1.WizardVisualizationId.Bar:
        case shared_1.WizardVisualizationId.Bar100p:
        case shared_1.WizardVisualizationId.BarYD3:
        case shared_1.WizardVisualizationId.BarY100pD3: {
            colorizeColumnAndBarGraphs(options.graphs, options.colorsConfig);
        }
    }
};
exports.colorizeByGradient = colorizeByGradient;
