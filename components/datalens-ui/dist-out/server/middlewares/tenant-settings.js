"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantSettingsMiddleware = getTenantSettingsMiddleware;
const nodekit_1 = require("@gravity-ui/nodekit");
const callbacks_1 = require("../callbacks");
const registry_1 = require("../registry");
function getTenantSettingsMiddleware() {
    async function resolveTenantSettings(req, res, next) {
        var _a;
        const { ctx } = req;
        const requestId = req.ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME);
        const currentTenantId = 'common';
        const { gatewayApi } = registry_1.registry.getGatewayApi();
        const { getAuthArgsUSPrivate } = registry_1.registry.common.auth.getAll();
        const authArgsUSPrivate = getAuthArgsUSPrivate(req, res);
        const tenantDetailsResponce = await gatewayApi.usPrivate._getTenantDetails({
            ctx,
            headers: req.headers,
            requestId: requestId !== null && requestId !== void 0 ? requestId : '',
            authArgs: authArgsUSPrivate,
            args: { tenantId: currentTenantId },
        });
        const resolvedTenant = tenantDetailsResponce.responseData;
        res.locals.tenantDefaultColorPaletteId = (_a = resolvedTenant.settings) === null || _a === void 0 ? void 0 : _a.defaultColorPaletteId;
        next();
    }
    return function resolveTenantSettingsMiddleware(req, res, next) {
        resolveTenantSettings(req, res, next)
            .catch((error) => {
            req.ctx.logError('TENANT_RESOLVED_FAILED', error);
            (0, callbacks_1.onFail)(req, res);
        })
            .catch((error) => next(error));
    };
}
