"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PRIVATE_PATH_PREFIX = '/private';
exports.tenantActions = {
    _getTenantDetails: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ tenantId }) => `${PRIVATE_PATH_PREFIX}/tenants/${tenantId}/details`,
        params: (_, headers) => ({
            headers,
        }),
    }),
};
