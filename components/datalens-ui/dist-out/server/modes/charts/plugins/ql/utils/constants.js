"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERY_ALIAS_TITLE = exports.QUERY_TITLE = exports.PIE_VISUALIZATIONS = exports.LINEAR_VISUALIZATIONS = exports.DEFAULT_DATETIME_FORMAT = exports.DEFAULT_DATE_FORMAT = exports.LOG_INFO = exports.LOG_TIMING = void 0;
const shared_1 = require("../../../../../../shared");
exports.LOG_TIMING = 'process' in globalThis && (0, shared_1.isTrueArg)(process.env.SHOW_CHARTS_LOG_TIMING);
exports.LOG_INFO = 'process' in globalThis && (0, shared_1.isTrueArg)(process.env.SHOW_CHARTS_LOG);
exports.DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
exports.DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
exports.LINEAR_VISUALIZATIONS = new Set([
    shared_1.VISUALIZATION_IDS.LINE,
    shared_1.VISUALIZATION_IDS.AREA,
    shared_1.VISUALIZATION_IDS.AREA_100P,
    shared_1.VISUALIZATION_IDS.COLUMN,
    shared_1.VISUALIZATION_IDS.COLUMN_100P,
    shared_1.VISUALIZATION_IDS.BAR,
    shared_1.VISUALIZATION_IDS.BAR_100P,
]);
exports.PIE_VISUALIZATIONS = new Set([shared_1.VISUALIZATION_IDS.PIE, shared_1.VISUALIZATION_IDS.DONUT]);
exports.QUERY_TITLE = 'query #';
exports.QUERY_ALIAS_TITLE = '_alias';
