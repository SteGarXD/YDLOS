"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qlActions = void 0;
const __1 = require("../../..");
const error_1 = require("../../../constants/error");
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
const ql_1 = require("../schemas/ql");
exports.qlActions = {
    // WIP
    __getQLChart__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: ql_1.getQLChartArgsSchema,
        resultSchema: ql_1.getQLChartResultSchema,
    }, async (api, args) => {
        const { includePermissions, includeLinks, includeFavorite = false, revId, chartId, branch, workbookId, } = args;
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        const getEntryResponse = await typedApi.us.getEntry({
            entryId: chartId,
            includePermissionsInfo: includePermissions,
            includeLinks,
            includeFavorite,
            revId,
            workbookId,
            branch: branch !== null && branch !== void 0 ? branch : 'published',
        });
        if (getEntryResponse.scope !== __1.EntryScope.Widget ||
            !__1.ENTRY_TYPES.ql.includes(getEntryResponse.type)) {
            throw new error_1.ServerError('Entry not found', {
                status: 404,
            });
        }
        return getEntryResponse;
    }),
    _deleteQLChart: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: ql_1.deleteQLChartArgsSchema,
        resultSchema: ql_1.deleteQLChartResultSchema,
    }, async (api, { chartId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        await typedApi.us._deleteUSEntry({
            entryId: chartId,
            scope: __1.EntryScope.Widget,
            types: __1.ENTRY_TYPES.ql,
        });
        return {};
    }),
};
