"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const highcharts_1 = require("../highcharts");
const pie_mock_1 = require("./mocks/pie.mock");
describe('prepareHighchartsPie', () => {
    describe('ql', () => {
        test('should render simple pie correctly', () => {
            const result = (0, highcharts_1.prepareHighchartsPie)(pie_mock_1.piePrepareForQLArgs);
            expect(result).toEqual(pie_mock_1.piePrepareForQLResult);
        });
    });
});
