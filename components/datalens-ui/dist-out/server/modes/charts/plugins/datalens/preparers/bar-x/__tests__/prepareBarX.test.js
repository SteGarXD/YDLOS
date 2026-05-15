"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uniq_1 = __importDefault(require("lodash/uniq"));
const prepare_bar_x_1 = require("../prepare-bar-x");
const prepareBarX_mock_1 = require("./mocks/prepareBarX.mock");
describe('prepareBarX', () => {
    test('two fields in X section -> legendTitle should be constructed as "[X second field name]: [X second field value]"', () => {
        const options = (0, prepareBarX_mock_1.getPrepareFunctionArgs)({
            placeholders: [
                {
                    id: 'x',
                    items: [prepareBarX_mock_1.x1Field, prepareBarX_mock_1.x2Field],
                },
                {
                    id: 'y',
                    items: [prepareBarX_mock_1.yField],
                },
            ],
            resultData: {
                data: [
                    ['2023-05-11T00:00:00', 'A', '10'],
                    ['2023-05-11T00:00:00', 'B', '11'],
                    ['2023-05-11T00:00:00', 'A', '15'],
                    ['2023-05-11T00:00:00', 'B', '100'],
                ],
                order: [prepareBarX_mock_1.x1Field, prepareBarX_mock_1.x2Field, prepareBarX_mock_1.yField],
                totals: [],
            },
        });
        const result = (0, prepare_bar_x_1.prepareBarX)(options);
        const items = (0, uniq_1.default)(result.graphs.map((item) => item.legendTitle));
        expect(items).toEqual(['X2Field: A', 'X2Field: B']);
    });
    test('two fields in X section, second has date type -> legendTitle should be constructed with formatted date value"', () => {
        const options = (0, prepareBarX_mock_1.getPrepareFunctionArgs)({
            placeholders: [
                {
                    id: 'x',
                    items: [prepareBarX_mock_1.x2Field, prepareBarX_mock_1.x1Field],
                },
                {
                    id: 'y',
                    items: [prepareBarX_mock_1.yField],
                },
            ],
            resultData: {
                data: [['A', '2023-05-10T00:00:00', '10']],
                order: [prepareBarX_mock_1.x2Field, prepareBarX_mock_1.x1Field, prepareBarX_mock_1.yField],
                totals: [],
            },
        });
        const result = (0, prepare_bar_x_1.prepareBarX)(options);
        const items = (0, uniq_1.default)(result.graphs.map((item) => item.legendTitle));
        expect(items).toEqual(['X1Field: 10.05.2023']);
    });
    test('two fields in X section and filed in Colors section -> legendTitle should be constructed as "[Color field value]", series id must match the legend title', () => {
        const options = (0, prepareBarX_mock_1.getPrepareFunctionArgs)({
            placeholders: [
                {
                    id: 'x',
                    items: [prepareBarX_mock_1.x1Field, prepareBarX_mock_1.x2Field],
                },
                {
                    id: 'y',
                    items: [prepareBarX_mock_1.yField],
                },
            ],
            colors: [prepareBarX_mock_1.colorField],
            resultData: {
                data: [
                    ['2023-05-11T00:00:00', 'A', '10', 'Color-1'],
                    ['2023-05-11T00:00:00', 'B', '11', 'Color-1'],
                    ['2023-05-11T00:00:00', 'A', '15', 'Color-2'],
                    ['2023-05-11T00:00:00', 'B', '100', 'Color-2'],
                ],
                order: [prepareBarX_mock_1.x1Field, prepareBarX_mock_1.x2Field, prepareBarX_mock_1.yField, prepareBarX_mock_1.colorField],
                totals: [],
            },
        });
        const result = (0, prepare_bar_x_1.prepareBarX)(options);
        const legendTitles = (0, uniq_1.default)(result.graphs.map((item) => item.legendTitle));
        const seriesIds = (0, uniq_1.default)(result.graphs.map((item) => item.legendTitle));
        expect(legendTitles).toEqual(['Color-1', 'Color-2']);
        expect(seriesIds).toEqual(legendTitles);
    });
});
