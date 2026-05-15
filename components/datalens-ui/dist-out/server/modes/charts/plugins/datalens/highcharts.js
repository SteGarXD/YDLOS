"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHighchartsConfigPrivate = void 0;
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../shared");
const visualization_1 = require("../../../../../shared/constants/visualization");
const axis_helpers_1 = require("./utils/axis-helpers");
const config_helpers_1 = require("./utils/config-helpers");
const misc_helpers_1 = require("./utils/misc-helpers");
// eslint-disable-next-line complexity
const buildHighchartsConfigPrivate = (args) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const shared = (0, config_helpers_1.mapChartsConfigToServerConfig)(args.shared);
    if (['geolayer', 'geopoint', 'geopolygon', 'heatmap', 'polyline'].includes(shared.visualization.id)) {
        // center and zoom are specified as the default value if bounds does not arrive
        // if bounds comes, then center and zoom are ignored
        return {
            state: {
                center: [55.76, 37.64],
                zoom: 8,
                controls: ['zoomControl'],
                behaviors: ['drag', 'scrollZoom', 'multiTouch'],
            },
            options: {},
        };
    }
    const tooltip = {};
    let legend = {};
    let colorAxis;
    let xAxis = {
        endOnTick: false,
    };
    let yAxis = {};
    const chart = {
        type: shared.visualization.highchartsId || shared.visualization.id,
        zoomType: 'x',
    };
    if (shared.visualization.id === shared_1.WizardVisualizationId.CombinedChart) {
        chart.type = '';
    }
    const plotOptions = {};
    const axisWithAppliedSettings = applyCommonAxisSettings({ shared, xAxis, yAxis });
    xAxis = axisWithAppliedSettings.xAxis;
    yAxis = axisWithAppliedSettings.yAxis;
    // We apply settings that are unique for each type of visualization
    const visualizationsIds = [shared.visualization.id].concat((shared.visualization.layers || []).map((layer) => layer.id));
    visualizationsIds.forEach((visualizationId) => {
        var _a;
        switch (visualizationId) {
            case shared_1.WizardVisualizationId.Line: {
                chart.zoomType = 'xy';
                legend.symbolWidth = 38;
                break;
            }
            case shared_1.WizardVisualizationId.Column:
            case shared_1.WizardVisualizationId.Column100p:
            case shared_1.WizardVisualizationId.Bar:
            case shared_1.WizardVisualizationId.Bar100p:
            case shared_1.WizardVisualizationId.CombinedChart: {
                chart.zoomType = 'xy';
                legend.labelFormatter = shared_1.ChartkitHandlers.WizardLabelFormatter;
                break;
            }
        }
        extendPlotOptions({ visualizationId: shared.visualization.id, plotOptions });
        (_a = shared.visualization.layers) === null || _a === void 0 ? void 0 : _a.forEach((layer) => {
            extendPlotOptions({ visualizationId: layer.id, plotOptions });
        });
    });
    if (shared.visualization.id === shared_1.WizardVisualizationId.Area) {
        plotOptions.area = {
            stacking: ((_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.stacking) !== 'off' ? 'normal' : undefined,
        };
    }
    if (shared.visualization.id === shared_1.WizardVisualizationId.Scatter) {
        plotOptions.series = { turboThreshold: 100000 };
        plotOptions.scatter = {
            tooltip: {
                formatter: shared_1.ChartkitHandlers.WizardScatterTooltipFormatter,
            },
        };
        chart.zoomType = 'xy';
        const xPlaceholder = shared.visualization.placeholders.find((placeholder) => placeholder.id === 'x');
        if (xPlaceholder && xPlaceholder.items.length) {
            const xItem = xPlaceholder.items[0];
            if ((0, shared_1.isDateField)(xItem)) {
                xAxis.type = 'datetime';
            }
        }
        if (!Array.isArray(yAxis)) {
            yAxis.labels = { ...(yAxis.labels || {}) };
            const yPlaceholder = shared.visualization.placeholders.find((placeholder) => placeholder.id === 'y');
            if (yPlaceholder && yPlaceholder.items.length) {
                const yItem = yPlaceholder.items[0];
                if ((0, shared_1.isDateField)(yItem)) {
                    yAxis.type = 'datetime';
                }
                if (!(0, misc_helpers_1.isNumericalDataType)(yItem.data_type) &&
                    !(0, shared_1.isDateField)(yItem) &&
                    ((_b = yPlaceholder.settings) === null || _b === void 0 ? void 0 : _b.axisFormatMode) !== "by-field" /* AxisLabelFormatMode.ByField */) {
                    // A special formatter that returns text labels on the Y axis
                    // @ts-ignore
                    yAxis.labels.formatter = shared_1.ChartkitHandlers.WizardScatterYAxisLabelFormatter;
                }
            }
        }
    }
    if (shared.visualization.id === shared_1.WizardVisualizationId.Treemap) {
        chart.zoomType = undefined;
        plotOptions.treemap = {
            tooltip: {
                pointFormatter: shared_1.ChartkitHandlers.WizardTreemapTooltipFormatter,
            },
        };
    }
    if (((_c = shared.extraSettings) === null || _c === void 0 ? void 0 : _c.legendMode) === "hide" /* LegendDisplayMode.Hide */) {
        legend = {
            enabled: false,
        };
    }
    if (((_d = shared.extraSettings) === null || _d === void 0 ? void 0 : _d.tooltip) === 'hide') {
        tooltip.enabled = false;
    }
    if (((_e = shared.extraSettings) === null || _e === void 0 ? void 0 : _e.labelsPosition) &&
        visualizationsIds.some((id) => shared_1.VISUALIZATIONS_WITH_LABELS_POSITION.has(id))) {
        plotOptions.series = {
            ...plotOptions.series,
            dataLabels: {
                ...(_f = plotOptions.series) === null || _f === void 0 ? void 0 : _f.dataLabels,
                inside: ((_g = shared.extraSettings) === null || _g === void 0 ? void 0 : _g.labelsPosition) !== shared_1.LabelsPositions.Outside,
            },
        };
    }
    const allowOverlap = ((_h = shared.extraSettings) === null || _h === void 0 ? void 0 : _h.overlap) === 'on';
    plotOptions.series = {
        ...plotOptions.series,
        dataGrouping: {
            ...(_j = plotOptions.series) === null || _j === void 0 ? void 0 : _j.dataGrouping,
            enabled: false,
        },
        dataLabels: {
            ...(_k = plotOptions.series) === null || _k === void 0 ? void 0 : _k.dataLabels,
            allowOverlap,
        },
    };
    const navigator = {
        series: {
            dataLabels: { color: 'transparent' },
            fillOpacity: 0.15,
        },
    };
    switch (shared.visualization.id) {
        case shared_1.WizardVisualizationId.Column: {
            (0, set_1.default)(navigator, 'yAxis.softMin', 0);
            break;
        }
    }
    const result = {
        chart,
        legend,
        xAxis,
        yAxis,
        tooltip,
        colorAxis,
        plotOptions,
        // https://api.highcharts.com/highstock/navigator.series
        // Option navigator.series.dataLabels.enabled = false does not work (highcharts v8.2.2)
        // The documentation says that the series between the chart and the navigator are fumbling, and apparently,
        // because of this, there is a problem when trying to hide dataLabels, because they are marked in the series
        navigator,
    };
    (0, misc_helpers_1.log)('HIGHCHARTS:');
    (0, misc_helpers_1.log)(result);
    return result;
};
exports.buildHighchartsConfigPrivate = buildHighchartsConfigPrivate;
const applyCommonAxisSettings = ({ shared, xAxis, yAxis, }) => {
    var _a;
    const visualization = shared.visualization;
    const ignore = {
        title: Boolean((shared.segments || []).length),
    };
    // Apply common settings for axes
    if (visualization.id === shared_1.WizardVisualizationId.Line ||
        visualization.id === shared_1.WizardVisualizationId.Area ||
        visualization.id === shared_1.WizardVisualizationId.Area100p ||
        visualization.id === shared_1.WizardVisualizationId.Column ||
        visualization.id === shared_1.WizardVisualizationId.Column100p ||
        visualization.id === shared_1.WizardVisualizationId.Bar ||
        visualization.id === shared_1.WizardVisualizationId.Bar100p ||
        visualization.id === shared_1.WizardVisualizationId.Scatter ||
        visualization.id === shared_1.WizardVisualizationId.CombinedChart) {
        let x;
        let y;
        let y2;
        if (visualization.id === shared_1.WizardVisualizationId.CombinedChart) {
            (_a = visualization.layers) === null || _a === void 0 ? void 0 : _a.forEach((layer) => {
                const placeholders = layer.placeholders;
                x = (x === null || x === void 0 ? void 0 : x.items.length) ? x : placeholders[0];
                y = (y === null || y === void 0 ? void 0 : y.items.length) ? y : placeholders[1];
                y2 = (y2 === null || y2 === void 0 ? void 0 : y2.items.length) ? y2 : placeholders[2];
            });
        }
        else {
            const placeholders = visualization.placeholders;
            x = placeholders[0];
            y = placeholders[1];
            y2 = placeholders[2];
        }
        let axes = [
            xAxis,
        ];
        let axesData = [x];
        if ((y === null || y === void 0 ? void 0 : y.items.length) && (y2 === null || y2 === void 0 ? void 0 : y2.items.length)) {
            yAxis = [
                {
                    opposite: false,
                    labels: {
                        y: 3,
                    },
                },
                {
                    opposite: true,
                    labels: {
                        y: 3,
                    },
                },
            ];
            axes = [...axes, yAxis[0], yAxis[1]];
            axesData = [...axesData, y, y2];
        }
        else {
            yAxis.opposite = Boolean(!(y === null || y === void 0 ? void 0 : y.items.length) && (y2 === null || y2 === void 0 ? void 0 : y2.items.length));
            yAxis.labels = {
                y: 3,
            };
            axes = [...axes, yAxis];
            const isY2HasItems = y2 && y2.items.length;
            axesData = [...axesData, isY2HasItems ? y2 : y];
        }
        // eslint-disable-next-line complexity
        axes.forEach((axis, i) => {
            const axisData = axesData[i];
            (0, axis_helpers_1.applyPlaceholderSettingsToAxis)(axisData, axis, ignore);
        });
    }
    // Due to fractional values (presumably) highcharts sometimes incorrectly calculates the maximum
    // in this case, the chart is displayed correctly, but the maximum value on the y axis becomes more than 100 percent
    if (visualization_1.PERCENT_VISUALIZATIONS.has(visualization.id) && !('max' in yAxis)) {
        (0, set_1.default)(yAxis, 'max', 100);
    }
    return { xAxis, yAxis };
};
const extendPlotOptions = ({ visualizationId, plotOptions }) => {
    switch (visualizationId) {
        case shared_1.WizardVisualizationId.Column:
            plotOptions.column = plotOptions.column || {};
            plotOptions.column.stacking = 'normal';
            break;
        case shared_1.WizardVisualizationId.Bar:
            plotOptions.bar = plotOptions.bar || {};
            plotOptions.bar.stacking = 'normal';
            break;
        case shared_1.WizardVisualizationId.Column100p:
            plotOptions.column = plotOptions.column || {};
            plotOptions.column.stacking = 'percent';
            break;
        case 'area':
            plotOptions.area = {
                stacking: 'normal',
            };
            break;
        case shared_1.WizardVisualizationId.Bar100p:
            plotOptions.bar = plotOptions.bar || {};
            plotOptions.bar.stacking = 'percent';
            break;
        case shared_1.WizardVisualizationId.Area100p:
            plotOptions.area = {
                stacking: 'percent',
            };
            break;
        case shared_1.WizardVisualizationId.Pie:
            plotOptions.pie = {
                allowPointSelect: false,
            };
            break;
        case shared_1.WizardVisualizationId.Donut:
            plotOptions.pie = {
                allowPointSelect: false,
                innerSize: '50%',
            };
            break;
    }
    switch (visualizationId) {
        case shared_1.WizardVisualizationId.Column:
        case shared_1.WizardVisualizationId.Column100p:
        case shared_1.WizardVisualizationId.Bar:
        case shared_1.WizardVisualizationId.Bar100p: {
            plotOptions.column = plotOptions.column || {};
            plotOptions.column.dataGrouping = plotOptions.column.dataGrouping || {};
            // CHARTS-6460
            plotOptions.column.dataGrouping.enabled = false;
            plotOptions.column.maxPointWidth = 50;
            plotOptions.bar = plotOptions.bar || {};
            break;
        }
    }
};
