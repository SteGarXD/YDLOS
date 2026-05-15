"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entriesActions = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../../../../constants");
const modules_1 = require("../../../../modules");
const feature_1 = require("../../../../types/feature");
const gateway_utils_1 = require("../../../gateway-utils");
const utils_1 = require("../../../utils");
const get_entries_1 = require("./get-entries");
const list_directory_1 = require("./list-directory");
const PATH_PREFIX = '/v1';
const PATH_PREFIX_V2 = '/v2';
const PRIVATE_PATH_PREFIX = '/private';
exports.entriesActions = {
    listDirectory: list_directory_1.listDirectory,
    getEntries: get_entries_1.getEntries,
    encodeId: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: (data) => { return `/encodeId?id=${data.id}`; },
        params: (_, headers) => ({
            headers: {
                ...headers
            },
        }),
    }),
    decodeId: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: (data) => { return `/decodeId?id=${data.id}`; },
        params: (_, headers) => ({
            headers: {
                ...headers
            },
        }),
    }),
    universalService: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => { return `/universal_service`; },
        params: (body, headers) => {
            return { body, headers };
        },
    }),
    getAuth: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: (data) => {
            return `/auth?login=${data.login}&password=${data.password}`;
        },
        params: (_, headers) => ({
            headers: {
                ...headers
            },
        }),
    }),
    getEntry: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ entryId: _entryId, workbookId, includeDlComponentUiData, includeFavorite = true, ...query }, headers) => ({
            query: {
                ...query,
                includeFavorite,
            },
            headers: {
                ...headers,
                ...(includeDlComponentUiData ? { [constants_1.DL_COMPONENT_HEADER]: constants_1.DlComponentHeader.UI } : {}),
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
            },
        }),
    }),
    getEntryByKey: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/entriesByKey`,
        params: (query, headers) => ({ query, headers }),
    }),
    getEntryMeta: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/meta`,
        params: (_, headers) => ({ headers }),
    }),
    getRevisions: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/revisions`,
        params: (args, headers, { ctx }) => {
            let updatedAfter;
            const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
            if (!isEnabledServerFeature(feature_1.Feature.RevisionsListNoLimit) && !args.revIds) {
                const date = new Date();
                date.setMonth(date.getMonth() - 3);
                updatedAfter = date.toISOString();
            }
            return {
                query: {
                    ...(0, lodash_1.omit)(args, 'entryId'),
                    updatedAfter,
                },
                headers,
            };
        },
        transformResponseData: (data) => ({
            hasNextPage: Boolean(data.nextPageToken),
            entries: data.entries,
        }),
    }),
    getRelations: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/relations`,
        params: (args, headers) => ({
            query: (0, lodash_1.omit)(args, 'entryId', 'excludeUnregistredDlsEntries'),
            headers,
        }),
        transformResponseData: (data, { args, ctx }) => {
            let uniqRelations = (0, lodash_1.uniqBy)(data.map((relationEntry) => ({
                ...relationEntry,
                name: (0, modules_1.getEntryNameByKey)({ key: relationEntry.key }),
            })), (relationEntry) => relationEntry.entryId);
            if (args.excludeUnregistredDlsEntries) {
                const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
                if (isEnabledServerFeature(feature_1.Feature.UseYqlFolderKey)) {
                    const yqlFolderKey = 'yql/charts/';
                    uniqRelations = uniqRelations.filter(({ key }) => !key.toLowerCase().startsWith(yqlFolderKey));
                }
            }
            return uniqRelations;
        },
    }),
    moveEntry: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/move`,
        params: (args, headers) => {
            const body = {
                destination: (0, modules_1.normalizeDestination)(args.destination),
            };
            if (args.name) {
                body.name = args.name;
            }
            return { body, headers };
        },
        timeout: constants_1.TIMEOUT_60_SEC,
    }),
    copyEntry: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/copy`,
        params: (args, headers) => {
            const body = {
                destination: (0, modules_1.normalizeDestination)(args.destination),
            };
            if (args.name) {
                body.name = args.name;
            }
            return { body, headers };
        },
    }),
    copyWorkbookEntry: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX_V2}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/copy`,
        params: (args, headers) => {
            const body = {};
            if (args.name) {
                body.name = args.name;
            }
            return { body, headers };
        },
    }),
    copyEntriesToWorkbook: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX_V2}/copy-entries`,
        params: (args, headers) => ({
            body: { workbookId: args.workbookId, entryIds: args.entryIds },
            headers,
        }),
    }),
    renameEntry: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/rename`,
        params: ({ name }, headers) => ({ body: { name }, headers }),
        timeout: constants_1.TIMEOUT_60_SEC,
    }),
    createFolder: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/entries`,
        params: ({ key }, headers) => {
            return {
                body: {
                    scope: 'folder',
                    type: '',
                    key,
                    meta: {},
                    data: {},
                },
                headers,
            };
        },
    }),
    _deleteUSEntry: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ lockToken, scope, types }, headers) => ({
            query: { lockToken, scope, types },
            headers,
        }),
    }),
    _switchPublicationStatus: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PRIVATE_PATH_PREFIX}/entries/switchPublicationStatus`,
        params: ({ entries, mainEntry }, headers) => ({
            body: { entries, mainEntry },
            headers,
        }),
    }),
    _getEntriesByKeyPattern: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PRIVATE_PATH_PREFIX}/getEntriesByKeyPattern`,
        params: ({ keyPattern }, headers) => ({ query: { keyPattern }, headers }),
    }),
    getRelationsGraph: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}/relations-graph`,
        timeout: constants_1.TIMEOUT_90_SEC,
    }),
    getEntriesAnnotation: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/get-entries-annotation`,
        params: (params, headers) => ({
            body: params,
            headers,
        }),
    }),
    createSharedEntryBinding: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/entity-bindings/create`,
        params: (params, headers) => ({
            body: params,
            headers,
        }),
    }),
    getSharedEntryBindings: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PATH_PREFIX}/shared-entries/${entryId}/entity-bindings`,
        params: ({ page, pageSize, entryAs, mode, filterString }, headers) => ({
            query: {
                pageSize,
                page,
                entryAs,
                mode,
                filterString,
            },
            headers,
        }),
    }),
};
