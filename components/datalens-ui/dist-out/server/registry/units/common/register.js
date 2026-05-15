"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommonPlugins = void 0;
const shared_1 = require("../../../../shared");
const utils_1 = require("../../../components/charts-engine/components/utils");
const gateway_auth_helpers_1 = require("../../../components/gateway-auth-helpers");
const handle_entry_redirect_1 = require("../../../controllers/utils/handle-entry-redirect");
const index_1 = require("../../index");
const registerCommonPlugins = () => {
    index_1.registry.common.functions.register({
        getAvailablePalettesMap: shared_1.getAvailablePalettesMap,
        getSourceAuthorizationHeaders: utils_1.getSourceAuthorizationHeaders,
        isEntryId: shared_1.isEntryId,
        extractEntryId: shared_1.extractEntryId,
        handleEntryRedirect: handle_entry_redirect_1.handleEntryRedirect,
    });
    index_1.registry.common.auth.register({
        getAuthArgsUSPrivate: gateway_auth_helpers_1.getAuthArgsUSPrivate,
        getAuthHeadersUSPrivate: gateway_auth_helpers_1.getAuthHeadersUSPrivate,
        getAuthArgsProxyUSPrivate: gateway_auth_helpers_1.getAuthArgsProxyUSPrivate,
        getAuthHeadersBIPrivate: gateway_auth_helpers_1.getAuthHeadersBIPrivate,
        hasValidWorkbookTransferAuthHeaders: gateway_auth_helpers_1.hasValidWorkbookTransferAuthHeaders,
        getAuthArgsProxyBIPrivate: gateway_auth_helpers_1.getAuthArgsProxyBIPrivate,
    });
};
exports.registerCommonPlugins = registerCommonPlugins;
