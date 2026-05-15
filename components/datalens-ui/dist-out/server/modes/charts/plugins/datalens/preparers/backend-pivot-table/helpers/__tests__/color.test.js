"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const color_1 = require("../color");
const color_mock_1 = require("./mocks/color.mock");
describe('getCurrentRowColorValues', () => {
    it('Should return null|number array for currentRow', () => {
        const result = (0, color_1.getCurrentRowColorValues)(color_mock_1.MOCKED_PIVOT_DATA_ROWS[0], color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP);
        expect(result).toEqual([90402, 2120777]);
    });
    it('Should return null if cell is falsy value', () => {
        const result = (0, color_1.getCurrentRowColorValues)(color_mock_1.MOCKED_PIVOT_DATA_ROWS_WITH_EMPTY_CELL[0], color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP);
        expect(result).toEqual([425.23, null]);
    });
    it('Should return null when annotation is not found', () => {
        const result = (0, color_1.getCurrentRowColorValues)(color_mock_1.MOCKED_PIVOT_DATA_ROWS[0], {});
        expect(result).toEqual([null, null]);
    });
    it('Should return null when colorValue is invalid', () => {
        const result = (0, color_1.getCurrentRowColorValues)(color_mock_1.MOCKED_PIVOT_DATA_ROWS_WITH_INVALID_VALUES[0], color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP);
        expect(result).toEqual([4205.45, null, null, null, null, null]);
    });
});
describe('getColorSettings', () => {
    it('Should return colorValues null|number array with min and max values from pivot rows', () => {
        const result = (0, color_1.getColorSettings)({
            rows: color_mock_1.MOCKED_PIVOT_DATA_ROWS,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        const expectedColorValues = [
            [90402, 2120777],
            [5555, 142023],
            [156, 4748],
        ];
        expect(result.colorValues).toEqual(expectedColorValues);
        expect(result.min).toEqual(156);
        expect(result.max).toEqual(2120777);
    });
    it('Should return undefined when rows are empty', () => {
        const result = (0, color_1.getColorSettings)({
            rows: [],
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(result).toBeUndefined();
    });
    it('Should return null in row array if data is not valid: [undefined, null, ""]', () => {
        const result = (0, color_1.getColorSettings)({
            rows: color_mock_1.MOCKED_PIVOT_DATA_ROWS_WITH_FALSY_VALUES,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(result.colorValues).toEqual([[null, null, null]]);
    });
    it('Should return 0 as min and max when all data is not valid: [undefined, null, ""]', () => {
        const result = (0, color_1.getColorSettings)({
            rows: color_mock_1.MOCKED_PIVOT_DATA_ROWS_WITH_FALSY_VALUES,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(result.min).toEqual(0);
        expect(result.max).toEqual(0);
    });
});
describe('colorizePivotTableByColorField', () => {
    let PIVOT_ROWS = [];
    beforeEach(() => {
        // cloning the object for each test because colorizePivotTableByColorField mutate the rows
        PIVOT_ROWS = (0, cloneDeep_1.default)(color_mock_1.MOCKED_PIVOT_ROWS);
    });
    it('Should return cells with css property', () => {
        (0, color_1.colorizePivotTableByColorField)({
            rows: PIVOT_ROWS,
            colorsConfig: color_mock_1.MOCKED_PIVOT_COLORS_CONFIG,
            colors: color_mock_1.MOCKED_COLORS_FIELDS,
            rowHeaderLength: 1,
            rowsData: color_mock_1.MOCKED_PIVOT_DATA_ROWS,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(PIVOT_ROWS).toStrictEqual([
            {
                cells: [
                    {
                        id: 0,
                        isTotalCell: false,
                        value: 'Australia',
                    },
                    {
                        css: {
                            backgroundColor: 'rgb(5, 73, 166)',
                            color: '#000000',
                            value: 90402,
                        },
                        formattedValue: '657,06',
                        id: 1,
                        value: 657.058,
                    },
                    {
                        css: {
                            backgroundColor: 'rgb(140, 203, 255)',
                            color: '#000000',
                            value: 2120777,
                        },
                        formattedValue: '2 901,74',
                        id: 2,
                        value: 2901.739000000002,
                    },
                ],
            },
            {
                cells: [
                    {
                        id: 3,
                        isTotalCell: false,
                        value: 'Austria',
                    },
                    {
                        css: {
                            backgroundColor: 'rgb(0, 68, 163)',
                            color: '#000000',
                            value: 5555,
                        },
                        formattedValue: '7,89',
                        id: 4,
                        value: 7.891,
                    },
                    {
                        css: {
                            backgroundColor: 'rgb(9, 77, 169)',
                            color: '#000000',
                            value: 142023,
                        },
                        formattedValue: '661,35',
                        id: 5,
                        value: 661.3510000000002,
                    },
                ],
            },
        ]);
    });
    it('Should not mutate rows when colors is empty', () => {
        (0, color_1.colorizePivotTableByColorField)({
            rows: PIVOT_ROWS,
            colorsConfig: color_mock_1.MOCKED_PIVOT_COLORS_CONFIG,
            colors: [],
            rowHeaderLength: 1,
            rowsData: color_mock_1.MOCKED_PIVOT_DATA_ROWS,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(PIVOT_ROWS).toEqual(color_mock_1.MOCKED_PIVOT_ROWS);
    });
    it('Should not mutate rows when colors are Measure Names', () => {
        (0, color_1.colorizePivotTableByColorField)({
            rows: PIVOT_ROWS,
            colorsConfig: color_mock_1.MOCKED_PIVOT_COLORS_CONFIG,
            colors: color_mock_1.MOCKED_COLORS_FIELDS_MEASURE_NAME,
            rowHeaderLength: 1,
            rowsData: color_mock_1.MOCKED_PIVOT_DATA_ROWS,
            annotationsMap: color_mock_1.MOCKED_PIVOT_ANNOTATIONS_MAP,
        });
        expect(PIVOT_ROWS).toEqual(color_mock_1.MOCKED_PIVOT_ROWS);
    });
    it('Should not mutate rows when colorsSettings is undefined', () => {
        (0, color_1.colorizePivotTableByColorField)({
            rows: PIVOT_ROWS,
            colorsConfig: color_mock_1.MOCKED_PIVOT_COLORS_CONFIG,
            colors: [],
            rowHeaderLength: 1,
            rowsData: color_mock_1.MOCKED_PIVOT_DATA_ROWS,
            annotationsMap: {},
        });
        expect(PIVOT_ROWS).toEqual(color_mock_1.MOCKED_PIVOT_ROWS);
    });
});
