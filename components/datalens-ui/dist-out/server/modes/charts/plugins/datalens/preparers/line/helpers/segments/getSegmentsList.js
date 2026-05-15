"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedSegmentsList = exports.getSegmentsList = void 0;
const shared_1 = require("../../../../../../../../../shared");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const getSegmentName_1 = require("./getSegmentName");
const getSegmentsList = (args) => {
    const { data, segmentIndexInOrder, segmentField } = args;
    if (!segmentField) {
        return [];
    }
    const segmentsSet = new Set([]);
    data.forEach((dataRow) => {
        const segmentName = (0, getSegmentName_1.getSegmentName)(dataRow, segmentIndexInOrder);
        segmentsSet.add(segmentName);
    });
    return Array.from(segmentsSet);
};
exports.getSegmentsList = getSegmentsList;
const getSortedSegmentsList = (args) => {
    const { data, segmentIndexInOrder, sortItem, segmentField } = args;
    if (!segmentField) {
        return [];
    }
    const segments = (0, exports.getSegmentsList)({ data, segmentField, segmentIndexInOrder });
    const sortFn = (0, shared_1.isNumberField)(segmentField) ? misc_helpers_1.numericStringCollator : misc_helpers_1.collator.compare;
    segments.sort(sortFn);
    if (sortItem &&
        sortItem.guid === segmentField.guid &&
        sortItem.direction === shared_1.SortDirection.ASC) {
        segments.reverse();
    }
    return segments;
};
exports.getSortedSegmentsList = getSortedSegmentsList;
