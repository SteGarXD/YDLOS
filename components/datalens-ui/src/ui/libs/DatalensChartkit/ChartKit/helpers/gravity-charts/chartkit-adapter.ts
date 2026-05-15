import type {ChartData, ChartSeriesData} from '@gravity-ui/chartkit/gravity-charts';
import {CustomShapeRenderer} from '@gravity-ui/chartkit/gravity-charts';
import {pickActionParamsFromParams} from '@gravity-ui/dashkit/helpers';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';
import type {ExtendedChartData} from 'shared/types/chartkit';

import type {GraphWidget} from '../../../types';
import type {ChartKitAdapterProps} from '../../types';
import {getTooltipHeaderFormat, getTooltipRenderer, getTooltipRowRenderer} from '../tooltip';
import {getNormalizedClickActions} from '../utils';

import {convertChartCommentsToPlotBandsAndLines, shouldUseCommentsOnYAxis} from './comments';
import {handleClick} from './event-handlers';
import {
    getCustomShapeRenderer,
    isPointSelected,
    setPointSelectState,
    setSeriesSelectState,
} from './utils';

export function getGravityChartsChartKitData(args: {
    loadedData: ChartKitAdapterProps['loadedData'];
    onChange?: ChartKitAdapterProps['onChange'];
    runActivity?: ChartKitAdapterProps['runActivity'];
}) {
    const {loadedData, runActivity, onChange} = args;
    const widgetData = loadedData?.data as ExtendedChartData;
    const legendCustomization = get(
        loadedData,
        'config.extraSettings.customization.pie.legend',
        {},
    ) as Record<string, unknown>;
    const chartId = loadedData?.entryId;

    const chartWidgetData: Partial<ChartData> = {
        chart: {
            events: {
                click: (data, event) => {
                    handleClick({
                        widgetData: loadedData as GraphWidget,
                        point: data.point,
                        series: widgetData.series.data.find(
                            (s) => get(s, 'name') === get(data.series, 'name'),
                        ),
                        event,
                        onChange,
                        runActivity,
                    });
                },
            },
        },
        legend: {
            justifyContent: 'start',
            itemDistance: 24,
            itemStyle: {
                fontSize: '13px',
            },
        },
        tooltip: {
            pin: {enabled: true, modifierKey: 'altKey'},
        },
        series: getStyledSeries(loadedData),
    };

    const result = merge({}, chartWidgetData, widgetData);

    if (!result.tooltip) {
        result.tooltip = {};
    }

    const tooltipQa = `chartkit-tooltip-entry-${chartId}`;
    result.tooltip.qa = tooltipQa;
    result.tooltip.renderer = getTooltipRenderer({
        widgetData,
        qa: tooltipQa,
    });
    result.tooltip.rowRenderer = getTooltipRowRenderer({
        widgetData,
    });
    result.tooltip.headerFormat = getTooltipHeaderFormat({
        widgetData,
    });

    result.series?.data.forEach((s) => {
        if (s.type === 'pie') {
            const rawSymbolType = legendCustomization.symbolType;
            // Gravity Charts рисует легенду по symbol.shape: 'rect' | 'path' | 'symbol' (не type).
            const existingSymbol = (s.legend?.symbol || {}) as {
                shape?: string;
                width?: number;
                height?: number;
                padding?: number;
                radius?: number;
            };
            const isProfileRectSymbol = existingSymbol.shape === 'rect';
            const isCircle = rawSymbolType === 'circle' && existingSymbol.shape !== 'rect';
            const symbolHeight =
                (isProfileRectSymbol ? existingSymbol.height : undefined) ??
                (legendCustomization.symbolHeight as number) ??
                s.legend?.symbol?.height ??
                4;
            const symbolRadius = isCircle
                ? Math.floor(symbolHeight / 2)
                : (existingSymbol.radius ?? (legendCustomization.symbolRadius as number) ?? 0);
            const pieLegendSymbol = {
                ...existingSymbol,
                shape: (isCircle ? 'symbol' : 'rect') as 'symbol' | 'rect',
                ...(isCircle ? {symbolType: 'circle' as const} : {}),
                padding:
                    (isProfileRectSymbol ? existingSymbol.padding : undefined) ??
                    (legendCustomization.symbolPadding as number) ??
                    8,
                width:
                    (isProfileRectSymbol ? existingSymbol.width : undefined) ??
                    (legendCustomization.symbolWidth as number) ??
                    s.legend?.symbol?.width ??
                    14,
                height: symbolHeight,
                radius: symbolRadius,
            };
            set(s, 'legend.symbol', pieLegendSymbol);
            set(result, 'legend.symbol', pieLegendSymbol);
            // Use native pie offsets only: custom SVG transforms distort perceived radii.
            // This keeps all sectors with the same radius while preserving a light exploded view.
        } else {
            set(s, 'legend.symbol', {
                ...(s.legend?.symbol || {}),
                padding: 8,
                width: s.type === 'line' ? (s.legend?.symbol?.width ?? 36) : 10,
                height: s.type === 'line' ? (s.legend?.symbol?.height ?? 2) : 10,
            });
        }

        s.dataLabels = {
            padding: 10,
            ...s.dataLabels,
            style: {
                fontSize: '12px',
                fontWeight: '500',
                ...s.dataLabels?.style,
            },
        };

        switch (s.type) {
            case 'pie': {
                const totals = get(s, 'custom.totals');
                const renderCustomShapeFn = get(s, 'renderCustomShape') as any;

                if (renderCustomShapeFn) {
                    s.renderCustomShape = getCustomShapeRenderer(renderCustomShapeFn);
                } else if (typeof totals !== 'undefined') {
                    s.renderCustomShape = CustomShapeRenderer.pieCenterText(totals, {
                        padding: '25%',
                        minFontSize: 6,
                    });
                }

                break;
            }
        }
    });

    const hideComments = get(loadedData, 'config.hideComments', false);
    const comments = hideComments ? [] : get(loadedData, 'comments', []);
    const {plotBands, plotLines} = convertChartCommentsToPlotBandsAndLines({comments});

    if (shouldUseCommentsOnYAxis(result)) {
        set(result, 'yAxis[0].plotBands', [...(result.yAxis?.[0]?.plotBands ?? []), ...plotBands]);
        set(result, 'yAxis[0].plotLines', [...(result.yAxis?.[0]?.plotLines ?? []), ...plotLines]);
    } else {
        set(result, 'xAxis.plotBands', [...(result.xAxis?.plotBands ?? []), ...plotBands]);
        set(result, 'xAxis.plotLines', [...(result.xAxis?.plotLines ?? []), ...plotLines]);
    }

    return result;
}

