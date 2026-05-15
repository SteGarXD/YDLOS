"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVisualizationsIds = getAllVisualizationsIds;
const shared_1 = require("../../../../../../../shared");
function getAllVisualizationsIds(config) {
    return (0, shared_1.isVisualizationWithLayers)(config.visualization)
        ? config.visualization.layers.map((l) => l.id)
        : [config.visualization.id];
}
