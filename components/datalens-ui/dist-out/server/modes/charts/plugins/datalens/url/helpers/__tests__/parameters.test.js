"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parameters_1 = require("../parameters");
describe('mapItemToPayloadParameter', () => {
    it('integer parameter with a default value of 0', () => {
        const integerParameter = {
            guid: 'guid',
            default_value: 0,
        };
        const result = (0, parameters_1.mapItemToPayloadParameter)(integerParameter);
        expect(result).toEqual({
            id: 'guid',
            value: 0,
        });
    });
    it('boolean parameter with a default value of false', () => {
        const integerParameter = {
            guid: 'guid',
            default_value: false,
        };
        const result = (0, parameters_1.mapItemToPayloadParameter)(integerParameter);
        expect(result).toEqual({
            id: 'guid',
            value: false,
        });
    });
});
