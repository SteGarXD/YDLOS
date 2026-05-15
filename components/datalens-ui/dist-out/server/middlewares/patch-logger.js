"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchLogger = patchLogger;
function patchLogger(req, _res, next) {
    const logErrorCore = req.ctx.logError;
    // It is suspicious that monkey patching is only for utils, because there is still ctx
    req.ctx.logError = (message, error, extra) => {
        if (error && error.response) {
            if (error.response.request) {
                delete error.response.request.headers;
            }
            if (error.response.req) {
                delete error.response.req.headers;
            }
        }
        logErrorCore(message, error, extra);
    };
    next();
}
