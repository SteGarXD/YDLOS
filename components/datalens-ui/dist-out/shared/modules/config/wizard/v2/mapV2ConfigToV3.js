"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV2ConfigToV3 = void 0;
const types_1 = require("../../../../types");
const mapV2ConfigToV3 = (config) => {
    const visualization = config.visualization;
    if (visualization.id === 'geolayer') {
        const layers = visualization.layers || [];
        const v3Layers = layers.map((layer) => {
            const commonPlaceholders = layer.commonPlaceholders;
            // Fallback, historically we did not put sort in commonPlaceholders. Get it from the config.
            // To support the old charts, switch to have the same behavior for all fields
            if (layer.id === 'polyline') {
                return {
                    ...layer,
                    commonPlaceholders: {
                        ...commonPlaceholders,
                        sort: config.sort || [],
                    },
                };
            }
            return {
                ...layer,
                commonPlaceholders: {
                    ...commonPlaceholders,
                    sort: [],
                },
            };
        });
        return {
            ...config,
            version: types_1.ChartsConfigVersion.V3,
            visualization: {
                ...visualization,
                layers: v3Layers,
            },
        };
    }
    return {
        ...config,
        version: types_1.ChartsConfigVersion.V3,
    };
};
exports.mapV2ConfigToV3 = mapV2ConfigToV3;
