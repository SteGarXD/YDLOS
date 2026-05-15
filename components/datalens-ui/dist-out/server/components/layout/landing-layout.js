"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLandingLayout = void 0;
const registry_1 = require("../../registry");
const getLandingLayout = async (req, res, pageSettings) => {
    req.originalContext.set('landingPageSettings', pageSettings);
    req.ctx.set('landingPageSettings', pageSettings);
    const layoutConfig = await registry_1.registry.useGetLayoutConfig({
        req,
        res,
        settingsId: 'landing-layout',
    });
    return res.renderDatalensLayout(layoutConfig);
};
exports.getLandingLayout = getLandingLayout;
