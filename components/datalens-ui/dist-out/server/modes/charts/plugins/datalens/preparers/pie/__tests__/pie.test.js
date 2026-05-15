"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prepare_pie_data_1 = require("../prepare-pie-data");
const pie_mock_1 = require("./mocks/pie.mock");
describe('preparePie', () => {
    test('dimension + measure: colorizing', () => {
        var _a;
        const options = (0, pie_mock_1.getPrepareFunctionArgs)(pie_mock_1.piePrepareBaseArgs);
        const result = (0, prepare_pie_data_1.preparePieData)(options);
        const items = (_a = result.graphs[0].data) === null || _a === void 0 ? void 0 : _a.map((item) => ({
            colorValue: item.colorValue,
            color: item.color,
        }));
        expect(items).toEqual([
            { color: '#4DA2F1', colorValue: '2' },
            { color: '#FF3D64', colorValue: '1' },
        ]);
    });
    test('measure number + measure: colorizing', () => {
        var _a;
        const options = (0, pie_mock_1.getPrepareFunctionArgs)(pie_mock_1.measureNumberAndMeasure);
        const result = (0, prepare_pie_data_1.preparePieData)(options);
        const items = (_a = result.graphs[0].data) === null || _a === void 0 ? void 0 : _a.map((item) => ({
            colorValue: item.colorValue,
            color: item.color,
        }));
        expect(items).toEqual([
            {
                color: 'rgb(157, 106, 228)',
                colorValue: 2,
            },
        ]);
    });
    test('Fractional values in the "Color" section: the colors specified by the user are used', () => {
        var _a;
        const options = (0, pie_mock_1.getPrepareFunctionArgs)({
            placeholders: [{ items: [pie_mock_1.colorFieldDimensionFloat] }],
            resultData: {
                data: [
                    ['2.0', '3'],
                    ['0.5', '2'],
                    ['1.0', '1'],
                ],
                order: [pie_mock_1.colorFieldDimensionFloat, pie_mock_1.measureField],
                totals: [],
            },
            colorsConfig: {
                fieldGuid: pie_mock_1.colorFieldDimensionFloat.guid,
                availablePalettes: {
                    custom: { id: 'custom', scheme: ['color_0.5', 'color_1.0', 'color_2.0'] },
                },
                palette: 'custom',
                mountedColors: {
                    '0.5': '0',
                    '1.0': '1',
                    '2.0': '2',
                },
            },
        });
        const result = (0, prepare_pie_data_1.preparePieData)(options);
        const items = (_a = result.graphs[0].data) === null || _a === void 0 ? void 0 : _a.map((item) => item.color);
        expect(items).toEqual(['color_2.0', 'color_0.5', 'color_1.0']);
    });
    test('measure text + measure: colorizing', () => {
        var _a;
        const options = (0, pie_mock_1.getPrepareFunctionArgs)(pie_mock_1.measureTextAndMeasure);
        const result = (0, prepare_pie_data_1.preparePieData)(options);
        const items = (_a = result.graphs[0].data) === null || _a === void 0 ? void 0 : _a.map((item) => ({
            colorValue: item.colorValue,
            color: item.color,
        }));
        expect(items).toEqual([
            { color: '#4DA2F1', colorValue: '2' },
            { color: '#FF3D64', colorValue: '1' },
        ]);
    });
});
