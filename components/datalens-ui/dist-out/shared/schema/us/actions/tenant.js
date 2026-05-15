"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/v1/tenants';
exports.tenantActions = {
    setDefaultColorPalette: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/set-default-color-palette`,
        params: (body, headers) => ({
            body,
            headers,
        }),
    }),
};
