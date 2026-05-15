"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../../../shared");
const getSegmentsYAxis_1 = require("../segments/getSegmentsYAxis");
describe('getSegmentsYAxis', () => {
    it('The position of a segment(top) depends on its index', () => {
        const segmentsMap = {
            a: { index: 1, title: 'a', isOpposite: false },
            b: { index: 0, title: 'b', isOpposite: false },
        };
        const actual = (0, getSegmentsYAxis_1.getSegmentsYAxis)({
            segmentsMap,
            placeholders: {},
            visualizationId: shared_1.WizardVisualizationId.Column,
        }).yAxisSettings.map((s) => {
            var _a;
            return ({
                top: s.top,
                title: (_a = s.title) === null || _a === void 0 ? void 0 : _a.text,
            });
        });
        expect(actual).toEqual([
            { top: '0%', title: 'b' },
            { top: '52%', title: 'a' },
        ]);
    });
});
