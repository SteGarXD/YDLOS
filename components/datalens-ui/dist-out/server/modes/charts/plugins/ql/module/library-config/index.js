"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../shared");
const registry_1 = require("../../../../../../registry");
const build_library_config_1 = require("./build-library-config");
exports.default = ({ shared, ChartEditor }) => {
    const app = registry_1.registry.getApp();
    const features = (0, shared_1.getServerFeatures)(app.nodekit.ctx);
    return (0, build_library_config_1.buildLibraryConfig)({ shared, ChartEditor, features });
};
