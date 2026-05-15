"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV1ConfigToV2 = void 0;
const index_1 = require("../../../../index");
const mapV1ConfigToV2 = (config) => {
    let datasetsPartialFields;
    let datasets;
    if (!config.datasets) {
        datasets = [config.dataset];
        datasetsPartialFields = [[...(config.dimensions || []), ...(config.measures || [])]];
    }
    else {
        datasets = config.datasets || [];
        datasetsPartialFields = (config.datasets || []).map((dataset) => {
            const schema = dataset.result_schema || dataset.dataset.result_schema || [];
            return schema.map((field) => ({
                guid: field.guid,
                title: field.title,
            }));
        });
    }
    const datasetsIds = (config.datasets || datasets).map((dataset) => dataset.id);
    const v2Config = {
        title: config.title || '',
        colors: config.colors || [],
        colorsConfig: config.colorsConfig || {},
        extraSettings: config.extraSettings || {},
        filters: config.filters || [],
        geopointsConfig: config.geopointsConfig || {},
        hierarchies: config.hierarchies || [],
        labels: config.labels || [],
        links: config.links || [],
        sort: config.sort || [],
        tooltips: config.tooltips || [],
        type: 'datalens',
        updates: config.updates || [],
        visualization: config.visualization,
        shapes: config.shapes || [],
        shapesConfig: config.shapesConfig || {},
        version: index_1.ChartsConfigVersion.V2,
        datasetsIds,
        datasetsPartialFields,
    };
    return v2Config;
};
exports.mapV1ConfigToV2 = mapV1ConfigToV2;
