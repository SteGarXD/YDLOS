"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColorShapeMappingValue = void 0;
const getColorShapeMappingValue = ({ mountedValues, shownTitle, colorAndShapeKey, }) => {
    const isValueMountedByLegendTitle = typeof mountedValues[shownTitle] !== 'undefined';
    const isValueMountedByFieldTitle = typeof mountedValues[colorAndShapeKey] !== 'undefined';
    if (isValueMountedByLegendTitle && mountedValues[shownTitle] !== 'auto') {
        return shownTitle;
    }
    if (isValueMountedByFieldTitle && mountedValues[colorAndShapeKey] !== 'auto') {
        return colorAndShapeKey;
    }
    return undefined;
};
exports.getColorShapeMappingValue = getColorShapeMappingValue;
