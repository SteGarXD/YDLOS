"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const default_request_1 = require("../../default-request");
const buildTotalRequests_mock_1 = require("./mocks/buildTotalRequests.mock");
describe('buildTotalRequestFields', () => {
    it('Returns fields for totals: A stub for the measurement and a field with the total role for the measure', () => {
        var _a, _b, _c;
        const totalsColumns = (0, default_request_1.buildTotalRequestFields)({
            fields: buildTotalRequests_mock_1.FIELDS,
            datasetId: buildTotalRequests_mock_1.DATASET_ID_1,
            columns: buildTotalRequests_mock_1.COLUMNS,
        });
        expect(totalsColumns).toHaveLength(2);
        const dimensionPlaceholderColumn = totalsColumns[0];
        const measureTotalColumn = totalsColumns[1];
        expect((_a = dimensionPlaceholderColumn.role_spec) === null || _a === void 0 ? void 0 : _a.role).toEqual('template');
        expect((_b = dimensionPlaceholderColumn.role_spec) === null || _b === void 0 ? void 0 : _b.template).toEqual('');
        expect(dimensionPlaceholderColumn.ref.type).toEqual('placeholder');
        expect(measureTotalColumn.ref.type).toEqual('id');
        const measureFieldGuid = buildTotalRequests_mock_1.FIELDS[1].guid;
        // @ts-ignore
        expect(measureTotalColumn.ref.id).toEqual(measureFieldGuid);
        expect((_c = measureTotalColumn.role_spec) === null || _c === void 0 ? void 0 : _c.role).toEqual('total');
    });
    it('The order in the returned array depends on the order of fields and columns', () => {
        var _a, _b;
        const totalsColumns = (0, default_request_1.buildTotalRequestFields)({
            fields: buildTotalRequests_mock_1.FIELDS_FOR_ORDER_TEST,
            columns: buildTotalRequests_mock_1.COLUMNS_FOR_ORDER_TEST,
            datasetId: buildTotalRequests_mock_1.DATASET_ID_1,
        });
        expect(totalsColumns).toHaveLength(3);
        const measureField_1 = buildTotalRequests_mock_1.FIELDS_FOR_ORDER_TEST[0];
        const measureField_2 = buildTotalRequests_mock_1.FIELDS_FOR_ORDER_TEST[2];
        expect(totalsColumns[0].ref.type).toEqual('id');
        // @ts-ignore
        expect(totalsColumns[0].ref.id).toEqual(measureField_1.guid);
        expect(totalsColumns[1].ref.type).toEqual('placeholder');
        expect((_a = totalsColumns[1].role_spec) === null || _a === void 0 ? void 0 : _a.role).toEqual('template');
        expect((_b = totalsColumns[1].role_spec) === null || _b === void 0 ? void 0 : _b.template).toEqual('');
        expect(totalsColumns[2].ref.type).toEqual('id');
        // @ts-ignore
        expect(totalsColumns[2].ref.id).toEqual(measureField_2.guid);
    });
    it('Only fields with the datasetId used to build the query get into the totals query', () => {
        var _a, _b;
        const totalsColumns = (0, default_request_1.buildTotalRequestFields)({
            fields: buildTotalRequests_mock_1.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST,
            columns: buildTotalRequests_mock_1.COLUMNS_FOR_DATASET_ID_1,
            datasetId: buildTotalRequests_mock_1.DATASET_ID_1,
        });
        expect(totalsColumns).toHaveLength(3);
        expect(totalsColumns[0].ref.type).toEqual('placeholder');
        expect(totalsColumns[1].ref.type).toEqual('id');
        // @ts-ignore
        expect(totalsColumns[1].ref.id).toEqual(buildTotalRequests_mock_1.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST[1].guid);
        expect((_a = totalsColumns[1].role_spec) === null || _a === void 0 ? void 0 : _a.role).toEqual('total');
        expect(totalsColumns[2].ref.type).toEqual('id');
        // @ts-ignore
        expect(totalsColumns[2].ref.id).toEqual(buildTotalRequests_mock_1.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST[2].guid);
        expect((_b = totalsColumns[2].role_spec) === null || _b === void 0 ? void 0 : _b.role).toEqual('total');
    });
    it('If there are columns in columns that are not in fields, then they are added to the end of the array of totals in the form of placeholder', () => {
        var _a, _b, _c;
        const totalsColumns = (0, default_request_1.buildTotalRequestFields)({
            fields: buildTotalRequests_mock_1.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST,
            columns: buildTotalRequests_mock_1.COLUMNS_FOR_DATASET_ID_2,
            datasetId: buildTotalRequests_mock_1.DATASET_ID_2,
        });
        expect(totalsColumns).toHaveLength(2);
        expect(totalsColumns[0].ref.type).toEqual('id');
        //@ts-ignore
        expect(totalsColumns[0].ref.id).toEqual(buildTotalRequests_mock_1.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST[3].guid);
        expect((_a = totalsColumns[0].role_spec) === null || _a === void 0 ? void 0 : _a.role).toEqual('total');
        expect(totalsColumns[1].ref.type).toEqual('placeholder');
        expect((_b = totalsColumns[1].role_spec) === null || _b === void 0 ? void 0 : _b.role).toEqual('template');
        expect((_c = totalsColumns[1].role_spec) === null || _c === void 0 ? void 0 : _c.template).toEqual('');
    });
});
