"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
const common_mock_1 = require("./mocks/common.mock");
const getRegularFields_mock_1 = require("./mocks/getRegularFields.mock");
describe('getRegularFields', () => {
    it('Should return a stacked array of columns', () => {
        const { columnsReq } = (0, helpers_1.getRegularFields)({
            columns: getRegularFields_mock_1.COLUMNS,
            orderByMap: {},
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: [],
            measures: [],
        });
        expect(columnsReq).toEqual([
            {
                legend_item_id: 0,
                block_id: 0,
                role_spec: {
                    role: 'pivot_column',
                    direction: 'asc',
                },
                ref: { type: 'id', id: '9aa48a4f-cace-4256-bd59-55fc7aa43c4f' },
            },
        ]);
    });
    it('Must return the accumulated array of strings', () => {
        const { rowsReq } = (0, helpers_1.getRegularFields)({
            columns: [],
            orderByMap: {},
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: getRegularFields_mock_1.ROWS,
            measures: [],
        });
        expect(rowsReq).toEqual([
            {
                legend_item_id: 0,
                block_id: 0,
                role_spec: {
                    role: 'pivot_row',
                    direction: 'asc',
                },
                ref: { type: 'id', id: '56185375-6b39-4ca2-aec2-f0971b7332bc' },
            },
        ]);
    });
    it('Must return the accumulated array of measures', () => {
        const { measuresReq } = (0, helpers_1.getRegularFields)({
            columns: [],
            orderByMap: {},
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: [],
            measures: getRegularFields_mock_1.MEASURES,
        });
        expect(measuresReq).toEqual([
            {
                legend_item_id: 0,
                block_id: 0,
                role_spec: {
                    role: 'pivot_measure',
                    direction: 'asc',
                },
                ref: { type: 'id', id: '9781c180-fe55-11ea-be64-078ac452d479' },
            },
        ]);
    });
    it('Should return a stacked array of columns if Measure Names is there', () => {
        const { columnsReq } = (0, helpers_1.getRegularFields)({
            columns: getRegularFields_mock_1.COLUMNS_MEASURE_NAME,
            orderByMap: {},
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: [],
            measures: [],
        });
        expect(columnsReq).toEqual([
            {
                legend_item_id: 0,
                block_id: 0,
                role_spec: {
                    role: 'pivot_column',
                    direction: 'asc',
                },
                ref: { type: 'measure_name' },
            },
        ]);
    });
    it('Should return the accumulated array of strings if there is a Measure Names or Measure Values', () => {
        const { rowsReq } = (0, helpers_1.getRegularFields)({
            columns: [],
            orderByMap: {},
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: getRegularFields_mock_1.ROWS_MEASURE_NAME_AND_MEASURE_VALUE,
            measures: [],
        });
        expect(rowsReq).toEqual([
            {
                legend_item_id: 0,
                block_id: 0,
                role_spec: {
                    role: 'pivot_row',
                    direction: 'asc',
                },
                ref: { type: 'measure_name' },
            },
            {
                legend_item_id: 1,
                block_id: 0,
                role_spec: {
                    role: 'pivot_row',
                    direction: 'asc',
                },
                ref: { type: 'measure_name' },
            },
        ]);
    });
    it('Must put direction, depending on the orderByMap object', () => {
        var _a, _b, _c;
        const { columnsReq, rowsReq, measuresReq } = (0, helpers_1.getRegularFields)({
            columns: getRegularFields_mock_1.COLUMNS,
            orderByMap: common_mock_1.ORDER_BY_MAP,
            legendItemCounter: { legendItemIdIndex: 0 },
            rows: getRegularFields_mock_1.ROWS,
            measures: getRegularFields_mock_1.MEASURES,
        });
        expect((_a = columnsReq[0].role_spec) === null || _a === void 0 ? void 0 : _a.direction).toEqual('desc');
        expect((_b = rowsReq[0].role_spec) === null || _b === void 0 ? void 0 : _b.direction).toEqual('asc');
        expect((_c = measuresReq[0].role_spec) === null || _c === void 0 ? void 0 : _c.direction).toEqual('desc');
    });
    it('Must increment legend_item_id by one for each field in turn: [columnsReq, rowsReq, measuresReq, colorsReq]', () => {
        const { columnsReq, rowsReq, measuresReq } = (0, helpers_1.getRegularFields)({
            columns: getRegularFields_mock_1.COLUMNS,
            rows: getRegularFields_mock_1.ROWS,
            measures: getRegularFields_mock_1.MEASURES,
            legendItemCounter: { legendItemIdIndex: 0 },
            orderByMap: {},
        });
        expect(columnsReq[0].legend_item_id).toEqual(0);
        expect(rowsReq[0].legend_item_id).toEqual(1);
        expect(measuresReq[0].legend_item_id).toEqual(2);
    });
});
