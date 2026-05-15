"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasetFields = exports.DEFAULT_CACHE_TTL = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const lodash_1 = require("lodash");
const isNumber_1 = __importDefault(require("lodash/isNumber"));
const shared_1 = require("../../../../../shared");
const cache_client_1 = __importDefault(require("../../../../components/cache-client"));
const data_fetcher_1 = require("../../../../components/charts-engine/components/processor/data-fetcher");
const registry_1 = require("../../../../registry");
exports.DEFAULT_CACHE_TTL = 30;
const getStatusFromError = (error) => typeof error === 'object' && error !== null && 'status' in error && error.status;
const getDatasetFieldsById = async ({ datasetId, workbookId, ctx, rejectFetchingSource, iamToken, pluginOptions, zitadelParams, authParams, headers, }) => {
    var _a, _b;
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const requestDatasetFields = (pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.getDataSetFieldsById) || gatewayApi.bi.getDataSetFieldsById;
    const requestDatasetFieldsByToken = gatewayApi.bi.embedsGetDataSetFieldsById;
    try {
        if (zitadelParams) {
            (0, data_fetcher_1.addZitadelHeaders)({ headers, zitadelParams });
        }
        if (authParams) {
            (0, data_fetcher_1.addAuthHeaders)({ headers, authParams });
        }
        const response = headers[shared_1.DL_EMBED_TOKEN_HEADER]
            ? await requestDatasetFieldsByToken({
                ctx,
                headers,
                //requestId: headers['x-request-id'] ? headers['x-request-id']: req.id,
                requestId: ((_a = headers['x-request-id']) === null || _a === void 0 ? void 0 : _a.toString()) || ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
                args: {
                    dataSetId: datasetId,
                },
            })
            : await requestDatasetFields({
                ctx: ctx,
                headers,
                //requestId: headers['x-request-id'] ? headers['x-request-id']: req.id,
                requestId: ((_b = headers['x-request-id']) === null || _b === void 0 ? void 0 : _b.toString()) || ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
                authArgs: { iamToken },
                args: {
                    dataSetId: datasetId,
                    workbookId: workbookId,
                },
            });
        return response.responseData;
    }
    catch (err) {
        if (typeof err === 'object' && err !== null && 'error' in err) {
            const { error } = err;
            let preparedError = error;
            if ((0, lodash_1.isObject)(error) && 'message' in error) {
                const message = error.message;
                preparedError = new Error(message);
            }
            ctx.logError('FAILED_TO_RECEIVE_FIELDS', preparedError);
            const status = getStatusFromError(error);
            if ((0, isNumber_1.default)(status) && status < 500) {
                rejectFetchingSource({
                    [`${datasetId}_result`]: error,
                });
            }
        }
        throw new Error('FAILED_TO_RECEIVE_DATASET_FIELDS');
    }
};
const getDatasetFields = async (args) => {
    const { datasetId, workbookId, cacheClient, ctx, userId, iamToken, rejectFetchingSource, pluginOptions, zitadelParams, authParams, requestHeaders, } = args;
    const cacheKey = `${datasetId}__${userId}`;
    ctx.log('DATASET_FOR_CHARTS_MIDDLEWARE', { cacheKey });
    let datasetFields;
    let revisionId;
    if (cacheClient.client) {
        const cacheResponse = await cacheClient.get({ key: cacheKey });
        if (cacheResponse.status === cache_client_1.default.OK) {
            datasetFields = cacheResponse.data.datasetFields;
            revisionId = cacheResponse.data.revisionId;
            ctx.log('DATASET_FIELDS_WAS_RECEIVED_FROM_CACHE');
        }
        else {
            ctx.log('DATASET_FIELDS_IN_CACHE_WAS_NOT_FOUND');
            const response = await getDatasetFieldsById({
                datasetId,
                workbookId,
                ctx,
                rejectFetchingSource,
                iamToken,
                pluginOptions,
                zitadelParams,
                authParams,
                headers: requestHeaders,
            });
            datasetFields = response.fields;
            revisionId = response.revision_id;
            cacheClient
                .set({
                key: cacheKey,
                ttl: (pluginOptions === null || pluginOptions === void 0 ? void 0 : pluginOptions.cache) || exports.DEFAULT_CACHE_TTL,
                value: { datasetFields, revisionId },
            })
                .then((setCacheResponse) => {
                if (setCacheResponse.status === cache_client_1.default.OK) {
                    ctx.log('SET_DATASET_IN_CACHE_SUCCESS');
                }
                else {
                    ctx.logError('SET_DATASET_FIELDS_IN_CACHE_FAILED', new Error(setCacheResponse.message));
                }
            })
                .catch((error) => {
                ctx.logError('SET_DATASET_FIELDS_UNHANDLED_ERROR', error);
            });
        }
    }
    else {
        const response = await getDatasetFieldsById({
            datasetId,
            workbookId,
            ctx,
            rejectFetchingSource,
            iamToken,
            pluginOptions,
            zitadelParams,
            authParams,
            headers: requestHeaders,
        });
        datasetFields = response.fields;
        revisionId = response.revision_id;
    }
    ctx.log('DATASET_FIELDS_WAS_SUCCESSFULLY_PROCESSED');
    return { datasetFields, revisionId };
};
exports.getDatasetFields = getDatasetFields;
