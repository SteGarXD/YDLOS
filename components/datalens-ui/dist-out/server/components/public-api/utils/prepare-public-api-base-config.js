"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preparePublicApiBaseConfig = void 0;
const shared_1 = require("../../../../shared");
const preparePublicApiBaseConfig = (nodekit, config) => {
    const result = {};
    for (const [versionKey, versionConfig] of Object.entries(config)) {
        const version = versionKey;
        const { actions, openApi } = versionConfig;
        const filteredActions = Object.fromEntries(Object.entries(actions).filter(([, action]) => {
            return (!action.features ||
                action.features.every((feature) => (0, shared_1.isEnabledServerFeature)(nodekit.ctx, feature)));
        }));
        result[version] = {
            actions: filteredActions,
            openApi,
        };
    }
    return result;
};
exports.preparePublicApiBaseConfig = preparePublicApiBaseConfig;
