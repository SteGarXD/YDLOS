"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthLayout = void 0;
const registry_1 = require("../../../registry");
const getAuthLayout = async (req, res, pageSettings) => {
    const layoutConfig = await registry_1.registry.useGetLayoutConfig({
        req,
        res,
        settingsId: 'auth-layout',
    });
    layoutConfig.data.DL.authPageSettings = {
        ...pageSettings,
        isAuthPage: true,
    };
    return res.renderDatalensLayout(layoutConfig);
};
exports.getAuthLayout = getAuthLayout;
