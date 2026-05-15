"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentsMap = exports.getY2SegmentNameKey = void 0;
const getY2SegmentNameKey = (segmentName) => {
    if (typeof segmentName !== 'string') {
        return segmentName;
    }
    return `${segmentName}__y2`;
};
exports.getY2SegmentNameKey = getY2SegmentNameKey;
const getSegmentsMap = (args) => {
    const { segments, y2SectionItems } = args;
    if (!segments.length) {
        return {};
    }
    const hasOppositeYAxis = Boolean(y2SectionItems.length);
    return segments.reduce((acc, segmentName) => {
        if (!acc[segmentName]) {
            const segmentIndex = Object.keys(acc).length;
            const updatedMap = {
                ...acc,
                [segmentName]: { title: segmentName, index: segmentIndex, isOpposite: false },
            };
            if (hasOppositeYAxis) {
                return {
                    ...updatedMap,
                    [(0, exports.getY2SegmentNameKey)(segmentName)]: {
                        title: segmentName,
                        index: segmentIndex + 1,
                        isOpposite: true,
                    },
                };
            }
            return updatedMap;
        }
        return acc;
    }, {});
};
exports.getSegmentsMap = getSegmentsMap;
