"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverFeatureWithBoundedContext = serverFeatureWithBoundedContext;
const shared_1 = require("../../shared");
async function serverFeatureWithBoundedContext(req, _, next) {
    req.originalContext.set('isEnabledServerFeature', (0, shared_1.getEnabledServerFeatureWithBoundedContext)(req.originalContext));
    next();
}
