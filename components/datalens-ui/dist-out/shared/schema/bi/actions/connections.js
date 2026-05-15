"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const registry_1 = require("../../../../server/registry");
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const helpers_1 = require("../helpers");
const connections_1 = require("../schemas/connections");
const PATH_PREFIX = '/api/v1';
const PATH_DATA_API_PREFIX = '/api/data/v1';
exports.actions = {
    ensureUploadRobot: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}/ensure_upload_robot`,
        params: (_, headers) => ({ headers }),
    }),
    getAvailableCounters: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}/metrica_available_counters`,
        params: (_, headers) => ({ headers }),
    }),
    getConnectors: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/info/connectors`,
        params: (_, headers) => ({ headers }),
    }),
    getConnection: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: connections_1.getConnectionArgsSchema,
        resultSchema: connections_1.getConnectionResultSchema,
    }, {
        method: 'GET',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${connectionId}`,
        params: ({ workbookId, rev_id }, headers) => ({
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
            query: { rev_id },
        }),
    }),
    createConnection: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: connections_1.createConnectionArgsSchema,
        resultSchema: connections_1.createConnectionResultSchema,
    }, {
        method: 'POST',
        path: () => `${PATH_PREFIX}/connections`,
        params: (body, headers) => ({ body, headers }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
    verifyConnection: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/test_connection/${connectionId}`,
        params: ({ connectionId: _connectionId, workbookId, ...body }, headers) => ({
            body,
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
    verifyConnectionParams: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/connections/test_connection_params`,
        params: (body, headers) => ({ body, headers }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
    updateConnection: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: connections_1.updateConnectionArgsSchema,
        resultSchema: connections_1.updateConnectionResultSchema,
    }, {
        method: 'PUT',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${connectionId}`,
        params: ({ data }, headers) => ({ body: data, headers }),
        transformResponseError: helpers_1.transformConnectionResponseError,
    }),
    deleteConnection: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: connections_1.deleteConnectionArgsSchema,
        resultSchema: connections_1.deleteConnectionResultSchema,
    }, {
        method: 'DELETE',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${(0, utils_1.filterUrlFragment)(connectionId)}`,
        params: (_, headers) => ({ headers }),
    }),
    getConnectionSources: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${connectionId}/info/sources`,
        params: ({ workbookId }, headers) => ({
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    getConnectionSourceSchema: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/${connectionId}/info/source/schema`,
        params: ({ connectionId: _connectionId, workbookId, ...body }, headers) => ({
            body: { ...body },
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    getConnectorSchema: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ type, mode }) => `${PATH_PREFIX}/info/connectors/forms/${type}/${mode}`,
        params: ({ connectionId }, headers) => ({ headers, query: { conn_id: connectionId } }),
    }),
    getConnectionTypedQueryData: (0, gateway_utils_1.createAction)({
        method: 'POST',
        endpoint: 'datasetDataApiEndpoint',
        path: ({ connectionId }) => `${PATH_DATA_API_PREFIX}/connections/${connectionId}/typed_query`,
        params: ({ body, workbookId }, headers) => ({
            body: { ...body },
            headers: { ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}), ...headers },
        }),
    }),
    listConnectorIcons: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/info/connectors/icons`,
        params: (_, headers) => ({ headers }),
    }),
    _proxyExportConnection: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ connectionId }) => `${PATH_PREFIX}/connections/export/${connectionId}`,
        params: ({ workbookId }, headers) => ({
            headers: {
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                ...headers,
            },
        }),
        getAuthHeaders: (params) => {
            return registry_1.registry.common.auth.getAll().getAuthHeadersBIPrivate(params);
        },
    }),
    _proxyImportConnection: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/connections/import`,
        params: ({ workbookId, connection }, headers) => ({
            headers: {
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                ...headers,
            },
            body: {
                data: {
                    workbook_id: workbookId,
                    connection,
                },
                id_mapping: {},
            },
        }),
        getAuthHeaders: (params) => {
            return registry_1.registry.common.auth.getAll().getAuthHeadersBIPrivate(params);
        },
    }),
};
