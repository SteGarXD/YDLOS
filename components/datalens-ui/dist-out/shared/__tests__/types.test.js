"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
describe('wizard', () => {
    describe('versions', () => {
        it('enum should contains only string values', () => {
            const versions = Object.values(types_1.ChartsConfigVersion);
            for (const version of versions) {
                expect(typeof version).toBe('string');
            }
        });
    });
});
