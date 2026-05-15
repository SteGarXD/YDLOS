"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppLayoutMiddleware = createAppLayoutMiddleware;
const app_layout_1 = require("@gravity-ui/app-layout");
function createAppLayoutMiddleware(args) {
    const { plugins, getAppLayoutSettings } = args;
    return function appLayoutMiddleware(req, res, next) {
        req.originalContext.set('getAppLayoutSettings', getAppLayoutSettings);
        // eslint-disable-next-line no-param-reassign
        res.renderDatalensLayout = (0, app_layout_1.createRenderFunction)([...plugins]);
        next();
    };
}