function getStyledSeries(loadedData: ChartKitAdapterProps['loadedData']) {
    const widgetData = loadedData?.data as ChartData;
    const clickActions = getNormalizedClickActions(loadedData as GraphWidget);
    const clickScope = clickActions.find((a) => {
        const handlers = Array.isArray(a.handler) ? a.handler : [a.handler];
        return handlers.some((h) => h.type === 'setActionParams');
    });
    const actionParams = pickActionParamsFromParams(get(loadedData, 'unresolvedParams', {}));

    if (clickScope?.scope === 'point' && Object.keys(actionParams).length > 0) {
        const chartSeries = widgetData.series.data;
        const hasSomePointSelected = chartSeries.some((s) =>
            s.data.some((p) => isPointSelected(p, s, actionParams)),
        );

        if (hasSomePointSelected) {
            chartSeries.forEach((s) => {
                const points = s.data as ChartSeriesData[];
                const hasAnySelectedPoints = points.reduce((acc, p: ChartSeriesData) => {
                    const pointSelected = isPointSelected(p, s, actionParams);
                    setPointSelectState({point: p, series: s, selected: pointSelected});
                    return acc || pointSelected;
                }, false);
                setSeriesSelectState({series: s, selected: hasAnySelectedPoints});
            });
        }
    }

    return widgetData.series;
}
