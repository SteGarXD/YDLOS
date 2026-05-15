"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../index"));
const metric_mock_1 = require("./mocks/metric.mock");
describe('prepareMetric', () => {
    describe('ql', () => {
        test('should render simple metric correctly', () => {
            const result = (0, index_1.default)(metric_mock_1.metricPrepareForQLArgs);
            expect(result).toEqual(metric_mock_1.metricPrepareForQLResult);
        });
    });
});
