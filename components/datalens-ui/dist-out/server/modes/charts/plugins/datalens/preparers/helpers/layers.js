"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYPlaceholders = getYPlaceholders;
const shared_1 = require("../../../../../../../shared");
const getLayerPlaceholderWithItems_1 = require("../line/helpers/axis/getLayerPlaceholderWithItems");
function getYPlaceholders(args) {
    const { shared, placeholders, layerSettings } = args;
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const y2Placeholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y2);
    const visualization = shared.visualization;
    let layerYPlaceholder;
    let layerY2Placeholder;
    if ((0, shared_1.isVisualizationWithLayers)(visualization)) {
        const lastLayer = visualization.layers[visualization.layers.length - 1];
        if (lastLayer.layerSettings.id === layerSettings.id) {
            layerYPlaceholder = yPlaceholder;
            layerY2Placeholder = y2Placeholder;
            if (!(layerYPlaceholder === null || layerYPlaceholder === void 0 ? void 0 : layerYPlaceholder.items.length)) {
                layerYPlaceholder = (0, getLayerPlaceholderWithItems_1.getLayerPlaceholderWithItems)(shared.visualization, shared_1.PlaceholderId.Y, { isFirstFromTheTop: true });
            }
            if (!(layerY2Placeholder === null || layerY2Placeholder === void 0 ? void 0 : layerY2Placeholder.items.length)) {
                layerY2Placeholder = (0, getLayerPlaceholderWithItems_1.getLayerPlaceholderWithItems)(shared.visualization, shared_1.PlaceholderId.Y2, { isFirstFromTheTop: true });
            }
        }
    }
    else {
        layerYPlaceholder = yPlaceholder;
        layerY2Placeholder = y2Placeholder;
    }
    return [layerYPlaceholder, layerY2Placeholder];
}
