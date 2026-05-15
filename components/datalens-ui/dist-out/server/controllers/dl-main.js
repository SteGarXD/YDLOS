"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dlMainController = void 0;
const registry_1 = require("../registry");
const dlMainController = async (req, res) => {
    const layoutConfig = await registry_1.registry.useGetLayoutConfig({ req, res, settingsId: 'dl-main' });
    res.send(res.renderDatalensLayout(layoutConfig));
    return;
};
exports.dlMainController = dlMainController;
