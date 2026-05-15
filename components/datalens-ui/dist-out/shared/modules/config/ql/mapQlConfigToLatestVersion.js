"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapQlConfigToLatestVersion = void 0;
const versions_1 = require("../../../types/ql/versions");
const mapUndefinedConfigToV1_1 = require("./v1/mapUndefinedConfigToV1");
const mapV1ConfigToV2_1 = require("./v2/mapV1ConfigToV2");
const mapV2ConfigToV3_1 = require("./v3/mapV2ConfigToV3");
const mapV3ConfigToV4_1 = require("./v4/mapV3ConfigToV4");
const mapV4ConfigToV5_1 = require("./v5/mapV4ConfigToV5");
const mapV5ConfigToV6_1 = require("./v6/mapV5ConfigToV6");
const mapQlConfigToLatestVersion = (extendedConfig, { i18n }) => {
    let config = extendedConfig;
    if (typeof config.version === 'undefined') {
        config = (0, mapUndefinedConfigToV1_1.mapUndefinedConfigToV1)(config);
    }
    if (config.version === versions_1.QlConfigVersions.V1) {
        config = (0, mapV1ConfigToV2_1.mapV1ConfigToV2)(config, i18n);
    }
    if (config.version === versions_1.QlConfigVersions.V2) {
        config = (0, mapV2ConfigToV3_1.mapV2ConfigToV3)(config);
    }
    if (config.version === versions_1.QlConfigVersions.V3) {
        config = (0, mapV3ConfigToV4_1.mapV3ConfigToV4)(config);
    }
    if (config.version === versions_1.QlConfigVersions.V4) {
        config = (0, mapV4ConfigToV5_1.mapV4ConfigToV5)(config);
    }
    if (config.version === versions_1.QlConfigVersions.V5) {
        config = (0, mapV5ConfigToV6_1.mapV5ConfigToV6)(config);
    }
    return config;
};
exports.mapQlConfigToLatestVersion = mapQlConfigToLatestVersion;
