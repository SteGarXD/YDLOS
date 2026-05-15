"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizardActions = void 0;
const __1 = require("../../..");
const error_1 = require("../../../constants/error");
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
const wizard_1 = require("../schemas/wizard");
exports.wizardActions = {
    // WIP
    __getWizardChart__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: wizard_1.getWizardChartArgsSchema,
        resultSchema: wizard_1.getWizardChartResultSchema,
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
            !__1.ENTRY_TYPES.wizard.includes(getEntryResponse.type)) {
            throw new error_1.ServerError('Entry not found', {
                status: 404,
            });
        }
        if (getEntryResponse.data) {
            const mappedData = (0, __1.mapChartsConfigToLatestVersion)(JSON.parse(getEntryResponse.data.shared));
            getEntryResponse.data.shared = JSON.stringify(mappedData);
        }
        return getEntryResponse;
    }),
    _deleteWizardChart: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: wizard_1.deleteWizardChartArgsSchema,
        resultSchema: wizard_1.deleteWizardChartResultSchema,
    }, async (api, { chartId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        await typedApi.us._deleteUSEntry({
            entryId: chartId,
            scope: __1.EntryScope.Widget,
            types: __1.ENTRY_TYPES.wizard,
        });
        return {};
    }),
};
