"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const registry_1 = require("../../../../server/registry");
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const helpers_1 = require("../helpers");
const schemas_1 = require("../schemas");
const API_V1 = '/api/v1';
const API_DATA_V1 = '/api/data/v1';
const API_DATA_V2 = '/api/data/v2';
exports.actions = {
    getSources: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${API_V1}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}/info/sources`,
        params: ({ limit, offset, search_text, db_name, workbookId }, headers) => ({
            query: { limit, offset, db_name, search_text },
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
        timeout: constants_1.TIMEOUT_60_SEC,
    }),
    getDatasetByVersion: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: schemas_1.getDatasetByVersionArgsSchema,
        resultSchema: schemas_1.getDatasetByVersionResultSchema,
    }, {
        method: 'GET',
        path: ({ datasetId, version = 'draft' }) => `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/versions/${(0, utils_1.filterUrlFragment)(version)}`,
        params: ({ workbookId, rev_id }, headers) => ({
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
            query: { rev_id },
        }),
    }),
    getDbNames: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${API_V1}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}/db_names`,
        params: (_, headers) => ({ headers }),
    }),
    getSourceListingOptions: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${API_V1}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}/info/source_listing_options`,
        params: (_, headers) => ({ headers }),
    }),
    getFieldTypes: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${API_V1}/info/field_types`,
        params: (_, headers) => ({ headers }),
    }),
    getDataSetFieldsById: (0, gateway_utils_1.createAction)({
        method: 'GET',
        endpoint: 'datasetDataApiEndpoint',
        path: ({ dataSetId }) => `${API_DATA_V1}/datasets/${(0, utils_1.filterUrlFragment)(dataSetId)}/fields`,
        params: ({ workbookId }, headers) => ({
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    embedsGetDataSetFieldsById: (0, gateway_utils_1.createAction)({
        method: 'GET',
        endpoint: 'datasetDataEmbedsApiEndpoint',
        path: ({ dataSetId }) => `${API_DATA_V1}/datasets/${(0, utils_1.filterUrlFragment)(dataSetId)}/fields`,
        params: (_, headers) => ({ headers }),
    }),
    publicGetDataSetFieldsById: (0, gateway_utils_1.createAction)({
        method: 'GET',
        endpoint: 'datasetDataApiEndpoint',
        path: ({ dataSetId }) => `/public${API_DATA_V1}/datasets/${(0, utils_1.filterUrlFragment)(dataSetId)}/fields`,
        params: (_, headers, { ctx }) => ({
            headers: {
                ...headers,
                [ctx.config.headersMap.publicApiToken]: process.env.PUBLIC_API_KEY,
            },
        }),
    }),
    checkDatasetsForPublication: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${API_V1}/info/datasets_publicity_checker`,
        params: ({ datasetsIds, workbookId }, headers) => ({
            body: { datasets: datasetsIds },
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    checkConnectionsForPublication: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${API_V1}/info/connections_publicity_checker`,
        params: ({ connectionsIds, workbookId }, headers) => ({
            body: { connections: connectionsIds },
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    createDataset: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: schemas_1.createDatasetArgsSchema,
        resultSchema: schemas_1.createDatasetResultSchema,
    }, {
        method: 'POST',
        path: () => `${API_V1}/datasets`,
        params: ({ dataset, ...restBody }, headers, { ctx }) => {
            const resultDataset = (0, helpers_1.prepareDatasetProperty)(ctx, dataset);
            return { body: { ...restBody, dataset: resultDataset }, headers };
        },
    }),
    validateDataset: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: schemas_1.validateDatasetArgsSchema,
        resultSchema: schemas_1.validateDatasetResultSchema,
    }, {
        method: 'POST',
        path: ({ datasetId, version = 'draft' }) => datasetId
            ? `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/versions/${(0, utils_1.filterUrlFragment)(version)}/validators/schema`
            : `${API_V1}/datasets/validators/dataset`,
        params: ({ data: { dataset, ...restData }, workbookId }, headers, { ctx }) => {
            const resultDataset = (0, helpers_1.prepareDatasetProperty)(ctx, dataset);
            return {
                body: { ...restData, dataset: resultDataset },
                headers: {
                    ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                    ...headers,
                },
            };
        },
        transformResponseError: helpers_1.transformValidateDatasetResponseError,
        timeout: constants_1.TIMEOUT_95_SEC,
    }),
    updateDataset: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: schemas_1.updateDatasetArgsSchema,
        resultSchema: schemas_1.updateDatasetResultSchema,
    }, {
        method: 'PUT',
        path: ({ datasetId, version = 'draft' }) => `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/versions/${(0, utils_1.filterUrlFragment)(version)}`,
        params: ({ data: { dataset, ...restData } }, headers, { ctx }) => {
            const resultDataset = (0, helpers_1.prepareDatasetProperty)(ctx, dataset);
            return { body: { ...restData, dataset: resultDataset }, headers };
        },
    }),
    getPreview: (0, gateway_utils_1.createAction)({
        method: 'POST',
        endpoint: 'datasetDataApiEndpoint',
        path: ({ datasetId, version }) => datasetId
            ? `${API_DATA_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/versions/${(0, utils_1.filterUrlFragment)(version)}/preview`
            : `${API_DATA_V1}/datasets/data/preview`,
        params: ({ dataset, workbookId, limit }, headers, { ctx }) => {
            const resultDataset = (0, helpers_1.prepareDatasetProperty)(ctx, dataset);
            return {
                body: { dataset: resultDataset, limit },
                headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
            };
        },
        timeout: constants_1.TIMEOUT_95_SEC,
    }),
    validateDatasetFormula: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ datasetId }) => datasetId
            ? `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/versions/draft/validators/field`
            : `${API_V1}/datasets/validators/field`,
        params: ({ dataset, workbookId, field }, headers, { ctx }) => {
            const resultDataset = (0, helpers_1.prepareDatasetProperty)(ctx, dataset);
            return {
                body: { dataset: resultDataset, field },
                headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
            };
        },
        transformResponseError: helpers_1.transformValidateDatasetFormulaResponseError,
    }),
    copyDataset: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ datasetId }) => `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}/copy`,
        params: ({ new_key }, headers) => ({ body: { new_key }, headers }),
    }),
    getDistinctsApiV2: (0, gateway_utils_1.createAction)({
        method: 'POST',
        endpoint: 'datasetDataApiEndpoint',
        path: ({ datasetId }) => `${API_DATA_V2}/datasets/${datasetId}/values/distinct`,
        params: ({ datasetId: _datasetId, workbookId, ...body }, headers) => ({
            body,
            headers: {
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                ...headers,
            },
        }),
        transformResponseData: helpers_1.transformApiV2DistinctsResponse,
        timeout: constants_1.TIMEOUT_95_SEC,
    }),
    getPublicDistinctsApiV2: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ datasetId }) => `/public${API_DATA_V2}/datasets/${datasetId}/values/distinct`,
        params: ({ datasetId: _datasetId, ...body }, headers, { ctx }) => ({
            body,
            headers: {
                ...headers,
                [ctx.config.headersMap.publicApiToken]: process.env.PUBLIC_API_KEY,
            },
        }),
        transformResponseData: helpers_1.transformApiV2DistinctsResponse,
        timeout: constants_1.TIMEOUT_95_SEC,
    }),
    deleteDataset: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: schemas_1.deleteDatasetArgsSchema,
        resultSchema: schemas_1.deleteDatasetResultSchema,
    }, {
        method: 'DELETE',
        path: ({ datasetId }) => `${API_V1}/datasets/${(0, utils_1.filterUrlFragment)(datasetId)}`,
        params: (_, headers) => ({ headers }),
    }),
    _proxyExportDataset: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ datasetId }) => `${API_V1}/datasets/export/${datasetId}`,
        params: ({ workbookId, idMapping }, headers) => ({
            headers: {
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                ...headers,
            },
            body: {
                id_mapping: idMapping,
            },
        }),
        getAuthHeaders: (params) => {
            return registry_1.registry.common.auth.getAll().getAuthHeadersBIPrivate(params);
        },
    }),
    _proxyImportDataset: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${API_V1}/datasets/import`,
        params: ({ workbookId, idMapping, dataset }, headers) => ({
            headers: {
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                ...headers,
            },
            body: {
                data: {
                    workbook_id: workbookId,
                    dataset,
                },
                id_mapping: idMapping,
            },
        }),
        getAuthHeaders: (params) => {
            return registry_1.registry.common.auth.getAll().getAuthHeadersBIPrivate(params);
        },
    }),
};
