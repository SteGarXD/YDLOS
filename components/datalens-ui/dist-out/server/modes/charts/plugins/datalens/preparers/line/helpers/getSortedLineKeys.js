"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedLineKeys = exports.sortLineKeysByFirstValues = void 0;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const sortLineKeysByFirstValues = (lk, index, { lines, categories, sortItemDirection, }) => {
    const firstCategory = categories[0];
    lk.sort((a, b) => {
        var _a, _b;
        const lineDataA = lines[index][a];
        const lineDataB = lines[index][b];
        const firstValueA = (_a = lineDataA.data[firstCategory]) === null || _a === void 0 ? void 0 : _a.value;
        const firstValueB = (_b = lineDataB.data[firstCategory]) === null || _b === void 0 ? void 0 : _b.value;
        if (sortItemDirection === 'ASC') {
            return Number(firstValueA) - Number(firstValueB);
        }
        return Number(firstValueB) - Number(firstValueA);
    });
};
exports.sortLineKeysByFirstValues = sortLineKeysByFirstValues;
const getSortedLineKeys = ({ colorItem, sortItem, isSortBySegments, isSortAvailable, lines, visualizationId, yField, categories, }) => {
    const lineKeys = lines.map((l) => Object.keys(l));
    if (!isSortAvailable || isSortBySegments) {
        if (!colorItem || (colorItem && colorItem.type !== 'PSEUDO')) {
            lineKeys.forEach((l) => {
                l.sort(misc_helpers_1.collator.compare);
            });
        }
        return lineKeys;
    }
    if (colorItem) {
        const sortedLineKeys = [...lineKeys];
        const sortItemDirection = sortItem.direction;
        const isDirectionReversed = sortItemDirection === 'DESC' || typeof sortItemDirection === 'undefined';
        const isAreaChart = visualizationId === shared_1.WizardVisualizationId.Area ||
            visualizationId === shared_1.WizardVisualizationId.Area100p;
        if (colorItem.guid === sortItem.guid) {
            if ((0, misc_helpers_1.isNumericalDataType)(sortItem.data_type) &&
                (0, misc_helpers_1.isNumericalDataType)(colorItem.data_type) &&
                (0, shared_1.isDimensionField)(colorItem)) {
                sortedLineKeys.forEach((lk) => {
                    lk.sort(misc_helpers_1.numericStringCollator);
                });
            }
            else if (!(0, shared_1.isMeasureField)(colorItem)) {
                sortedLineKeys.forEach((lk) => {
                    lk.sort(misc_helpers_1.collator.compare);
                });
            }
            if (isDirectionReversed) {
                sortedLineKeys.forEach((lk) => {
                    lk.reverse();
                });
            }
        }
        else if (sortItem.guid === yField.guid && isAreaChart) {
            sortedLineKeys.forEach((lk, index) => {
                (0, exports.sortLineKeysByFirstValues)(lk, index, { lines, categories, sortItemDirection });
            });
        }
        return sortedLineKeys;
    }
    return lineKeys;
};
exports.getSortedLineKeys = getSortedLineKeys;
