"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const versions_1 = require("../../../../types/ql/versions");
const mapQlConfigToLatestVersion_1 = require("../mapQlConfigToLatestVersion");
describe('mapQlConfigToLatestVersion', () => {
    it('should return config of the latest version', () => {
        const versions = Object.values(versions_1.QlConfigVersions);
        const latest = versions[versions.length - 1];
        const config = {};
        const latestConfig = (0, mapQlConfigToLatestVersion_1.mapQlConfigToLatestVersion)(config, { i18n: jest.fn() });
        expect(latestConfig.version).toEqual(latest);
    });
    it('should use only string versions', () => {
        const versions = Object.values(versions_1.QlConfigVersions);
        for (const version of versions) {
            expect(typeof version).toBe('string');
        }
    });
});
