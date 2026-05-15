"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSegmentsOversizeError = exports.isBackendPivotColumnsOversizeError = exports.isBackendPivotCellsOversizeError = exports.isDefaultOversizeError = void 0;
const shared_1 = require("../../../../../../../../../shared");
const helpers_1 = require("../../../../preparers/line/helpers");
const isDefaultOversizeError = (rowsLength, rowsLimit) => {
    return (typeof rowsLength !== 'undefined' &&
        typeof rowsLimit !== 'undefined' &&
        rowsLength > rowsLimit);
};
exports.isDefaultOversizeError = isDefaultOversizeError;
const isBackendPivotCellsOversizeError = (cellsCount, cellsLimit) => {
    return (typeof cellsCount !== 'undefined' &&
        typeof cellsLimit !== 'undefined' &&
        cellsCount > cellsLimit);
};
exports.isBackendPivotCellsOversizeError = isBackendPivotCellsOversizeError;
const isBackendPivotColumnsOversizeError = (columnsCount, columnsLimit) => {
    return (typeof columnsCount !== 'undefined' &&
        typeof columnsLimit !== 'undefined' &&
        columnsCount > columnsLimit);
};
exports.isBackendPivotColumnsOversizeError = isBackendPivotColumnsOversizeError;
const isSegmentsOversizeError = (args) => {
    const { order, segments, idToTitle, data } = args;
    if (!segments.length) {
        return {
            segmentsOversize: false,
            segmentsNumber: 0,
        };
    }
    const segmentIndexInOrder = (0, helpers_1.getSegmentsIndexInOrder)(order, segments[0], idToTitle);
    const segmentsNames = (0, helpers_1.getSegmentsList)({ data, segmentIndexInOrder, segmentField: segments[0] });
    return {
        segmentsOversize: segmentsNames.length > shared_1.MAX_SEGMENTS_NUMBER,
        segmentsNumber: segmentsNames.length,
    };
};
exports.isSegmentsOversizeError = isSegmentsOversizeError;
