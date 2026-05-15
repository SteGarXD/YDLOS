"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashActions = void 0;
const __1 = require("../../..");
const dash_1 = __importDefault(require("../../../../server/components/sdk/dash"));
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
const helpers_1 = require("../helpers");
const dash_2 = require("../helpers/dash");
const dash_3 = require("../schemas/dash");
exports.dashActions = {
    // WIP
    __deleteDashboard__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: dash_3.deleteDashArgsSchema,
        resultSchema: dash_3.deleteDashResultSchema,
    }, async (api, { lockToken, dashboardId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        await typedApi.us._deleteUSEntry({
            entryId: dashboardId,
            lockToken,
        });
        return {};
    }),
    collectDashStats: (0, gateway_utils_1.createAction)(async (_, args, { ctx }) => {
        ctx.stats('dashStats', {
            datetime: Date.now(),
            ...args,
        });
        return { status: 'success' };
    }),
    collectChartkitStats: (0, gateway_utils_1.createAction)(async (_, args, { ctx }) => {
        ctx.log('ChartKit stats collect', { rowsCount: args.length });
        args.forEach((data) => {
            ctx.stats('chartKitStats', {
                datetime: new Date().toISOString().replace('T', ' ').split('.')[0],
                ...data,
            });
        });
        return { status: 'success', rowsCount: args.length };
    }),
    // in the entriesIds, the id of the entities for which you need to find out the dataset,
    // and if the dataset id is not in datasetsIds, then you need to get a list of dataset fields
    getEntriesDatasetsFields: (0, gateway_utils_1.createAction)(async (api, { entriesIds, datasetsIds, workbookId }, { ctx }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { entries } = await typedApi.us.getEntries({
            scope: 'widget',
            ids: entriesIds,
            includeLinks: true,
            includeData: true,
        });
        const allDatasetsIdsSet = new Set([...datasetsIds]);
        entries.forEach((entry) => {
            if (!entry.isLocked) {
                const { links, meta } = entry;
                const { dataset } = links || {};
                // deprecated
                const { datasetId: metaDatasetId } = meta || {};
                const datasetId = (dataset || metaDatasetId);
                if (datasetId) {
                    allDatasetsIdsSet.add(datasetId);
                }
            }
        });
        const allDatasetsIds = [...allDatasetsIdsSet];
        const allDatasetsPromises = allDatasetsIds.map((datasetId) => (0, dash_2.fetchDataset)({ datasetId, workbookId, typedApi, ctx }));
        const allDatasetsFetchedData = await Promise.all([...allDatasetsPromises]);
        const allDatasetsFetchedDataDict = allDatasetsFetchedData
            .filter((item) => Boolean(item.data && item.datasetId))
            .reduce((res, item) => {
            res[item.datasetId] = { ...item };
            return res;
        }, {});
        const res = [];
        entries.forEach((entry) => {
            var _a;
            if (!entry.isLocked) {
                const { links, meta, type, entryId } = entry;
                const { dataset } = links || {};
                // deprecated
                const { datasetId: metaDatasetId } = meta || {};
                const datasetId = (dataset || metaDatasetId);
                if (datasetId) {
                    const widgetType = ((_a = type.match(/^[^_]*/)) === null || _a === void 0 ? void 0 : _a[0]) || null;
                    res.push((0, dash_2.prepareDatasetData)({
                        items: allDatasetsFetchedDataDict[datasetId],
                        type: widgetType,
                        datasetId,
                        entryId,
                        visualizationType: (0, helpers_1.getEntryVisualizationType)(entry),
                    }));
                }
            }
        });
        datasetsIds.forEach((datasetId) => {
            res.push((0, dash_2.prepareDatasetData)({
                items: allDatasetsFetchedDataDict[datasetId],
                type: 'dataset',
                entryId: datasetId,
                datasetId,
            }));
        });
        return res;
    }),
    getWidgetsDatasetsFields: (0, gateway_utils_1.createAction)(async (api, { entriesIds, workbookId }, opt) => {
        const { ctx, headers } = opt;
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const { entries } = await typedApi.us.getEntries({
            scope: 'widget',
            ids: entriesIds,
            includeLinks: true,
        });
        const allDatasetsIdsSet = new Set();
        entries.forEach((entry) => {
            if (!entry.isLocked) {
                const { links, meta } = entry;
                const { dataset } = links || {};
                // deprecated
                const { datasetId: metaDatasetId } = meta || {};
                const datasetId = (dataset || metaDatasetId);
                if (datasetId) {
                    allDatasetsIdsSet.add(datasetId);
                }
            }
        });
        const allDatasetsIds = [...allDatasetsIdsSet];
        const allDatasetsPromises = allDatasetsIds.map((datasetId) => (0, dash_2.fetchDatasetFieldsById)({ datasetId, workbookId, ctx, headers }));
        const allDatasetsFetchedData = await Promise.all([...allDatasetsPromises]);
        const allDatasetsFetchedDataDict = allDatasetsFetchedData
            .filter((item) => Boolean(item.data && item.datasetId))
            .reduce((res, item) => {
            res[item.datasetId] = { ...item };
            return res;
        }, {});
        const res = [];
        entries.forEach((entry) => {
            if (!entry.isLocked) {
                const { links, meta, entryId } = entry;
                const { dataset } = links || {};
                // deprecated
                const { datasetId: metaDatasetId } = meta || {};
                const datasetId = (dataset || metaDatasetId);
                if (datasetId) {
                    res.push((0, dash_2.prepareWidgetDatasetData)({
                        items: allDatasetsFetchedDataDict[datasetId],
                        datasetId,
                        entryId,
                    }));
                }
            }
        });
        return res;
    }),
    // WIP
    __getDashboard__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: dash_3.getDashArgsSchema,
        resultSchema: dash_3.getDashResultSchema,
    }, async (_, args, { headers, ctx }) => {
        const { dashboardId, includePermissions, includeLinks, includeFavorite, branch, revId } = args;
        const result = await dash_1.default.read(dashboardId, {
            includePermissionsInfo: includePermissions
                ? includePermissions.toString()
                : '0',
            includeLinks: includeLinks ? includeLinks.toString() : '0',
            includeFavorite,
            ...(branch ? { branch } : { branch: 'published' }),
            ...(revId ? { revId } : {}),
        }, headers, ctx, { forceMigrate: true });
        if (result.scope !== __1.EntryScope.Dash) {
            throw new Error('No entry found');
        }
        return result;
    }),
    // WIP
    __updateDashboard__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: dash_3.updateDashArgsSchema,
        resultSchema: dash_3.updateDashResultSchema,
    }, async (_, args, { headers, ctx }) => {
        const { entryId } = args;
        const I18n = ctx.get('i18n');
        return (await dash_1.default.update(entryId, args, headers, ctx, I18n, {
            forceMigrate: true,
        }));
    }),
    // WIP
    __createDashboard__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: dash_3.createDashArgsSchema,
        resultSchema: dash_3.createDashResultSchema,
    }, async (_, args, { headers, ctx }) => {
        const I18n = ctx.get('i18n');
        return (await dash_1.default.create(args, headers, ctx, I18n));
    }),
    _deleteDashboard: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: dash_3.deleteDashArgsSchema,
        resultSchema: dash_3.deleteDashResultSchema,
    }, async (api, { lockToken, dashboardId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        await typedApi.us._deleteUSEntry({
            entryId: dashboardId,
            lockToken,
            scope: __1.EntryScope.Dash,
        });
        return {};
    }),
};
