"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const highcharts_1 = require("../highcharts");
const { barXColoringBaseArgs, barXColoringDimensionByGradientArgs, barXColoringDimensionByGradientResult, barXColoringDimensionByPaletteArgs, barXColoringDimensionByPaletteResult, barXPrepareForQLArgs, barXPrepareForQLResult, } = require('./mocks/prepareHighchartsBarX.mock');
describe('prepareHighchartsBarX', () => {
    describe('wizard', () => {
        describe('colors', () => {
            test('should prepare bar-x with coloring by gradient with dimension', () => {
                const result = (0, highcharts_1.prepareHighchartsBarX)({
                    ...barXColoringBaseArgs,
                    ...barXColoringDimensionByGradientArgs,
                });
                expect(result).toEqual(barXColoringDimensionByGradientResult);
            });
            test('should prepare bar-x with coloring by palette with dimension', () => {
                const result = (0, highcharts_1.prepareHighchartsBarX)({
                    ...barXColoringBaseArgs,
                    ...barXColoringDimensionByPaletteArgs,
                });
                expect(result).toEqual(barXColoringDimensionByPaletteResult);
            });
        });
    });
    describe('ql', () => {
        test('should render simple bar-x correctly', () => {
            const result = (0, highcharts_1.prepareHighchartsBarX)(barXPrepareForQLArgs);
            expect(result).toEqual(barXPrepareForQLResult);
        });
    });
});
