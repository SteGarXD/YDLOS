"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const { flatTableFormattingIntPrecisionArgs, flatTableFormattingFloatPrecisionArgs, flatTablePrepareWithTotalsArgs, } = require('./mocks/flat-table.mock');
describe('prepareFlatTable', () => {
    describe('common', () => {
        test('should not use precision for integer cell', () => {
            var _a, _b;
            const result = (0, index_1.default)(flatTableFormattingIntPrecisionArgs);
            const precision = (_b = (_a = result.head[0]) === null || _a === void 0 ? void 0 : _a.formatter) === null || _b === void 0 ? void 0 : _b.precision;
            expect(precision).toEqual(undefined);
        });
        test('should use provided precision for float cell', () => {
            var _a, _b;
            const result = (0, index_1.default)(flatTableFormattingFloatPrecisionArgs);
            const precision = (_b = (_a = result.head[0]) === null || _a === void 0 ? void 0 : _a.formatter) === null || _b === void 0 ? void 0 : _b.precision;
            expect(precision).toEqual(1);
        });
        test('should ignore totals when empty string', () => {
            const result = (0, index_1.default)(flatTablePrepareWithTotalsArgs);
            const totals = result.footer;
            const expectedTotals = [
                {
                    cells: [
                        {
                            value: 'Total',
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                            type: 'text',
                        },
                        {
                            value: '',
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                        {
                            value: '',
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                        {
                            value: 4500,
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                        {
                            value: 4017.8571428571427,
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                        {
                            value: '',
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                        {
                            value: '',
                            css: {
                                'background-color': 'var(--g-color-base-generic)',
                                'font-weight': 500,
                            },
                        },
                    ],
                },
            ];
            expect(totals).toEqual(expectedTotals);
        });
    });
});
