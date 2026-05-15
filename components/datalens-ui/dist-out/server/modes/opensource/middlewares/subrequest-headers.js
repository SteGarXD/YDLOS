"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSubrequestHeaders = setSubrequestHeaders;
const shared_1 = require("../../../../shared");
// Middleware for generating authorization headers that will then go to subqueries in ChartsEngine
function setSubrequestHeaders(req, res, next) {
    var _a;
    const subrequestHeaders = {};
    // most likely these flags are not needed
    const authFlags = {};
    if (req.headers.authorization) {
        subrequestHeaders.authorization = req.headers.authorization;
        if (req.headers.authorization.startsWith('OAuth ')) {
            authFlags.oauth = true;
        }
    }
    const { folderId: folderIdHeader, subjectToken: subjectTokenHeader } = req.ctx.config.headersMap;
    const folderId = req.headers[folderIdHeader];
    const tenantId = req.headers[shared_1.TENANT_ID_HEADER];
    if (folderId) {
        // TODO: in the future, abandon this header when BI supports TenantId
        subrequestHeaders[folderIdHeader] = folderId;
    }
    else if (tenantId) {
        subrequestHeaders[shared_1.TENANT_ID_HEADER] = tenantId;
    }
    req.headers[subjectTokenHeader] = (_a = res.locals.iam) === null || _a === void 0 ? void 0 : _a.token;
    if (req.headers[shared_1.RPC_AUTHORIZATION]) {
        subrequestHeaders[shared_1.RPC_AUTHORIZATION] = req.headers[shared_1.RPC_AUTHORIZATION];
    }
    if (req.headers[subjectTokenHeader]) {
        subrequestHeaders[subjectTokenHeader] = req.headers[subjectTokenHeader];
    }
    if (req.headers.cookie) {
        subrequestHeaders.cookie = req.headers.cookie;
    }
    if (res.locals.tvm) {
        authFlags.tvm = true;
    }
    subrequestHeaders[shared_1.DL_CONTEXT_HEADER] = req.headers[shared_1.DL_CONTEXT_HEADER];
    subrequestHeaders[shared_1.DL_COMPONENT_HEADER] = req.headers[shared_1.DL_COMPONENT_HEADER];
    res.locals.subrequestHeaders = subrequestHeaders;
    res.locals.authFlags = authFlags;
    next();
}
