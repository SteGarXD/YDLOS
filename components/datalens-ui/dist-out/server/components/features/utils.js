"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeatureConfig = void 0;
const createFeatureConfig = (featureConfig) => {
    return {
        name: featureConfig.name,
        state: {
            development: featureConfig.state.development || false,
            production: featureConfig.state.production || false,
        },
    };
};
exports.createFeatureConfig = createFeatureConfig;
