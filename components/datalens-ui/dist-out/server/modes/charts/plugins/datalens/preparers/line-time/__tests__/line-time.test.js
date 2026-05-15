"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const line_time_mock_1 = require("./mocks/line-time.mock");
describe('linetimePrepare', () => {
    describe('monitoring', () => {
        test('monitoring chart with 4 queries should be rendered correctly', () => {
            const result = (0, index_1.default)(line_time_mock_1.options);
            expect(result).toEqual(line_time_mock_1.expectedResult);
        });
    });
});
