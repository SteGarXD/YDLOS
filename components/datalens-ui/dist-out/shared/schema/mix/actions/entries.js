"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entriesActions = void 0;
const keyBy_1 = __importDefault(require("lodash/keyBy"));
const types_1 = require("../../../types");
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
const helpers_1 = require("../helpers");
const validation_1 = require("../helpers/validation");
exports.entriesActions = {
    deleteEntry: (0, gateway_utils_1.createAction)(async (api, args) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { entryId, lockToken, scope } = args;
        switch (scope) {
            case types_1.EntryScope.Dataset: {
                const data = await typedApi.bi.deleteDataset({ datasetId: entryId });
                return data;
            }
            case types_1.EntryScope.Connection: {
                const data = await typedApi.bi.deleteConnection({ connectionId: entryId });
                return data;
            }
            default: {
                const data = await typedApi.us._deleteUSEntry({ entryId, lockToken });
                return data;
            }
        }
    }),
    getPublicationPreview: (0, gateway_utils_1.createAction)(async (api, { entryId, workbookId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const relations = (await typedApi.us.getRelations({
            entryId,
            includePermissionsInfo: true,
        }));
        const [datasets] = await (0, helpers_1.checkEntriesForPublication)({
            entries: relations,
            typedApi,
            workbookId,
        });
        const normalizedDatasets = datasets
            ? (0, keyBy_1.default)(datasets.result, (dataset) => dataset.dataset_id)
            : {};
        // TODO: wait for back fix
        // const normalizedConnections = connections
        //     ? keyBy(connections.result, (connection) => connection.connection_id)
        //     : {};
        return relations.map((entry) => {
            let lockPublication = false;
            let lockPublicationReason = null;
            if (entry.scope === types_1.EntryScope.Dataset) {
                const datasetEntry = normalizedDatasets[entry.entryId];
                lockPublication = datasetEntry && !datasetEntry.allowed;
                lockPublicationReason = datasetEntry.reason;
            }
            // if (entry.scope === EntryScope.Connection) {
            //     const connectionEntry = normalizedConnections[entry.entryId];
            //     lockPublication = connectionEntry && !connectionEntry.allowed;
            //     lockPublicationReason = connectionEntry.reason;
            // }
            return {
                ...entry,
                lockPublication,
                lockPublicationReason,
            };
        });
    }),
    switchPublicationStatus: (0, gateway_utils_1.createAction)(async (api, { entries, mainEntry, workbookId }) => {
        var _a, _b;
        if (!(0, validation_1.isValidPublishLink)((_b = (_a = mainEntry === null || mainEntry === void 0 ? void 0 : mainEntry.unversionedData) === null || _a === void 0 ? void 0 : _a.publicAuthor) === null || _b === void 0 ? void 0 : _b.link)) {
            throw new Error('Failed to publish dashboard - invalid publish link.');
        }
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const [datasets] = await (0, helpers_1.checkEntriesForPublication)({
            entries,
            typedApi,
            workbookId,
        });
        let errorMessage = '';
        if (datasets && datasets.result.some((datasetEntry) => !datasetEntry.allowed)) {
            errorMessage += JSON.stringify(datasets.result
                .filter(({ allowed }) => !allowed)
                .map(({ dataset_id: entryId, reason }) => ({ entryId, reason })), null, 4);
        }
        // if (connections && connections.result.some((connectionEntry) => !connectionEntry.allowed)) {
        //     errorMessage += JSON.stringify(
        //         connections.result
        //             .filter(({allowed}) => !allowed)
        //             .map(({connection_id: entryId, reason}) => ({entryId, reason})),
        //         null,
        //         4,
        //     );
        // }
        if (errorMessage) {
            throw new Error(`Failed to publish entries:\n ${errorMessage}`);
        }
        const result = await typedApi.us._switchPublicationStatus({ entries, mainEntry });
        return result;
    }),
    resolveEntryByLink: (0, gateway_utils_1.createAction)(async (api, { url }, { ctx }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { resolveEntryByLink } = ctx.get('gateway');
        const result = await resolveEntryByLink({
            originalUrl: url,
            ctx,
            getEntryMeta: typedApi.us.getEntryMeta,
            getEntryByKey: typedApi.us.getEntryByKey,
        });
        return result;
    }),
    getEntryMetaStatus: (0, gateway_utils_1.createAction)(async (api, args) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { entryId } = args;
        try {
            await typedApi.us.getEntryMeta({ entryId });
            return { code: 'OK' };
        }
        catch (errorWrapper) {
            return (0, helpers_1.getEntryMetaStatusByError)(errorWrapper);
        }
    }),
    getEntriesInFolder: (0, gateway_utils_1.createAction)(async (api, { folderId }) => {
        var _a;
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const folderEntry = await typedApi.us.getEntry({
            entryId: folderId,
            includePermissionsInfo: true,
        });
        if (((_a = folderEntry.permissions) === null || _a === void 0 ? void 0 : _a.admin) !== true) {
            throw new Error('Forbidden');
        }
        const entries = await typedApi.us._getEntriesByKeyPattern({
            keyPattern: `${(0, helpers_1.escapeStringForLike)(folderEntry.key)}%`,
        });
        const yqlFolderKey = 'yql/charts/';
        return entries.filter(({ key }) => !key.toLowerCase().startsWith(yqlFolderKey));
    }),
    getEntryRelations: (0, gateway_utils_1.createAction)(async (api, { entryId, direction = 'parent' }) => {
        return await (0, simple_schema_1.getTypedApi)(api).us.getRelations({
            entryId,
            direction,
        });
    }),
    getBatchEntriesByIds: (0, gateway_utils_1.createAction)(async (api, args) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { ids, ...restArgs } = args;
        if (ids.length === 0) {
            return {
                entries: [],
            };
        }
        // If we have more than 50 IDs, split them into batches to avoid URL length limitations
        if (ids.length > 50) {
            const batches = [];
            for (let i = 0; i < ids.length; i += 50) {
                batches.push(ids.slice(i, i + 50));
            }
            const batchResults = await Promise.all(batches.map((batchIds) => typedApi.us.getEntries({
                ...restArgs,
                ids: batchIds,
            })));
            const combinedEntries = batchResults.reduce((acc, result) => [...acc, ...result.entries], []);
            return {
                entries: combinedEntries,
            };
        }
        const entriesResponse = await typedApi.us.getEntries(args);
        return { entries: entriesResponse.entries };
    }),
};
