"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("@gravity-ui/gateway/build/constants");
const shared_1 = require("../../shared");
const app_env_1 = require("../app-env");
const components_1 = require("../components");
exports.default = {
    appName: `datalens-${process.env.APP_MODE}`,
    appSocket: 'dist/run/server.sock',
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },
    expressTrustProxyNumber: 2,
    workers: process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : 1,
    python: process.env.PYTHON || 'python3',
    fetchingTimeout: ((process.env.DATA_FETCHING_TIMEOUT_MS && parseInt(process.env.DATA_FETCHING_TIMEOUT_MS)) || 95) * 1000,
    singleFetchingTimeout: ((process.env.DATA_SINGLE_FETCHING_TIMEOUT_MS && parseInt(process.env.DATA_SINGLE_FETCHING_TIMEOUT_MS)) || 95) * 1000,
    flatTableRowsLimit: ((process.env.FLAT_TABLE_ROWS_LIMIT && parseInt(process.env.FLAT_TABLE_ROWS_LIMIT)) || 100000),
    // fetchingTimeout: process.env.DATA_FETCHING_TIMEOUT_MS
    //     ? parseInt(process.env.DATA_FETCHING_TIMEOUT_MS, 10)
    //     : undefined,
    // singleFetchingTimeout: process.env.DATA_SINGLE_FETCHING_TIMEOUT_MS
    //     ? parseInt(process.env.DATA_SINGLE_FETCHING_TIMEOUT_MS, 10)
    //     : undefined,
    faviconUrl: '/favicon.ico',
    appMode: process.env.APP_MODE,
    serviceName: components_1.SERVICE_NAME_DATALENS,
    gatewayProxyHeaders: [
        ...constants_1.DEFAULT_PROXY_HEADERS,
        shared_1.PROJECT_ID_HEADER,
        shared_1.TENANT_ID_HEADER,
        shared_1.RPC_AUTHORIZATION,
        shared_1.SuperuserHeader.XDlAllowSuperuser,
        shared_1.SuperuserHeader.XDlSudo,
        shared_1.AuthHeader.Authorization,
        shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER,
        shared_1.CSRF_TOKEN_HEADER,
        shared_1.DL_COMPONENT_HEADER,
        shared_1.DL_EMBED_TOKEN_HEADER,
    ],
    headersMap: {},
    requestIdHeaderName: 'x-request-id',
    releaseVersion: app_env_1.releaseVersion,
    docsUrl: app_env_1.docsUrl,
};
