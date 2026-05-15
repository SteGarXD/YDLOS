"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controls_1 = require("./controls");
const js_1 = require("./js");
const url_1 = require("./url");
exports.default = {
    // Url
    buildSources: url_1.buildSources,
    // JavaScript
    buildGraph: js_1.buildGraph,
    // Controls
    buildUI: controls_1.buildUI,
    // Config
    buildChartsConfig: () => {
        return {};
    },
    // Highcharts
    buildHighchartsConfig: () => {
        return {};
    },
};
