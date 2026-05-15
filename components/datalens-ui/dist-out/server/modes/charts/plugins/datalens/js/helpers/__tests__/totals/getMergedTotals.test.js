"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const totals_1 = require("../../totals");
const getMergedTotals_mock_1 = require("../mocks/totals/getMergedTotals.mock");
describe('getMergedTotals', () => {
    it('merge all totals into one array if data came from only one dataset', () => {
        const mergedTotals = (0, totals_1.getMergedTotals)({
            mergedOrder: getMergedTotals_mock_1.FIRST_DATASET_MERGED_ORDER,
            lastResultRow: getMergedTotals_mock_1.FIRST_DATASET_LAST_RESULT_ROW,
            isFirstDataset: true,
            totals: [],
            currentOrder: getMergedTotals_mock_1.FIRST_DATASET_CURRENT_ORDER,
            resultDataRows: getMergedTotals_mock_1.FIRST_DATASET_LOADED_DATA_ROWS,
        });
        expect(mergedTotals).toEqual(['', '250']);
    });
    it('Merge all totals depending on the mergedOrder array if multiple datasets', () => {
        let mergedTotals = [];
        const mergedTotalsArgs = [
            // The first dataset
            {
                mergedOrder: getMergedTotals_mock_1.FIRST_DATASET_MERGED_ORDER,
                lastResultRow: getMergedTotals_mock_1.FIRST_DATASET_LAST_RESULT_ROW,
                isFirstDataset: true,
                currentOrder: getMergedTotals_mock_1.FIRST_DATASET_CURRENT_ORDER,
                resultDataRows: getMergedTotals_mock_1.FIRST_DATASET_LOADED_DATA_ROWS,
            },
            {
                mergedOrder: getMergedTotals_mock_1.SECOND_DATASET_MERGED_ORDER,
                lastResultRow: getMergedTotals_mock_1.SECOND_DATASET_LAST_RESULT_ROW,
                isFirstDataset: false,
                currentOrder: getMergedTotals_mock_1.SECOND_DATASET_CURRENT_ORDER,
                resultDataRows: getMergedTotals_mock_1.SECOND_DATASET_LOADED_DATA_ROWS,
            },
        ];
        mergedTotalsArgs.forEach((args) => {
            mergedTotals = (0, totals_1.getMergedTotals)({ ...args, totals: mergedTotals });
        });
        expect(mergedTotals.slice(0, 3)).toEqual(['', '250', '600']);
    });
});
