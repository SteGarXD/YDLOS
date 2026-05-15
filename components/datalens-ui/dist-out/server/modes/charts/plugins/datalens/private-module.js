"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.datalensModule = void 0;
const config_1 = require("./config");
const highcharts_1 = require("./highcharts");
const js_1 = require("./js/js");
const build_sources_1 = require("./url/build-sources");
const misc_helpers_1 = require("./utils/misc-helpers");
exports.datalensModule = {
    buildHighchartsConfig: highcharts_1.buildHighchartsConfigPrivate,
    buildSources: build_sources_1.buildSourcesPrivate,
    buildGraph: js_1.buildGraphPrivate,
    buildChartsConfig: config_1.buildChartsConfigPrivate,
    setConsole: misc_helpers_1.setConsole,
};
