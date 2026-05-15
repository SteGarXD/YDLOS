"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthArgsProxyBIPrivate = exports.hasValidWorkbookTransferAuthHeaders = exports.getAuthHeadersBIPrivate = void 0;
const header_1 = require("../../../shared/constants/header");
const getAuthHeadersBIPrivate = ({ authArgs }) => {
    const usMasterToken = authArgs === null || authArgs === void 0 ? void 0 : authArgs.usMasterToken;
    return {
        [header_1.US_MASTER_TOKEN_HEADER]: usMasterToken,
    };
};
exports.getAuthHeadersBIPrivate = getAuthHeadersBIPrivate;
const hasValidWorkbookTransferAuthHeaders = async (req) => {
    return req.headers[header_1.US_MASTER_TOKEN_HEADER] !== undefined;
};
exports.hasValidWorkbookTransferAuthHeaders = hasValidWorkbookTransferAuthHeaders;
const getAuthArgsProxyBIPrivate = (req, _res) => {
    return {
        usMasterToken: req.headers[header_1.US_MASTER_TOKEN_HEADER],
    };
};
exports.getAuthArgsProxyBIPrivate = getAuthArgsProxyBIPrivate;
