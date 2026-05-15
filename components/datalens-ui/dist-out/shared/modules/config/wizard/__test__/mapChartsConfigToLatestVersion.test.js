"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../../types");
const mapChartsConfigToLatestVersion_1 = require("../mapChartsConfigToLatestVersion");
describe('mapChartsConfigToLatestVersion', () => {
    // it is necessary to fix the conversion to string, because version 8 was mistakenly a number
    it('should cast number version to string', () => {
        const mockedConfigWithNumericVersion = { version: 8 };
        const result = (0, mapChartsConfigToLatestVersion_1.mapChartsConfigToLatestVersion)(mockedConfigWithNumericVersion);
        expect(result).toEqual({ version: types_1.ChartsConfigVersion.V14 });
    });
});
