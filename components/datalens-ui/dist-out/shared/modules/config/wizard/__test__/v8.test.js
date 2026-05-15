"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../../types");
const mapV8ConfigToV9_1 = require("../v8/mapV8ConfigToV9");
describe('mapV8ConfigToV9', () => {
    it('scatter: shapes should be set when dimension field exists in colors', () => {
        const colorField = {
            calc_mode: 'direct',
            datasetId: '',
            title: '',
            type: 'DIMENSION',
            guid: 'field-1',
            data_type: 'string',
        };
        const config = {
            colors: [colorField],
            datasetsIds: [],
            datasetsPartialFields: [],
            extraSettings: undefined,
            filters: [],
            hierarchies: [],
            labels: [],
            links: [],
            segments: [],
            shapes: [],
            sort: [],
            tooltips: [],
            type: 'datalens',
            updates: [],
            version: types_1.ChartsConfigVersion.V8,
            visualization: {
                id: 'scatter',
                placeholders: [],
            },
        };
        const result = (0, mapV8ConfigToV9_1.mapV8ConfigToV9)(config);
        expect(result.shapes).toEqual(config.colors);
    });
});
