"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const merge_1 = __importDefault(require("lodash/merge"));
const highcharts_1 = require("../highcharts");
const prepare_scatter_1 = require("../prepare-scatter");
const scatter_mock_1 = require("./mocks/scatter.mock");
function getPrepareFunctionArgs(options = {}) {
    return (0, merge_1.default)((0, cloneDeep_1.default)(scatter_mock_1.scatterPrepareBaseArgs), options);
}
describe('prepareScatter', () => {
    test('should set default marker symbol and color when Shapes and Colors sections is empty', () => {
        const options = getPrepareFunctionArgs();
        const result = (0, prepare_scatter_1.prepareScatter)(options);
        const items = result.graphs.map((item) => ({ marker: item.marker, color: item.color }));
        expect(items).toEqual([
            {
                color: 'blue',
                marker: {
                    symbol: 'circle',
                },
            },
        ]);
    });
    test("should set default marker symbols and different colors when Shapes is empty and Colors isn't empty", () => {
        const options = getPrepareFunctionArgs({
            colors: [scatter_mock_1.colorField],
        });
        const result = (0, prepare_scatter_1.prepareScatter)(options);
        const items = result.graphs.map((item) => ({ marker: item.marker, color: item.color }));
        expect(items).toEqual([
            {
                color: 'blue',
                marker: {
                    symbol: 'circle',
                },
            },
            {
                color: 'red',
                marker: {
                    symbol: 'circle',
                },
            },
        ]);
    });
    test("should set different marker symbols and default color when Colors is empty and Shapes isn't empty", () => {
        const options = getPrepareFunctionArgs({
            shapes: [scatter_mock_1.shapeField],
        });
        const result = (0, prepare_scatter_1.prepareScatter)(options);
        const items = result.graphs.map((item) => ({ marker: item.marker, color: item.color }));
        expect(items).toEqual([
            {
                color: 'blue',
                marker: {
                    symbol: 'circle',
                },
            },
            {
                color: 'blue',
                marker: {
                    symbol: 'diamond',
                },
            },
        ]);
    });
    test("should set different marker symbols and colors when Colors and Shapes aren't empty", () => {
        const options = getPrepareFunctionArgs({
            colors: [scatter_mock_1.colorField],
            shapes: [scatter_mock_1.shapeField],
        });
        const result = (0, prepare_scatter_1.prepareScatter)(options);
        const items = result.graphs.map((item) => ({ marker: item.marker, color: item.color }));
        expect(items).toEqual([
            {
                color: 'blue',
                marker: {
                    symbol: 'circle',
                },
            },
            {
                color: 'blue',
                marker: {
                    symbol: 'diamond',
                },
            },
            {
                color: 'red',
                marker: {
                    symbol: 'circle',
                },
            },
            {
                color: 'red',
                marker: {
                    symbol: 'diamond',
                },
            },
        ]);
    });
    test("should set mounted marker symbols when shapeConfig isn't empty", () => {
        const options = getPrepareFunctionArgs({
            shapes: [scatter_mock_1.shapeField],
            shapesConfig: {
                mountedShapes: {
                    'Shape-1': 'square',
                    'Shape-2': 'triangle-down',
                },
            },
        });
        const result = (0, prepare_scatter_1.prepareScatter)(options);
        const items = result.graphs.map((item) => ({ marker: item.marker, name: item.name }));
        expect(items).toEqual([
            {
                name: 'Shape-1',
                marker: {
                    symbol: 'square',
                },
            },
            {
                name: 'Shape-2',
                marker: {
                    symbol: 'triangle-down',
                },
            },
        ]);
    });
});
describe('prepareHighchartsScatter', () => {
    describe('ql', () => {
        test('should render simple scatter correctly', () => {
            const result = (0, highcharts_1.prepareHighchartsScatter)(scatter_mock_1.scatterPrepareForQLArgs);
            expect(result).toEqual(scatter_mock_1.scatterPrepareForQLResult);
        });
    });
});
