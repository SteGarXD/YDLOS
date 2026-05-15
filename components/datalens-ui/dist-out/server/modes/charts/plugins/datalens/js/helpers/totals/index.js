"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMergedTotals = void 0;
const getMergedTotals = (args) => {
    const { mergedOrder, isFirstDataset, lastResultRow, totals, currentOrder, resultDataRows } = args;
    const mergedTotals = [...totals];
    if (isFirstDataset) {
        return [...mergedTotals, ...(lastResultRow.data || [])];
    }
    if (resultDataRows.length) {
        currentOrder.forEach(({ title }, index) => {
            const indexInMergedOrder = mergedOrder.findIndex((orderItem) => {
                if (Array.isArray(orderItem)) {
                    return orderItem.some((item) => item.title === title);
                }
                return orderItem.title === title;
            });
            if (indexInMergedOrder >= 0) {
                mergedTotals[indexInMergedOrder] = lastResultRow.data[index];
            }
        });
    }
    return mergedTotals;
};
exports.getMergedTotals = getMergedTotals;
