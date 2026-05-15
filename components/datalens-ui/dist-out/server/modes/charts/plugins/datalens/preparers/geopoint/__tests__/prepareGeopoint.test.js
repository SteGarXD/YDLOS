"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const merge_1 = __importDefault(require("lodash/merge"));
const constants_1 = require("../constants");
const index_1 = __importDefault(require("../index"));
const geopoints_mock_1 = require("./mocks/geopoints.mock");
function getPrepareFunctionArgs(options = {}) {
    return (0, merge_1.default)((0, cloneDeep_1.default)(geopoints_mock_1.PREPARE_FUNCTION_ARGS), options);
}
describe('prepareGeopoint', () => {
    test('Color field is empty: should use default color', () => {
        var _a;
        const options = getPrepareFunctionArgs({
            colors: [],
            resultData: {
                data: [
                    ['[43.2050370,76.6612660]'],
                    ['[43.2050370,76.6612660]'],
                    ['[40.2050370,76.6612660]'],
                    [null],
                ],
                order: [geopoints_mock_1.COORDINATES_FIELD],
            },
        });
        const result = (0, index_1.default)(options);
        const points = result
            .map((item) => item.collection.children)
            .flat(2);
        const pointColors = points.map((point) => ({ iconColor: point.options.iconColor }));
        expect(pointColors).toEqual([
            { iconColor: constants_1.DEFAULT_ICON_COLOR },
            { iconColor: constants_1.DEFAULT_ICON_COLOR },
            { iconColor: constants_1.DEFAULT_ICON_COLOR },
        ]);
        expect((_a = result[0].options) === null || _a === void 0 ? void 0 : _a.colorDictionary).not.toBeDefined();
    });
    test('Colorize by dimension, colorsConfig empty: should use different colors', () => {
        var _a;
        const options = getPrepareFunctionArgs({
            colors: [geopoints_mock_1.DIMENSION_COLOR_FIELD],
            colorsConfig: {},
            resultData: {
                data: [
                    ['[43.2050370,76.6612660]', 'Color1'],
                    ['[42.2050370,76.6612660]', 'Color2'],
                    ['[41.2050370,76.6612660]', 'Color3'],
                    [null, null],
                ],
                order: [geopoints_mock_1.COORDINATES_FIELD, geopoints_mock_1.DIMENSION_COLOR_FIELD],
            },
        });
        const result = (0, index_1.default)(options);
        const points = result
            .map((item) => item.collection.children)
            .flat(2);
        const pointColors = points.map((point) => ({ iconColor: point.options.iconColor }));
        expect(pointColors).toEqual([
            { iconColor: 'defaultColor' },
            { iconColor: 'blue' },
            { iconColor: 'red' },
        ]);
        expect((_a = result[0].options) === null || _a === void 0 ? void 0 : _a.colorDictionary).toEqual({
            Color1: 'defaultColor',
            Color2: 'blue',
            Color3: 'red',
        });
    });
    test('Colorize by dimension, colorsConfig not empty: should use different colors for same coordinates, different color values', () => {
        var _a;
        const options = getPrepareFunctionArgs({
            colors: [geopoints_mock_1.DIMENSION_COLOR_FIELD],
            colorsConfig: {
                fieldGuid: geopoints_mock_1.DIMENSION_COLOR_FIELD.guid,
                mountedColors: {
                    Color1: '2',
                    Color2: '1',
                },
            },
            resultData: {
                data: [
                    ['[43.2050370,76.6612660]', 'Color1'],
                    ['[43.2050370,76.6612660]', 'Color2'],
                    ['[43.2050370,76.6612660]', 'Color3'],
                    [null, null],
                ],
                order: [geopoints_mock_1.COORDINATES_FIELD, geopoints_mock_1.DIMENSION_COLOR_FIELD],
            },
        });
        const result = (0, index_1.default)(options);
        const points = result
            .map((item) => item.collection.children)
            .flat(2);
        const pointColors = points.map((point) => ({ iconColor: point.options.iconColor }));
        expect(pointColors).toEqual([
            { iconColor: 'red' },
            { iconColor: 'blue' },
            { iconColor: 'defaultColor' },
        ]);
        expect((_a = result[0].options) === null || _a === void 0 ? void 0 : _a.colorDictionary).toEqual({
            Color1: 'red',
            Color2: 'blue',
            Color3: 'defaultColor',
        });
    });
    test('Colorize by measure: should use different colors for same coordinates, different color values', () => {
        const options = getPrepareFunctionArgs({
            colors: [geopoints_mock_1.MEASURE_COLOR_FIELD],
            colorsConfig: {
                gradientMode: '2-point',
                gradientPalette: 'blue',
                gradientColors: ['#0044A3', '#8CCBFF'],
            },
            resultData: {
                data: [
                    ['[40.2050370,76.6612660]', '1'],
                    ['[40.2050370,76.6612660]', '10.0'],
                ],
                order: [geopoints_mock_1.COORDINATES_FIELD, geopoints_mock_1.MEASURE_COLOR_FIELD],
            },
        });
        const result = (0, index_1.default)(options);
        const points = result
            .map((item) => item.collection.children)
            .flat(2);
        const pointColors = points.map((point) => ({
            iconColor: point.options.iconColor.replace(/[ \n]+/g, ''),
        }));
        const gradientColor1 = 'rgb(0,68,163)';
        const gradientColor2 = 'rgb(140,203,255)';
        expect(pointColors).toEqual([
            {
                iconColor: gradientColor1,
            },
            {
                iconColor: gradientColor2,
            },
        ]);
    });
});
