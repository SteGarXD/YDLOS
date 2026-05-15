"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
exports.actions = {
    refreshTokens: (0, gateway_utils_1.createAction)({
        method: 'POST',
        proxyHeaders: [constants_1.AuthHeader.Cookie],
        proxyResponseHeaders: [constants_1.SET_COOKIE_HEADER],
        path: () => '/refresh',
    }),
    signin: (0, gateway_utils_1.createAction)({
        method: 'POST',
        proxyResponseHeaders: [constants_1.SET_COOKIE_HEADER],
        path: () => '/signin',
        params: ({ login, password }, headers) => ({
            body: { login, password },
            headers,
        }),
    }),
    signup: (0, gateway_utils_1.createAction)({
        method: 'POST',
        proxyResponseHeaders: [constants_1.SET_COOKIE_HEADER],
        path: () => '/signup',
        params: ({ login, password, firstName, lastName, email }, headers) => ({
            body: { login, password, firstName, lastName, email },
            headers,
        }),
    }),
    logout: (0, gateway_utils_1.createAction)({
        method: 'GET',
        proxyHeaders: [constants_1.AuthHeader.Cookie],
        proxyResponseHeaders: [constants_1.SET_COOKIE_HEADER],
        path: () => '/logout',
    }),
};
