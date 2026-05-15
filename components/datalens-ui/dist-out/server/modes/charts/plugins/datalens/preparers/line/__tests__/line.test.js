"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const { regularTitle, calculatedTitle, preparingDataForFieldsWithSameTitlesFromDifferentDatasets, } = require('./mocks/bar.mock');
const { linesColoredByFieldWithPostfixArgs, linesColoredByFieldWithPostfixResult, } = require('./mocks/line.mock');
describe('linePrepare', () => {
    describe('bar', () => {
        test('should has regular title in case with one field in X section', () => {
            const result = (0, index_1.prepareHighchartsLine)(regularTitle);
            expect(result.graphs[0].legendTitle).toEqual('Sales');
        });
        test('should has calculated title in case with two fields in X section', () => {
            const result = (0, index_1.prepareHighchartsLine)(calculatedTitle);
            expect(result.graphs[0].legendTitle).toEqual('Sales: Central');
        });
        test('data of indicators with the same titles from different datasets', () => {
            const result = (0, index_1.prepareHighchartsLine)(preparingDataForFieldsWithSameTitlesFromDifferentDatasets);
            expect(result.graphs[0].data[0].y * 2).toEqual(result.graphs[1].data[0].y);
            expect(result.graphs[0].data[5].y * 2).toEqual(result.graphs[1].data[5].y);
        });
    });
    describe('line', () => {
        test('should apply colors and shapes to fields with prefixes/postfixes', () => {
            const result = (0, index_1.prepareHighchartsLine)(linesColoredByFieldWithPostfixArgs);
            expect(result).toEqual(linesColoredByFieldWithPostfixResult);
        });
    });
});
