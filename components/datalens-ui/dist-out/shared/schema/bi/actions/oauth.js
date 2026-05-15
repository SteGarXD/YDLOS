"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const helpers_1 = require("../helpers");
const PATH_PREFIX = '/oauth';
exports.actions = {
    getOAuthUri: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ scope }) => `${PATH_PREFIX}/uri/${scope}`,
        params: ({ conn_type }, headers) => ({ headers, query: { conn_type } }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
    getOAuthToken: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ scope }) => `${PATH_PREFIX}/token/${scope}`,
        params: ({ code, conn_type }, headers) => ({ headers, body: { code, conn_type } }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
};
