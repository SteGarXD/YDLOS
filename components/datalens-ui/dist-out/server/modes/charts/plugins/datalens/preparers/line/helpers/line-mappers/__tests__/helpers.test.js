"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
describe('getColorShapeMappingValue', () => {
    const args = { shownTitle: 'field-1 [Group]', colorAndShapeKey: 'field-1' };
    const keys = ['shownTitle', 'colorAndShapeKey'];
    it.each(keys)('should return %s when mountedValues contains non auto value with that key', (key) => {
        const mountedValues = {
            [args[key]]: 'red',
        };
        const { shownTitle, colorAndShapeKey } = args;
        const result = (0, helpers_1.getColorShapeMappingValue)({ mountedValues, shownTitle, colorAndShapeKey });
        expect(result).toEqual(args[key]);
    });
    it.each(keys)('should return undefined when mountedValue is auto (%s)', (key) => {
        const mountedValues = {
            [args[key]]: 'auto',
        };
        const { shownTitle, colorAndShapeKey } = args;
        const result = (0, helpers_1.getColorShapeMappingValue)({ mountedValues, shownTitle, colorAndShapeKey });
        expect(result).toEqual(undefined);
    });
    it.each(['shownTitle', 'colorAndShapeKey'])("should return undefined when mountedValues doesn't contains the key (%s)", () => {
        const mountedValues = {};
        const { shownTitle, colorAndShapeKey } = args;
        const result = (0, helpers_1.getColorShapeMappingValue)({ mountedValues, shownTitle, colorAndShapeKey });
        expect(result).toEqual(undefined);
    });
});
