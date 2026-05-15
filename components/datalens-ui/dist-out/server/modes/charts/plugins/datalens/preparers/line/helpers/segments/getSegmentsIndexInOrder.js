"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentsIndexInOrder = void 0;
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const getSegmentsIndexInOrder = (order, segmentField, idToTitle) => {
    if (!segmentField) {
        return -1;
    }
    const segmentTitle = idToTitle[segmentField.guid];
    return (0, misc_helpers_1.findIndexInOrder)(order, segmentField, segmentTitle);
};
exports.getSegmentsIndexInOrder = getSegmentsIndexInOrder;
