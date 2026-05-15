"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGatewayConfig = exports.isGatewayError = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const gateway_utils_1 = require("../../shared/schema/gateway-utils");
const axios_1 = require("../constants/axios");
const isGatewayError = (error) => {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const err = error.error;
    return (Boolean(err) &&
        typeof err === 'object' &&
        'code' in err &&
        'message' in err &&
        'status' in err);
};
exports.isGatewayError = isGatewayError;
const UNKNOWN_TYPE = 'unknownType';
const UNKNOWN_ENV = 'unknownEnv';
const getGatewayConfig = (nodekit, config) => {
    const axiosConfig = nodekit.config.useIPV6 ? axios_1.IPV6_AXIOS_OPTIONS : {};
    return {
        installation: nodekit.config.appInstallation || UNKNOWN_TYPE,
        env: nodekit.config.appEnv || UNKNOWN_ENV,
        proxyHeaders: (headers) => {
            const HEADERS_WITH_SENSITIVE_URLS = ['referer'];
            const preparedHeaders = {};
            const proxyHeaders = nodekit.config.gatewayProxyHeaders;
            const proxyHeadersLowerCase = proxyHeaders.map((header) => header.toLowerCase());
            const headersWithSensitiveUrlsLowerCase = HEADERS_WITH_SENSITIVE_URLS.map((header) => header.toLowerCase());
            Object.keys(headers).forEach((key) => {
                const keyLowerCase = key.toLowerCase();
                if (proxyHeadersLowerCase.includes(keyLowerCase)) {
                    const value = headers[key];
                    if (headersWithSensitiveUrlsLowerCase.includes(keyLowerCase) &&
                        typeof value === 'string') {
                        preparedHeaders[key] = nodekit.utils.redactSensitiveQueryParams(value);
                    }
                    else {
                        preparedHeaders[key] = value;
                    }
                }
            });
            return preparedHeaders;
        },
        caCertificatePath: null,
        axiosConfig,
        withDebugHeaders: false,
        getAuthArgs: gateway_utils_1.getAuthArgs,
        getAuthHeaders: gateway_utils_1.getAuthHeaders,
        ErrorConstructor: nodekit_1.AppError,
        ...(config || {}),
    };
};
exports.getGatewayConfig = getGatewayConfig;
