"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHTML = renderHTML;
const markdown_1 = require("../../../../shared/modules/markdown/markdown");
const registry_1 = require("../../../registry");
function renderHTML(args, additionalPlugins = []) {
    var _a;
    const plugins = (_a = registry_1.registry.getYfmPlugins()) !== null && _a !== void 0 ? _a : [];
    return (0, markdown_1.renderHTML)({
        ...args,
        plugins: [...plugins, ...additionalPlugins],
    });
}
