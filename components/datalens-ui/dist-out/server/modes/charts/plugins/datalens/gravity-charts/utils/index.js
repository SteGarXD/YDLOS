"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartTitle = getChartTitle;
exports.getAxisLabelsRotationAngle = getAxisLabelsRotationAngle;
exports.getBaseChartConfig = getBaseChartConfig;
const shared_1 = require("../../../../../../../shared");
const axis_helpers_1 = require("../../utils/axis-helpers");
function getChartTitle(settings) {
    if ((settings === null || settings === void 0 ? void 0 : settings.titleMode) !== 'hide' && (settings === null || settings === void 0 ? void 0 : settings.title)) {
        return {
            text: settings.title,
        };
    }
    return undefined;
}
function getAxisLabelsRotationAngle(placeholderSettings) {
    switch (placeholderSettings === null || placeholderSettings === void 0 ? void 0 : placeholderSettings.labelsView) {
        case 'horizontal': {
            return 0;
        }
        case 'vertical': {
            return 90;
        }
        case 'angle': {
            return 45;
        }
    }
    return undefined;
}
function getAxisMinMax(placeholderSettings) {
    if ((placeholderSettings === null || placeholderSettings === void 0 ? void 0 : placeholderSettings.scale) !== 'manual' ||
        !Array.isArray(placeholderSettings === null || placeholderSettings === void 0 ? void 0 : placeholderSettings.scaleValue)) {
        return [undefined, undefined];
    }
    const min = Number(placeholderSettings.scaleValue[0]);
    const max = Number(placeholderSettings.scaleValue[1]);
    return [Number.isNaN(min) ? undefined : min, Number.isNaN(max) ? undefined : max];
}
function getBaseChartConfig(args) {
    var _a;
    const { extraSettings, visualization } = args;
    const isLegendEnabled = (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.legendMode) !== 'hide';
    const xPlaceholder = visualization.placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xItem = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
    const xPlaceholderSettings = (xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) || {};
    const yPlaceholder = visualization.placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yPlaceholderSettings = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) || {};
    const yItem = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items[0];
    let chartWidgetData = {
        title: getChartTitle(extraSettings),
        tooltip: {
            enabled: (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.tooltip) !== 'hide',
            totals: {
                enabled: (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.tooltipSum) !== 'off',
            },
        },
        legend: { enabled: isLegendEnabled },
        series: {
            data: [],
            options: {
                'bar-x': {
                    barMaxWidth: 50,
                    barPadding: 0.05,
                    groupPadding: 0.4,
                    dataSorting: {
                        direction: 'desc',
                        key: 'name',
                    },
                },
                line: {
                    lineWidth: 1,
                    linecap: 'butt',
                },
            },
        },
        chart: {
            margin: {
                top: 10,
                left: 30,
                right: 56,
                bottom: 15,
            },
            zoom: {
                enabled: true,
                resetButton: {
                    align: 'top-right',
                    offset: { x: 2, y: 30 },
                    relativeTo: 'plot-box',
                },
            },
        },
    };
    const visualizationId = visualization.id;
    const visualizationWithoutAxis = [
        shared_1.WizardVisualizationId.Pie,
        shared_1.WizardVisualizationId.PieD3,
        shared_1.WizardVisualizationId.Donut,
        shared_1.WizardVisualizationId.DonutD3,
        shared_1.WizardVisualizationId.Treemap,
        shared_1.WizardVisualizationId.TreemapD3,
    ];
    const visualizationWithYMainAxis = [
        shared_1.WizardVisualizationId.Bar,
        shared_1.WizardVisualizationId.Bar100p,
        shared_1.WizardVisualizationId.BarYD3,
        shared_1.WizardVisualizationId.BarY100pD3,
    ];
    if (!visualizationWithoutAxis.includes(visualizationId)) {
        const [xMin, xMax] = getAxisMinMax(xPlaceholderSettings);
        const [yMin, yMax] = getAxisMinMax(yPlaceholderSettings);
        chartWidgetData = {
            ...chartWidgetData,
            xAxis: {
                visible: (xPlaceholderSettings === null || xPlaceholderSettings === void 0 ? void 0 : xPlaceholderSettings.axisVisibility) !== 'hide',
                labels: {
                    enabled: (xPlaceholderSettings === null || xPlaceholderSettings === void 0 ? void 0 : xPlaceholderSettings.hideLabels) !== 'yes',
                    rotation: getAxisLabelsRotationAngle(xPlaceholderSettings),
                    margin: 10,
                    style: {
                        fontSize: '13px',
                        fontWeight: '400',
                        fontColor: '#000000',
                    },
                },
                title: {
                    text: (0, axis_helpers_1.getAxisTitle)(xPlaceholderSettings, xItem) || undefined,
                    margin: 18,
                    align: 'center',
                    style: {
                        fontSize: '13px',
                        fontWeight: '400',
                        fontColor: '#000000',
                    },
                },
                grid: {
                    enabled: (0, axis_helpers_1.isGridEnabled)(xPlaceholderSettings),
                },
                ticks: {
                    pixelInterval: (0, axis_helpers_1.getTickPixelInterval)(xPlaceholderSettings) || 120,
                },
                lineColor: '#000000',
                min: xMin,
                max: xMax,
            },
            yAxis: [
                {
                    // todo: the axis type should depend on the type of field
                    type: (0, shared_1.isDateField)(yItem) ? 'datetime' : 'linear',
                    visible: (yPlaceholderSettings === null || yPlaceholderSettings === void 0 ? void 0 : yPlaceholderSettings.axisVisibility) !== 'hide',
                    labels: {
                        enabled: Boolean(yItem) && ((_a = yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) === null || _a === void 0 ? void 0 : _a.hideLabels) !== 'yes',
                        rotation: getAxisLabelsRotationAngle(yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings),
                        margin: 10,
                        style: {
                            fontSize: '13px',
                            fontWeight: '400',
                            fontColor: '#000000',
                        },
                    },
                    title: {
                        text: (0, axis_helpers_1.getAxisTitle)(yPlaceholderSettings, yItem) || undefined,
                        margin: 18,
                        style: {
                            fontSize: '13px',
                            fontWeight: '400',
                            fontColor: '#000000',
                        },
                    },
                    grid: {
                        enabled: Boolean(yItem) && (0, axis_helpers_1.isGridEnabled)(yPlaceholderSettings),
                    },
                    ticks: {
                        pixelInterval: (0, axis_helpers_1.getTickPixelInterval)(yPlaceholderSettings) || 72,
                    },
                    lineColor: '#000000',
                    min: yMin,
                    max: yMax,
                    position: 'right',
                },
            ],
        };
        if (visualizationWithYMainAxis.includes(visualizationId)) {
            chartWidgetData.xAxis = { ...chartWidgetData.xAxis, lineColor: 'transparent' };
        }
        else if (![
            shared_1.WizardVisualizationId.Line,
            shared_1.WizardVisualizationId.LineD3,
        ].includes(visualizationId)) {
            chartWidgetData.yAxis = (chartWidgetData.yAxis || []).map((yAxis) => ({
                ...yAxis,
                lineColor: 'transparent',
            }));
        }
    }
    return chartWidgetData;
}
