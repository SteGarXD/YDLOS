"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const shared_1 = require("../../../../../shared");
const ql_chart_runner_1 = require("./ql-chart-runner");
exports.plugin = {
    runners: [
        {
            name: 'ql',
            trigger: new Set([
                shared_1.QL_TYPE.TIMESERIES_QL_NODE,
                shared_1.QL_TYPE.GRAPH_QL_NODE,
                shared_1.QL_TYPE.D3_QL_NODE,
                shared_1.QL_TYPE.TABLE_QL_NODE,
                shared_1.QL_TYPE.YMAP_QL_NODE,
                shared_1.QL_TYPE.METRIC_QL_NODE,
                shared_1.QL_TYPE.MARKUP_QL_NODE,
                shared_1.QL_TYPE.LEGACY_GRAPH_QL_NODE,
                shared_1.QL_TYPE.LEGACY_TABLE_QL_NODE,
                shared_1.QL_TYPE.LEGACY_YMAP_QL_NODE,
                shared_1.QL_TYPE.LEGACY_METRIC_QL_NODE,
            ]),
            safeConfig: true,
            handler: ql_chart_runner_1.runQlChart,
        },
    ],
};
