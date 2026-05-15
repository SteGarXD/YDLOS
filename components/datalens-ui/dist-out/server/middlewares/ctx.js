"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCtxMiddleware = getCtxMiddleware;
const nodekit_1 = require("@gravity-ui/nodekit");
const chart_editor_developer_mode_access_check_1 = require("../components/chart-editor-developer-mode-access-check");
const markdown_1 = require("../components/charts-engine/components/markdown");
const resolve_entry_by_link_1 = __importDefault(require("../components/resolve-entry-by-link"));
function getCtxMiddleware() {
    return async function ctxMiddleware(req, _res, next) {
        req.originalContext.set('gateway', {
            reqBody: req.body,
            requestId: req.ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME),
            markdown: markdown_1.renderHTML,
            resolveEntryByLink: resolve_entry_by_link_1.default,
            checkRequestForDeveloperModeAccess: chart_editor_developer_mode_access_check_1.checkRequestForDeveloperModeAccess,
        });
        next();
    };
}
