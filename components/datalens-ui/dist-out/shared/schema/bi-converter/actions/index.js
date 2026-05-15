"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX_V2 = '/api/v2';
exports.actions = {
    getFileStatus: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ fileId }) => `${PATH_PREFIX_V2}/files/${fileId}/status`,
        params: (_, headers) => ({ headers }),
    }),
    getFileSources: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ fileId }) => `${PATH_PREFIX_V2}/files/${fileId}/sources`,
        params: (_, headers) => ({ headers }),
    }),
    getFileSourceStatus: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ fileId, sourceId }) => `${PATH_PREFIX_V2}/files/${fileId}/sources/${sourceId}/status`,
        params: (_, headers) => ({ headers }),
    }),
    updateFileSource: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ fileId, sourceId }) => `${PATH_PREFIX_V2}/files/${fileId}/sources/${sourceId}`,
        params: ({ fileId: _1, sourceId: _2, ...body }, headers) => ({ body, headers }),
    }),
    applySourceSettings: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ fileId, sourceId }) => `${PATH_PREFIX_V2}/files/${fileId}/sources/${sourceId}/apply_settings`,
        params: ({ fileId: _1, sourceId: _2, ...body }, headers) => ({ body, headers }),
    }),
    addGoogleSheet: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX_V2}/links`,
        params: (body, headers) => ({ body, headers }),
    }),
    updateS3BasedConnectionData: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX_V2}/update_connection_data`,
        params: (body, headers) => ({ body, headers }),
    }),
    addYandexDocument: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX_V2}/documents`,
        params: (body, headers) => ({ body, headers }),
    }),
    getPresignedUrl: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX_V2}/make_presigned_url`,
        params: (_, headers) => ({ headers }),
        transformResponseData(data, config) {
            var _a;
            const s3ProxyEndpoint = (_a = config.ctx.config.endpoints.api) === null || _a === void 0 ? void 0 : _a.s3Proxy;
            // fix s3 endpoint with reverse proxy in k8s or docker internal service
            // more details: https://github.com/minio/minio-js/issues/514
            if (s3ProxyEndpoint) {
                return {
                    ...data,
                    url: data.url.replace(/^https?:\/\/.+?\//, `${s3ProxyEndpoint}/`),
                };
            }
            return data;
        },
    }),
    downloadPresignedUrl: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX_V2}/download_presigned_url`,
        params: (body, headers) => ({ body, headers }),
    }),
};
