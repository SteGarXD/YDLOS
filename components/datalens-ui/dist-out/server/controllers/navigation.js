"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationController = void 0;
const shared_1 = require("../../shared");
const registry_1 = require("../registry");
const utils_1 = __importDefault(require("../utils"));
/* eslint-disable consistent-return */
const navigationController = async (req, res) => {
    const { query, ctx } = req;
    const layoutConfig = await registry_1.registry.useGetLayoutConfig({
        req,
        res,
        settingsId: 'navigation',
    });
    let entry;
    if (query && query.path) {
        try {
            const { currentTenantId } = res.locals;
            const key = query.path.replace(/^\//, '');
            ctx.log('GET_ENTRY_BY_KEY_REQUEST', { key });
            const { gatewayApi } = registry_1.registry.getGatewayApi();
            const { responseData } = await gatewayApi.us.getEntryByKey({
                ctx,
                headers: {
                    ...req.headers,
                    [shared_1.TENANT_ID_HEADER]: currentTenantId,
                    ...(req.ctx.config.isZitadelEnabled ? { ...utils_1.default.pickZitadelHeaders(req) } : {}),
                    ...(req.ctx.config.isAuthEnabled ? { ...utils_1.default.pickAuthHeaders(req) } : {}),
                },
                requestId: req.id,
                authArgs: { iamToken: res.locals.iamToken },
                args: { key },
            });
            entry = responseData;
            ctx.log('GET_ENTRY_BY_KEY_SUCCESS', { entryId: entry.entryId });
        }
        catch (e) {
            const { error } = e;
            ctx.logError('GET_ENTRY_BY_KEY_FAILED', error);
            res.send(res.renderDatalensLayout(layoutConfig));
            return;
        }
    }
    if (entry) {
        const { handleEntryRedirect } = registry_1.registry.common.functions.getAll();
        return handleEntryRedirect(entry, res);
    }
    else {
        res.send(res.renderDatalensLayout(layoutConfig));
        return;
    }
};
exports.navigationController = navigationController;
