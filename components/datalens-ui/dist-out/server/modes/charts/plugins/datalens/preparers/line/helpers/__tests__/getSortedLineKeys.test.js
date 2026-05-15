"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getSortedLineKeys_1 = require("../getSortedLineKeys");
describe('sortLineKeysByFirstValues', () => {
    const initialLines = [
        {
            Technology: {
                data: {
                    0: { value: 120 },
                    1: { value: -150 },
                    2: { value: 230 },
                },
            },
            'Office Supplies': {
                data: {
                    0: { value: 320 },
                    1: { value: 500 },
                    2: { value: 120 },
                },
            },
            Furniture: {
                data: {
                    0: { value: -120 },
                    1: { value: 12150 },
                    2: { value: 4 },
                },
            },
        },
    ];
    const categories = [0, 1, 2];
    let lineKeys;
    beforeEach(() => {
        lineKeys = initialLines.map((line) => Object.keys(line));
    });
    it('Should sort line keys by first value in each series in ASC order', () => {
        lineKeys.forEach((lk, index) => {
            (0, getSortedLineKeys_1.sortLineKeysByFirstValues)(lk, index, {
                lines: initialLines,
                categories,
                sortItemDirection: 'ASC',
            });
        });
        expect(lineKeys).toEqual([['Furniture', 'Technology', 'Office Supplies']]);
    });
    it('Should sort line keys by first value in each series in DESC order', () => {
        lineKeys.forEach((lk, index) => {
            (0, getSortedLineKeys_1.sortLineKeysByFirstValues)(lk, index, {
                lines: initialLines,
                categories,
                sortItemDirection: 'DESC',
            });
        });
        expect(lineKeys).toEqual([['Office Supplies', 'Technology', 'Furniture']]);
    });
});
