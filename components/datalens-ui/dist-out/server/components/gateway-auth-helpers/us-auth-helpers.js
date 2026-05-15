"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthArgsProxyUSPrivate = exports.getAuthHeadersUSPrivate = exports.getAuthArgsUSPrivate = void 0;
const header_1 = require("../../../shared/constants/header");
const getAuthArgsUSPrivate = ({ ctx }, _res) => {
    const usMasterToken = ctx.config.usMasterToken;
    return {
        usMasterToken,
    };
};
exports.getAuthArgsUSPrivate = getAuthArgsUSPrivate;
const getAuthHeadersUSPrivate = ({ authArgs }) => {
    const usMasterToken = authArgs === null || authArgs === void 0 ? void 0 : authArgs.usMasterToken;
    return {
        [header_1.US_MASTER_TOKEN_HEADER]: usMasterToken,
    };
};
exports.getAuthHeadersUSPrivate = getAuthHeadersUSPrivate;
const getAuthArgsProxyUSPrivate = (req, _res) => {
    return {
        usMasterToken: req.headers[header_1.US_MASTER_TOKEN_HEADER],
    };
};
exports.getAuthArgsProxyUSPrivate = getAuthArgsProxyUSPrivate;
