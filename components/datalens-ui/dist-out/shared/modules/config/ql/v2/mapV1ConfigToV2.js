"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV1ConfigToV2 = void 0;
const versions_1 = require("../../../../types/ql/versions");
const mapV1ConfigToV2 = (config, i18n) => {
    if (!config.queries) {
        return {
            ...config,
            version: versions_1.QlConfigVersions.V2,
        };
    }
    const mapQuery = (query, index) => {
        return {
            ...query,
            queryName: `${i18n('sql', 'label_query')} ${index + 1}`,
        };
    };
    return {
        ...config,
        version: versions_1.QlConfigVersions.V2,
        queries: config.queries.map(mapQuery),
    };
};
exports.mapV1ConfigToV2 = mapV1ConfigToV2;
