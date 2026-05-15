"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const versions_1 = require("../../../../types/ql/versions");
const mapV1ConfigToV2_1 = require("../v2/mapV1ConfigToV2");
const mockedI18n = (_keyset, _key) => 'Query';
describe('mapV1ToV2Config', () => {
    it('should add queryName to all queries', () => {
        const config = {
            queries: [
                {
                    params: [],
                    value: 'test',
                    hidden: false,
                },
                {
                    params: [
                        { name: 'test-param', type: 'string', defaultValue: 'test-param-value' },
                    ],
                    value: 'test2',
                    hidden: true,
                },
                {
                    params: [],
                    value: 'test3',
                    hidden: true,
                },
            ],
            version: versions_1.QlConfigVersions.V1,
        };
        const result = (0, mapV1ConfigToV2_1.mapV1ConfigToV2)(config, mockedI18n);
        expect(result.queries).toEqual([
            {
                params: [],
                value: 'test',
                hidden: false,
                queryName: 'Query 1',
            },
            {
                params: [{ name: 'test-param', type: 'string', defaultValue: 'test-param-value' }],
                value: 'test2',
                hidden: true,
                queryName: 'Query 2',
            },
            {
                params: [],
                value: 'test3',
                hidden: true,
                queryName: 'Query 3',
            },
        ]);
    });
    it('should return same config with new version, if queries doesnt exists', () => {
        const config = {
            version: versions_1.QlConfigVersions.V1,
            visualization: { id: 'line' },
        };
        const result = (0, mapV1ConfigToV2_1.mapV1ConfigToV2)(config, mockedI18n);
        expect(result).toMatchObject({ ...config, version: '2' });
    });
});
