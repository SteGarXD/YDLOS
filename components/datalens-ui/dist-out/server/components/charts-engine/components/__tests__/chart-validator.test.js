"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chart_validator_1 = require("../chart-validator");
const chart_validator_2 = require("./mocks/chart-validator");
describe('Charts Engine chartValidator', () => {
    test.each([...chart_validator_2.validDataChunks])('should return true %j', (data) => {
        expect(chart_validator_1.chartValidator.validate(data)).toBeTruthy();
    });
});
