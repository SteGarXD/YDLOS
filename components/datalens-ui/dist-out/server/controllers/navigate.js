"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigateController = void 0;
const shared_1 = require("../../shared");
const entry_1 = require("../../shared/utils/entry");
const registry_1 = require("../registry");
const utils_1 = __importDefault(require("../utils"));
function navigateDefault(reqPath, res) {
    return res.redirect(302, reqPath.replace('navigate', 'navigation'));
}
// eslint-disable-next-line complexity
const navigateController = async (req, res) => {
    const { url: reqUrl } = req;
    req.ctx.log('Navigate init', { reqUrl });
    try {
        req.ctx.log('Navigate redirect', { reqUrl });
        const possibleEntryId = req.params.entryId;
        if (!(0, shared_1.isEntryId)(possibleEntryId)) {
            req.ctx.log('Invalid entry id, navigate default', { reqUrl });
            return navigateDefault(reqUrl, res);
        }
        const { gatewayApi } = registry_1.registry.getGatewayApi();
        const { getAuthArgsUSPrivate } = registry_1.registry.common.auth.getAll();
        const { responseData: entryMeta } = await gatewayApi.usPrivate._getEntryMeta({
            ctx: req.ctx,
            headers: {
                ...req.headers,
                [shared_1.TENANT_ID_HEADER]: res.locals.currentTenantId,
                ...(req.ctx.config.isZitadelEnabled ? { ...utils_1.default.pickZitadelHeaders(req) } : {}),
                ...(req.ctx.config.isAuthEnabled ? { ...utils_1.default.pickAuthHeaders(req) } : {}),
            },
            requestId: req.id,
            authArgs: getAuthArgsUSPrivate(req, res),
            args: { entryId: possibleEntryId },
        });
        if (entryMeta && entryMeta.scope === 'widget') {
            const { type } = entryMeta;
            if (type.includes('ql')) {
                const qlUrl = reqUrl.replace('navigate', 'ql');
                req.ctx.log('Navigate to ql', { qlUrl });
                return res.redirect(302, qlUrl);
            }
            else if (type.includes('wizard')) {
                const wizardUrl = reqUrl.replace('navigate', 'wizard');
                req.ctx.log('Navigate to wizard', { wizardUrl });
                return res.redirect(302, wizardUrl);
            }
            else if ((0, entry_1.isEditorEntryType)(type)) {
                const editorUrl = reqUrl.replace('navigate', 'editor');
                req.ctx.log('Navigate to editor', { editorUrl });
                return res.redirect(302, editorUrl);
            }
            else {
                req.ctx.log('Unknown widget type, navigate default', { reqUrl });
                return navigateDefault(reqUrl, res);
            }
        }
        else {
            req.ctx.log('Entry is not widget, navigate default', { reqUrl });
            return navigateDefault(reqUrl, res);
        }
    }
    catch (error) {
        req.ctx.logError('Error occured in navigate', (error.error || error));
        return navigateDefault(reqUrl, res);
    }
};
exports.navigateController = navigateController;
