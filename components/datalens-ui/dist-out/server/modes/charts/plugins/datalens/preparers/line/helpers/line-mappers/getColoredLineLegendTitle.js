"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColoredLineLegendTitle = getColoredLineLegendTitle;
const shared_1 = require("../../../../../../../../../shared");
function isSameTitle(field, otherField) {
    return (0, shared_1.getFakeTitleOrTitle)(field) === (0, shared_1.getFakeTitleOrTitle)(otherField);
}
function getYItems(layer) {
    var _a;
    return ((_a = layer.placeholders[1]) === null || _a === void 0 ? void 0 : _a.items) || [];
}
function getColoredLineLegendTitle(args) {
    const { layers, yItem, colorItem, formattedValue } = args;
    const coloredLayers = (layers === null || layers === void 0 ? void 0 : layers.filter((layer) => { var _a; return getYItems(layer).length && ((_a = layer.commonPlaceholders.colors) === null || _a === void 0 ? void 0 : _a.length); })) || [];
    if (coloredLayers.length > 1) {
        const isDifferentYItem = coloredLayers.some((layer) => getYItems(layer).some((item) => !isSameTitle(item, yItem)));
        const isDifferentColorItem = coloredLayers.some(({ commonPlaceholders }) => commonPlaceholders.colors.some((item) => (0, shared_1.isDimensionField)(item) && !isSameTitle(item, colorItem)));
        const legendTitleItems = [formattedValue];
        if (isDifferentColorItem) {
            legendTitleItems.unshift((0, shared_1.getFakeTitleOrTitle)(colorItem));
        }
        if (isDifferentYItem) {
            legendTitleItems.unshift((0, shared_1.getFakeTitleOrTitle)(yItem));
        }
        return legendTitleItems.join(': ');
    }
    return formattedValue;
}
