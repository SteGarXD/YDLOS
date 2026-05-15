"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../shared");
exports.default = {
    module: 'libs/datalens/v3',
    identifyParams: () => {
        return {};
    },
    identifyChartType: (chart, req) => {
        var _a, _b;
        let visualizationId;
        if (chart.visualization &&
            chart.visualization.id &&
            /[a-zA-Z]+/.test(chart.visualization.id)) {
            visualizationId = chart.visualization.id;
        }
        else {
            throw new Error('UNABLE_TO_IDENTIFY_CHART_TYPE');
        }
        const { ctx } = req;
        const features = {
            GravityChartsForPieAndTreemap: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForPieAndTreemap),
            GravityChartsForBarYAndScatter: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForBarYAndScatter),
            GravityChartsForLineAreaAndBarX: ctx.get('isEnabledServerFeature')(shared_1.Feature.GravityChartsForLineAreaAndBarX),
        };
        if ((0, shared_1.isGravityChartsVisualization)({ id: visualizationId, features })) {
            return 'd3_wizard_node';
        }
        switch (visualizationId) {
            case shared_1.WizardVisualizationId.FlatTable:
            case shared_1.WizardVisualizationId.PivotTable: {
                return 'table_wizard_node';
            }
            case shared_1.WizardVisualizationId.Geolayer:
            case 'geopoint':
            case 'geopolygon':
            case 'heatmap': {
                return 'ymap_wizard_node';
            }
            case shared_1.WizardVisualizationId.Metric: {
                const { placeholders } = chart.visualization;
                // @ts-ignore will be removed after migration to v5
                const dataType = (_b = (_a = placeholders.find((p) => p.id === 'measures')) === null || _a === void 0 ? void 0 : _a.items[0]) === null || _b === void 0 ? void 0 : _b.data_type;
                const useMarkup = dataType === 'markup';
                if (useMarkup) {
                    return 'markup_wizard_node';
                }
                else {
                    return 'metric_wizard_node';
                }
            }
            default: {
                return 'graph_wizard_node';
            }
        }
    },
    identifyLinks: (chart) => {
        const config = (0, shared_1.mapChartsConfigToLatestVersion)(chart);
        return (0, shared_1.getDatasetLinks)(config);
    },
};
