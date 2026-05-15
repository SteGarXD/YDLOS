"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const registry_1 = require("../../../../../../registry");
const build_sources_1 = require("./build-sources");
function default_1({ shared, ChartEditor, features, }) {
    const { getAvailablePalettesMap } = registry_1.registry.common.functions.getAll();
    const palettes = getAvailablePalettesMap();
    const qlConnectionTypeMap = registry_1.registry.getQLConnectionTypeMap();
    return (0, build_sources_1.buildSources)({ shared, ChartEditor, palettes, qlConnectionTypeMap, features });
}
