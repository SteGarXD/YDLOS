"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV2ConfigToV3 = void 0;
const versions_1 = require("../../../../types/ql/versions");
const mapV2ConfigToV3 = (config) => {
    return {
        ...config,
        colors: config.colors || [],
        labels: config.labels || [],
        shapes: config.shapes || [],
        tooltips: config.tooltips || [],
        version: versions_1.QlConfigVersions.V3,
    };
};
exports.mapV2ConfigToV3 = mapV2ConfigToV3;
