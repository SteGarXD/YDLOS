"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const v4_mock_1 = require("../mocks/v4.mock");
const mapV4ConfigToV5_1 = require("../v4/mapV4ConfigToV5");
describe('mapV4ConfigToV5', () => {
    it('Should extract field from hierarchy when sharedData.metaHierarchy exists', () => {
        const config = (0, v4_mock_1.getMockedV4Config)({
            visualizationId: 'flat-table',
            placeholders: [
                {
                    id: 'column',
                    items: [v4_mock_1.MOCKED_V4_HIERARCHY_FIELD],
                    settings: {},
                },
            ],
        });
        const result = (0, mapV4ConfigToV5_1.mapV4ConfigToV5)(config, v4_mock_1.MOCKED_SHARED_DATA);
        expect(result.visualization.placeholders[0].items[0]).toBeDefined();
        expect(result.visualization.placeholders[0].items[0].data_type).not.toEqual('hierarchy');
        expect(result.visualization.placeholders[0].items[0].guid).toEqual('field-1');
    });
    it("Should return hierarchy when sharedData.metaHierarchy doesn't exists", () => {
        const config = (0, v4_mock_1.getMockedV4Config)({
            visualizationId: 'flat-table',
            placeholders: [
                {
                    id: 'column',
                    items: [v4_mock_1.MOCKED_V4_HIERARCHY_FIELD],
                    settings: {},
                },
            ],
        });
        const result = (0, mapV4ConfigToV5_1.mapV4ConfigToV5)(config, undefined);
        expect(result.visualization.placeholders[0].items[0]).toBeDefined();
        expect(result.visualization.placeholders[0].items[0].data_type).toEqual('hierarchy');
        expect(result.visualization.placeholders[0].items[0].fields).toEqual([v4_mock_1.MOCKED_V4_FIELD]);
    });
    it('Should move dateMode setting to placeholder settings', () => {
        const config = (0, v4_mock_1.getMockedV4Config)({
            visualizationId: 'line',
            placeholders: [
                {
                    id: 'x',
                    items: [v4_mock_1.MOCKED_V4_FIELD_WITH_DATE_MODE],
                    settings: {},
                },
            ],
        });
        const result = (0, mapV4ConfigToV5_1.mapV4ConfigToV5)(config, undefined);
        expect(result.visualization.placeholders[0].settings).toEqual({ axisMode: 'discrete' });
        expect(result.visualization.placeholders[0].items[0].dateMode).not.toBeDefined();
    });
});
