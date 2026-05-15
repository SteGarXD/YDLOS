import type {ChartData, ChartTitle} from '@gravity-ui/chartkit/gravity-charts';

import {PlaceholderId, WizardVisualizationId, isDateField} from '../../../../../../../shared';
import type {
    ServerCommonSharedExtraSettings,
    ServerPlaceholder,
    ServerPlaceholderSettings,
} from '../../../../../../../shared';
import {getAxisTitle, getTickPixelInterval, isGridEnabled} from '../../utils/axis-helpers';

export function getChartTitle(settings?: ServerCommonSharedExtraSettings): ChartTitle | undefined {
    if (settings?.titleMode !== 'hide' && settings?.title) {
        return {
            text: settings.title,
        };
    }

    return undefined;
}

export function getAxisLabelsRotationAngle(placeholderSettings?: ServerPlaceholderSettings) {
    switch (placeholderSettings?.labelsView) {
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

function getAxisMinMax(
    placeholderSettings?: ServerPlaceholderSettings,
): [number | undefined, number | undefined] {
    if (
        placeholderSettings?.scale !== 'manual' ||
        !Array.isArray(placeholderSettings?.scaleValue)
    ) {
        return [undefined, undefined];
    }

    const min = Number(placeholderSettings.scaleValue[0]);
    const max = Number(placeholderSettings.scaleValue[1]);

    return [Number.isNaN(min) ? undefined : min, Number.isNaN(max) ? undefined : max];
}

export function getBaseChartConfig(args: {
    extraSettings?: ServerCommonSharedExtraSettings;
    visualization: {id: string; placeholders: ServerPlaceholder[]};
}) {
    const {extraSettings, visualization} = args;
    const isLegendEnabled = extraSettings?.legendMode !== 'hide';

    const xPlaceholder = visualization.placeholders.find((p) => p.id === PlaceholderId.X);
    const xItem = xPlaceholder?.items[0];
    const xPlaceholderSettings = xPlaceholder?.settings || {};

    const yPlaceholder = visualization.placeholders.find((p) => p.id === PlaceholderId.Y);
    const yPlaceholderSettings = yPlaceholder?.settings || {};
    const yItem = yPlaceholder?.items[0];

    let chartWidgetData: Partial<ChartData> = {
        title: getChartTitle(extraSettings),
        tooltip: {
            enabled: extraSettings?.tooltip !== 'hide',
            // Сумма в тултипе только если явно включена. По умолчанию 'off' (переключатель в «Настройки чарта»).
            totals: {
                enabled: extraSettings?.tooltipSum === 'on',
            },
        },
        legend: {enabled: isLegendEnabled},
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
                    /** Avoid round caps at the right plot edge stacking with Y-axis ticks (butt = flush end). */
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
                    offset: {x: 2, y: 30},
                    relativeTo: 'plot-box',
                },
            },
        },
    };

    const visualizationId = visualization.id as WizardVisualizationId;
    const visualizationWithoutAxis = [
        WizardVisualizationId.Pie,
        WizardVisualizationId.PieD3,
        WizardVisualizationId.Donut,
        WizardVisualizationId.DonutD3,
        WizardVisualizationId.Treemap,
        WizardVisualizationId.TreemapD3,
    ];

    const visualizationWithYMainAxis = [
        WizardVisualizationId.Bar,
        WizardVisualizationId.Bar100p,
        WizardVisualizationId.BarYD3,
        WizardVisualizationId.BarY100pD3,
    ];

    // Line charts have both X and Y axis lines visible
    const visualizationWithBothAxesVisible = [
        WizardVisualizationId.Line,
        WizardVisualizationId.LineD3,
    ];

    if (!visualizationWithoutAxis.includes(visualizationId)) {
        const [xMin, xMax] = getAxisMinMax(xPlaceholderSettings);
        const [yMin, yMax] = getAxisMinMax(yPlaceholderSettings);
        chartWidgetData = {
            ...chartWidgetData,
            xAxis: {
                visible: xPlaceholderSettings?.axisVisibility !== 'hide',
                labels: {
                    enabled: xPlaceholderSettings?.hideLabels !== 'yes',
                    rotation: getAxisLabelsRotationAngle(xPlaceholderSettings),
                    margin: 10,
                    style: {
                        fontSize: '13px',
                        fontWeight: '400',
                        fontColor: '#000000',
                    },
                },
                title: {
                    text: getAxisTitle(xPlaceholderSettings, xItem) || undefined,
                    margin: 18,
                    align: 'center',
                    style: {
                        fontSize: '13px',
                        fontWeight: '400',
                        fontColor: '#000000',
                    },
                },
                grid: {
                    enabled: isGridEnabled(xPlaceholderSettings),
                },
                ticks: {
                    pixelInterval: getTickPixelInterval(xPlaceholderSettings) || 120,
                },
                lineColor: '#000000',
                min: xMin,
                max: xMax,
            },
            yAxis: [
                {
                    // todo: the axis type should depend on the type of field
                    type: isDateField(yItem) ? 'datetime' : 'linear',
                    visible: yPlaceholderSettings?.axisVisibility !== 'hide',
                    labels: {
                        enabled: Boolean(yItem) && yPlaceholder?.settings?.hideLabels !== 'yes',
                        rotation: getAxisLabelsRotationAngle(yPlaceholder?.settings),
                        margin: 10,
                        style: {
                            fontSize: '13px',
                            fontWeight: '400',
                            fontColor: '#000000',
                        },
                    },
                    title: {
                        text: getAxisTitle(yPlaceholderSettings, yItem) || undefined,
                        margin: 18,
                        style: {
                            fontSize: '13px',
                            fontWeight: '400',
                            fontColor: '#000000',
                        },
                    },
                    grid: {
                        enabled: Boolean(yItem) && isGridEnabled(yPlaceholderSettings),
                    },
                    ticks: {
                        pixelInterval: getTickPixelInterval(yPlaceholderSettings) || 72,
                    },
                    lineColor: '#000000',
                    min: yMin,
                    max: yMax,
                    position: 'right',
                },
            ],
        };

        if (visualizationWithYMainAxis.includes(visualizationId)) {
            chartWidgetData.xAxis = {...chartWidgetData.xAxis, lineColor: 'transparent'};
        } else if (!visualizationWithBothAxesVisible.includes(visualizationId)) {
            chartWidgetData.yAxis = (chartWidgetData.yAxis || []).map((yAxis) => ({
                ...yAxis,
                lineColor: 'transparent',
            }));
        }
    }

    return chartWidgetData;
}
