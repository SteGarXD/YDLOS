"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geo_helpers_1 = require("../geo-helpers");
describe('getMapBounds', () => {
    it('It should return 2 arrays for the leftmost lower and rightmost upper points on the map', () => {
        const coordinates = [
            [11, 120],
            [-10, 25],
            [-30, 10],
            [40, -50],
        ];
        const expectedBounds = [
            [-30, -50],
            [40, 120],
        ];
        let leftBounds, rightBounds;
        coordinates.forEach((currentCoords) => {
            [leftBounds, rightBounds] = (0, geo_helpers_1.getMapBounds)({
                current: currentCoords,
                rightTop: rightBounds,
                leftBot: leftBounds,
            });
        });
        expect([leftBounds, rightBounds]).toEqual(expectedBounds);
    });
    it('If there is a coordinate at the south pole and its latitude value is less than -85, then -85 is returned, since this is the last coordinate for Yandex Maps', () => {
        const coordinates = [
            [-89, 132],
            [21, 30],
            [40, 65],
        ];
        const expectedBounds = [
            [-85, 30],
            [40, 132],
        ];
        let leftBounds, rightBounds;
        coordinates.forEach((currentCoords) => {
            [leftBounds, rightBounds] = (0, geo_helpers_1.getMapBounds)({
                current: currentCoords,
                rightTop: rightBounds,
                leftBot: leftBounds,
            });
        });
        expect([leftBounds, rightBounds]).toEqual(expectedBounds);
    });
});
