"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapUndefinedConfigToV1_1 = require("../v1/mapUndefinedConfigToV1");
describe('mapUndefinedConfigToV1', () => {
    it('should set "nulls" setting for y placeholder to connect, if it is ignore', () => {
        const config = {
            visualization: {
                placeholders: [
                    { id: 'y', settings: { nulls: 'ignore' } },
                    { id: 'y', settings: { nulls: 'ignore' } },
                ],
            },
            version: undefined,
        };
        const result = (0, mapUndefinedConfigToV1_1.mapUndefinedConfigToV1)(config);
        expect(result).toMatchObject({
            version: '1',
            visualization: {
                placeholders: [
                    { id: 'y', settings: { nulls: 'connect' } },
                    { id: 'y', settings: { nulls: 'connect' } },
                ],
            },
        });
    });
    it('should leave "nulls" setting for y  placeholder as it is, if it is not ignore', () => {
        const config = {
            visualization: {
                placeholders: [
                    { id: 'y', settings: { nulls: 'ignore' } },
                    { id: 'y', settings: { nulls: 'as-0' } },
                    { id: 'y', settings: { nulls: 'connect' } },
                ],
            },
            version: undefined,
        };
        const result = (0, mapUndefinedConfigToV1_1.mapUndefinedConfigToV1)(config);
        expect(result).toMatchObject({
            version: '1',
            visualization: {
                placeholders: [
                    { id: 'y', settings: { nulls: 'connect' } },
                    { id: 'y', settings: { nulls: 'as-0' } },
                    { id: 'y', settings: { nulls: 'connect' } },
                ],
            },
        });
    });
    it.each([{ version: undefined, visualization: { id: 'line' } }, { version: undefined }])('should return same config if placeholders does not exists', (config) => {
        const result = (0, mapUndefinedConfigToV1_1.mapUndefinedConfigToV1)(config);
        expect(result).toMatchObject({ ...config, version: '1' });
    });
});
