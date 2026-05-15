"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const merge_1 = __importDefault(require("lodash/merge"));
const pick_1 = __importDefault(require("lodash/pick"));
const shared_1 = require("../../../../../../../../shared");
const common_mock_1 = require("../../__tests__/common.mock");
const prepare_bar_y_data_1 = require("../prepare-bar-y-data");
const DimensionField = { ...common_mock_1.IntegerField, type: 'DIMENSION', guid: 'DimensionField_guid' };
describe('prepareBarYData', () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(() => 0);
    const args = {
        ...common_mock_1.EmptyPrepapreArgs,
        // @ts-ignore
        shared: { visualization: { id: shared_1.WizardVisualizationId.Bar } },
        idToTitle: {
            [common_mock_1.IntegerField.guid]: common_mock_1.IntegerField.title,
            [common_mock_1.DateTimeField.guid]: common_mock_1.DateTimeField.title,
            [DimensionField.guid]: DimensionField.title,
        },
        idToDataType: {
            [common_mock_1.IntegerField.guid]: common_mock_1.IntegerField.data_type,
            [common_mock_1.DateTimeField.guid]: common_mock_1.DateTimeField.data_type,
            [DimensionField.guid]: DimensionField.data_type,
        },
    };
    test('X is empty, Y has integer field -> categories contain values from the Y field', () => {
        const result = (0, prepare_bar_y_data_1.prepareBarYData)({
            ...args,
            placeholders: [
                {
                    id: 'y',
                    items: [common_mock_1.IntegerField],
                },
                {
                    id: 'x',
                    items: [],
                },
            ],
            resultData: {
                data: [['11'], ['222']],
                order: [common_mock_1.IntegerField],
                totals: [],
            },
        });
        expect(result.categories).toEqual(['11', '222']);
    });
    test('X is empty, Y has datetime field -> categories_ms contains values from the Y field', () => {
        const placeholders = [
            {
                id: 'y',
                items: [common_mock_1.DateTimeField],
                settings: {
                    axisModeMap: {
                        [common_mock_1.DateTimeField.guid]: "continuous" /* AxisMode.Continuous */,
                    },
                },
            },
            {
                id: 'x',
                items: [],
            },
        ];
        const result = (0, prepare_bar_y_data_1.prepareBarYData)({
            ...args,
            placeholders,
            shared: (0, merge_1.default)(args.shared, {
                visualization: {
                    placeholders,
                },
            }),
            resultData: {
                data: [['2023-09-17T00:00:00.000Z'], ['2023-09-18T00:00:00.000Z']],
                order: [common_mock_1.DateTimeField],
                totals: [],
            },
        });
        expect(result.categories_ms).toEqual([1694908800000, 1694995200000]);
    });
    test('X is not empty, Y has datetime field -> categories and categories_ms are undefined, result contain one graph', () => {
        const result = (0, prepare_bar_y_data_1.prepareBarYData)({
            ...args,
            placeholders: [
                {
                    id: 'y',
                    items: [common_mock_1.DateTimeField],
                    settings: {
                        axisModeMap: {
                            [common_mock_1.DateTimeField.guid]: "continuous" /* AxisMode.Continuous */,
                        },
                    },
                },
                {
                    id: 'x',
                    items: [DimensionField],
                },
            ],
            resultData: {
                data: [
                    ['2023-09-17T00:00:00.000Z', '100'],
                    ['2023-09-18T00:00:00.000Z', '200'],
                ],
                order: [common_mock_1.DateTimeField, DimensionField],
                totals: [],
            },
        });
        expect(result.categories).not.toBeDefined();
        expect(result.categories_ms).not.toBeDefined();
        expect(result.graphs.map((g) => (0, pick_1.default)(g, 'data'))).toEqual([
            {
                data: [
                    { y: 100, x: 1694908800000, label: '' },
                    { y: 200, x: 1694995200000, label: '' },
                ],
            },
        ]);
    });
});
