"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLibraryConfig = buildLibraryConfig;
const shared_1 = require("../../../../../../../shared");
const ql_1 = require("../../../../../../../shared/modules/config/ql");
const highcharts_1 = require("../../../datalens/highcharts");
const misc_helpers_1 = require("../../utils/misc-helpers");
const yagr_1 = __importDefault(require("../../yagr"));
const highcharts_2 = __importDefault(require("../highcharts"));
function buildLibraryConfig({ shared, ChartEditor, features }) {
    const config = (0, ql_1.mapQlConfigToLatestVersion)(shared, { i18n: ChartEditor.getTranslation });
    const visualization = config.visualization;
    if ((0, shared_1.isYAGRVisualization)(config.chartType, visualization.id)) {
        const result = (0, yagr_1.default)({ shared, ChartEditor });
        (0, misc_helpers_1.log)('LIBRARY CONFIG (YAGR):');
        (0, misc_helpers_1.log)(result);
        return result;
    }
    else if (visualization === null || visualization === void 0 ? void 0 : visualization.placeholders) {
        const result = (0, highcharts_1.buildHighchartsConfigPrivate)({
            // @ts-ignore we are passing empty arrays just as a stub
            shared: {
                ...config,
                filters: [],
                hierarchies: [],
                links: [],
                updates: [],
                version: shared_1.ChartsConfigVersion.V12,
                datasetsIds: [],
                datasetsPartialFields: [],
            },
            features,
        });
        (0, misc_helpers_1.log)('LIBRARY CONFIG (WIZARD HC):');
        (0, misc_helpers_1.log)(result);
        return result;
    }
    else {
        const result = (0, highcharts_2.default)({ shared: config, ChartEditor });
        (0, misc_helpers_1.log)('LIBRARY CONFIG (HC):');
        (0, misc_helpers_1.log)(result);
        return result;
    }
}
