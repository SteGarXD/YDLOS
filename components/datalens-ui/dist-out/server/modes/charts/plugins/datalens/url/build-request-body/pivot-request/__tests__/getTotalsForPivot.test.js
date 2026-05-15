"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const totals_1 = require("../helpers/totals");
const common_mock_1 = require("./mocks/common.mock");
const getTotalsForPivot_mock_1 = require("./mocks/getTotalsForPivot.mock");
jest.mock('../../../../../../../../registry', () => ({
    registry: {
        getApp() {
            return { nodekit: { ctx: { config: { features: {} } } } };
        },
    },
}));
describe('getTotalsForPivot', () => {
    it.each([
        ['columns', { key: 'columnsFields', field: getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING }],
        ['rows', { key: 'rowsFields', field: getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING }],
    ])('Should return totals with %s level: 0, when grand totals disabled, but sub-totals for first field exists', (type, { key, field }) => {
        const args = {
            isGrandTotalsEnabled: false,
            columnsFields: [],
            rowsFields: [],
            [key]: [field],
        };
        const { settings: result } = (0, totals_1.getTotalsForPivot)(args);
        expect(result.totals[type]).toEqual([{ level: 0 }]);
    });
    it('Should set level, that equal index in array, when field has enabled sub-totals', () => {
        const args = {
            isGrandTotalsEnabled: false,
            columnsFields: [
                getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING,
                common_mock_1.MOCKED_DIMENSION_FIELD,
                getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING,
            ],
            rowsFields: [
                common_mock_1.MOCKED_DIMENSION_FIELD,
                getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING,
                common_mock_1.MOCKED_DIMENSION_FIELD,
                getTotalsForPivot_mock_1.MOCKED_DIMENSION_FIELD_WITH_SUB_TOTALS_SETTING,
            ],
        };
        const { settings: result } = (0, totals_1.getTotalsForPivot)(args);
        expect(result.totals.columns).toEqual([{ level: 0 }, { level: 2 }]);
        expect(result.totals.rows).toEqual([{ level: 1 }, { level: 3 }]);
    });
});
