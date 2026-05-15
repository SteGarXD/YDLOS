"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const date_time_1 = require("../date-time");
describe('getUtcDateTime', function () {
    it.each([
        ['2022-09-01T09:00:00', '2022-09-01T09:00:00.000Z'],
        ['2022-09-01T09:00:00Z', '2022-09-01T09:00:00.000Z'],
    ])(`should return correct ISO string for: %s`, (input, result) => {
        var _a;
        expect((_a = (0, date_time_1.getUtcDateTime)(input)) === null || _a === void 0 ? void 0 : _a.toISOString()).toEqual(result);
    });
});
