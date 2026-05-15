"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentMap = getSegmentMap;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
const helpers_1 = require("../line/helpers");
function getSegmentMap(args) {
    var _a;
    const { placeholders, resultData: { data, order }, sort, segments, idToTitle, } = args;
    const segmentField = segments[0];
    if (!segmentField) {
        return {};
    }
    const segmentFieldTitle = idToTitle[segmentField.guid];
    const segmentsList = (0, helpers_1.getSortedSegmentsList)({
        sortItem: sort === null || sort === void 0 ? void 0 : sort[0],
        segmentField,
        segmentIndexInOrder: (0, misc_helpers_1.findIndexInOrder)(order, segmentField, segmentFieldTitle),
        data,
    });
    const y2Fields = ((_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y2)) === null || _a === void 0 ? void 0 : _a.items) || [];
    const hasOppositeYAxis = y2Fields.length > 0;
    return segmentsList.reduce((acc, segmentName) => {
        if (!acc[segmentName]) {
            const segmentIndex = Object.keys(acc).length;
            const title = segmentName;
            Object.assign(acc, {
                [segmentName]: { title, index: segmentIndex, isOpposite: false },
            });
            if (hasOppositeYAxis) {
                Object.assign(acc, {
                    [String((0, helpers_1.getY2SegmentNameKey)(segmentName))]: {
                        title,
                        index: segmentIndex + 1,
                        isOpposite: true,
                    },
                });
            }
        }
        return acc;
    }, {});
}
