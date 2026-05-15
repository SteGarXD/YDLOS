"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const formatUnit_1 = require("./formatUnit");
const i18n_1 = require("./i18n/i18n");
i18n_1.i18nInstance.setLang('en');
describe('chartkit/utils', () => {
    test.each([
        ['not-a-number', undefined, 'NaN'],
        [NaN, undefined, 'NaN'],
        ['0.2211556', undefined, '0.2211556'],
        ['0.2211556', { precision: 4 }, '0.2212'],
    ])('formatNumber (args: {value: %p, options: %p})', (value, options, expected) => {
        const result = (0, formatUnit_1.formatNumber)(value, options);
        expect(result).toEqual(expected);
    });
    test.each([
        [1, undefined, '#,##0'],
        [1000, undefined, '#,##0'],
        [1, { precision: 3 }, '#,##0.000'],
        [1, { format: 'percent' }, '#,##0%'],
        [1, { showRankDelimiter: false }, '###0'],
        [1000, { unit: 'k' }, '#,##0,"K"'],
        [1000, { unit: 'k', precision: 1 }, '#,##0.0,"K"'],
        [2319420, { unit: 'm', precision: 3 }, '#,##0.000,,"M"'],
    ])('getXlsxNumberFormat (args: {value: %p, options: %p})', (value, options, expected) => {
        const result = (0, formatUnit_1.getXlsxNumberFormat)(value, options);
        expect(result).toEqual(expected);
    });
});
