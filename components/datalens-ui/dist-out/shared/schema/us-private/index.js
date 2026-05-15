"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("../../../server/registry");
const schema_1 = require("../../endpoints/schema");
const actions_1 = require("./actions");
exports.default = {
    actions: actions_1.actions,
    endpoints: (0, schema_1.getServiceEndpoints)('us'),
    serviceName: 'us-private',
    getAuthArgs: (req, res) => {
        const { getAuthArgsUSPrivate } = registry_1.registry.common.auth.getAll();
        return getAuthArgsUSPrivate(req, res);
    },
    getAuthHeaders: (params) => {
        const { getAuthHeadersUSPrivate } = registry_1.registry.common.auth.getAll();
        return getAuthHeadersUSPrivate(params);
    },
};
