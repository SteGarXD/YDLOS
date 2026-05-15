"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../shared");
const ql_1 = require("../../../shared/modules/config/ql");
const language_1 = require("../../../shared/modules/language");
const identify_params_1 = require("../../modes/charts/plugins/ql/utils/identify-params");
exports.default = {
    module: 'libs/qlchart/v1',
    identifyParams: (chart, req) => {
        const i18nServer = req.ctx.get('i18n');
        const getTranslation = (0, language_1.getTranslationFn)(i18nServer.getI18nServer());
        return (0, identify_params_1.identifyParams)({ chart, getTranslation });
    },
    identifyChartType: (chart, req) => {
        var _a, _b;
        const i18nServer = req.ctx.get('i18n');
        const config = (0, ql_1.mapQlConfigToLatestVersion)(chart, {
            i18n: (0, language_1.getTranslationFn)(i18nServer.getI18nServer()),
        });
        const { visualization, chartType } = config;
        const id = visualization.id;
        const { ctx } = req;
        const features = {
            GravityChartsForPieAndTreemap: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForPieAndTreemap),
            GravityChartsForBarYAndScatter: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForBarYAndScatter),
            GravityChartsForLineAreaAndBarX: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForLineAreaAndBarX),
        };
        if ((0, shared_1.isGravityChartsVisualization)({ id, features })) {
            return shared_1.QL_TYPE.D3_QL_NODE;
        }
        switch (id) {
            case 'table': // Legacy
            case shared_1.WizardVisualizationId.FlatTable: // Available with WizardQLCommonVisualization feature
                return shared_1.QL_TYPE.TABLE_QL_NODE;
            case shared_1.WizardVisualizationId.Line:
            case shared_1.WizardVisualizationId.Area:
            case shared_1.WizardVisualizationId.Area100p:
            case shared_1.WizardVisualizationId.Column:
            case shared_1.WizardVisualizationId.Column100p:
                if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
                    return shared_1.QL_TYPE.TIMESERIES_QL_NODE;
                }
                else {
                    return shared_1.QL_TYPE.GRAPH_QL_NODE;
                }
            case shared_1.WizardVisualizationId.Metric: {
                const { placeholders } = chart.visualization;
                let useMarkup;
                if (placeholders) {
                    const dataType = (_b = (_a = placeholders.find((p) => p.id === 'measures')) === null || _a === void 0 ? void 0 : _a.items[0]) === null || _b === void 0 ? void 0 : _b.data_type;
                    useMarkup = dataType === 'markup';
                }
                else {
                    // Case for legacy ql charts before integration with wizard
                    useMarkup = true;
                }
                if (useMarkup) {
                    return shared_1.QL_TYPE.MARKUP_QL_NODE;
                }
                else {
                    return shared_1.QL_TYPE.METRIC_QL_NODE;
                }
            }
            default:
                return shared_1.QL_TYPE.GRAPH_QL_NODE;
        }
    },
    identifyLinks: (chart, req) => {
        const i18nServer = req.ctx.get('i18n');
        const config = (0, ql_1.mapQlConfigToLatestVersion)(chart, {
            i18n: (0, language_1.getTranslationFn)(i18nServer.getI18nServer()),
        });
        return {
            connection: config.connection.entryId,
        };
    },
};
