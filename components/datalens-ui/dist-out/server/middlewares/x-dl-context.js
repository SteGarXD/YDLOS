"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xDlContext = xDlContext;
const shared_1 = require("../../shared");
function xDlContext({ plugins = [], } = {}) {
    return function xDlContextMiddleware(req, _, next) {
        const { folderId: folderIdHeader } = req.ctx.config.headersMap;
        const folderId = req.headers[folderIdHeader];
        const tenantId = req.headers[shared_1.TENANT_ID_HEADER];
        const context = {
            remoteAddress: req.headers['x-real-ip'],
            userAgent: req.headers['user-agent'],
            folderId: folderId || tenantId,
            tenantId,
            requestId: req.headers[shared_1.REQUEST_ID_HEADER],
            rpcAuthorization: req.headers[shared_1.RPC_AUTHORIZATION],
            referer: req.ctx.utils.redactSensitiveQueryParams(req.headers['referer']),
        };
        if (req.headers[shared_1.DASH_INFO_HEADER]) {
            const parsedDashInfo = new URLSearchParams((req.headers[shared_1.DASH_INFO_HEADER] || '').toString());
            const dashId = parsedDashInfo.get('dashId');
            const dashTabId = parsedDashInfo.get('dashTabId');
            if (dashId) {
                context.dashId = dashId;
            }
            if (dashTabId) {
                context.dashTabId = dashTabId;
            }
        }
        const dispayMode = req.headers[shared_1.DISPLAY_MODE_HEADER];
        if (dispayMode) {
            context.displayMode = dispayMode;
        }
        req.headers[shared_1.DL_CONTEXT_HEADER] = JSON.stringify(plugins.length > 0
            ? plugins.reduce((memo, plugin) => ({ ...memo, ...plugin(req, memo) }), context)
            : context);
        req.originalContext.set('tenantId', tenantId && Array.isArray(tenantId) ? tenantId.join(',') : tenantId);
        next();
    };
}
