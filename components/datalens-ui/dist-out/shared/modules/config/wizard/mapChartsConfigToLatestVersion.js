"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapChartsConfigToLatestVersion = void 0;
const types_1 = require("../../../types");
const mapV1ConfigToV2_1 = require("./v1/mapV1ConfigToV2");
const mapV10ConfigToV11_1 = require("./v10/mapV10ConfigToV11");
const mapV11ConfigToV12_1 = require("./v11/mapV11ConfigToV12");
const mapV12ConfigToV13_1 = require("./v12/mapV12ConfigToV13");
const mapV13ConfigToV14_1 = require("./v13/mapV13ConfigToV14");
const mapV2ConfigToV3_1 = require("./v2/mapV2ConfigToV3");
const mapV3ConfigToV4_1 = require("./v3/mapV3ConfigToV4");
const mapV4ConfigToV5_1 = require("./v4/mapV4ConfigToV5");
const mapV5ConfigToV6_1 = require("./v5/mapV5ConfigToV6");
const mapV6ConfigToV7_1 = require("./v6/mapV6ConfigToV7");
const mapV7ConfigToV8_1 = require("./v7/mapV7ConfigToV8");
const mapV8ConfigToV9_1 = require("./v8/mapV8ConfigToV9");
const mapV9ConfigToV10_1 = require("./v9/mapV9ConfigToV10");
const mapChartsConfigToLatestVersion = (extendedConfig, options = {}) => {
    let config = extendedConfig;
    // CHARTS-7601
    // version 8 of the config mistakenly became a number instead of a string
    // in order to maintain consistency, cast all non string versions into string
    if (typeof config.version !== 'undefined') {
        config.version = String(config.version);
    }
    if (config.version === types_1.ChartsConfigVersion.V1 || typeof config.version === 'undefined') {
        config = (0, mapV1ConfigToV2_1.mapV1ConfigToV2)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V2) {
        config = (0, mapV2ConfigToV3_1.mapV2ConfigToV3)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V3) {
        config = (0, mapV3ConfigToV4_1.mapV3ConfigToV4)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V4) {
        (0, mapV3ConfigToV4_1.migrateDatetime)(config);
        config = (0, mapV4ConfigToV5_1.mapV4ConfigToV5)(config, options.sharedData);
    }
    if (config.version === types_1.ChartsConfigVersion.V5) {
        config = (0, mapV5ConfigToV6_1.mapV5ConfigToV6)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V6) {
        config = (0, mapV6ConfigToV7_1.mapV6ConfigToV7)(config, options.sharedData);
    }
    if (config.version === types_1.ChartsConfigVersion.V7) {
        config = (0, mapV7ConfigToV8_1.mapV7ConfigToV8)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V8) {
        config = (0, mapV8ConfigToV9_1.mapV8ConfigToV9)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V9) {
        config = (0, mapV9ConfigToV10_1.mapV9ConfigToV10)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V10) {
        config = (0, mapV10ConfigToV11_1.mapV10ConfigToV11)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V11) {
        config = (0, mapV11ConfigToV12_1.mapV11ConfigToV12)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V12) {
        config = (0, mapV12ConfigToV13_1.mapV12ConfigToV13)(config);
    }
    if (config.version === types_1.ChartsConfigVersion.V13) {
        config = (0, mapV13ConfigToV14_1.mapV13ConfigToV14)(config);
    }
    return config;
};
exports.mapChartsConfigToLatestVersion = mapChartsConfigToLatestVersion;
