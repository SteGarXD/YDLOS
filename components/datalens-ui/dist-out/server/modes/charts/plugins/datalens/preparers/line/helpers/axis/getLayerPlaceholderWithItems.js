"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayerPlaceholderWithItems = void 0;
const getLayerPlaceholderWithItems = (visualization, id, { isFirstFromTheTop }) => {
    const layers = [...(visualization.layers || [])];
    if (isFirstFromTheTop) {
        layers.reverse();
    }
    let placeholder;
    layers.forEach((layer) => {
        const layersPlaceholder = layer.placeholders;
        placeholder = layersPlaceholder.find((layerPlaceholder) => layerPlaceholder.id === id && layerPlaceholder.items.length);
        if (placeholder) {
            return;
        }
    });
    return placeholder;
};
exports.getLayerPlaceholderWithItems = getLayerPlaceholderWithItems;
