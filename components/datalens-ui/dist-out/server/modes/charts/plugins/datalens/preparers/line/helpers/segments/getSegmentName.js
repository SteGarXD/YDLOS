"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentName = void 0;
const getSegmentName = (dataRow, index) => {
    const segmentName = dataRow[index];
    return segmentName === null ? 'Null' : segmentName;
};
exports.getSegmentName = getSegmentName;
