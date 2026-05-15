import React from 'react';
import { useAxis, useAxisScales, useChartDimensions, useChartOptions, useNormalizedOriginalData, usePrevious, useSeries, useShapes, useSplit, } from '../../hooks';
import { getYAxisWidth } from '../../hooks/useChartDimensions/utils';
import { getLegendComponents } from '../../hooks/useSeries/prepare-legend';
import { getPreparedOptions } from '../../hooks/useSeries/prepare-options';
import { useZoom } from '../../hooks/useZoom';
import { getZoomedSeriesData } from '../../utils';
import { hasAtLeastOneSeriesDataPerPlot } from './utils';
export function useChartInnerProps(props) {
    var _a;
    const { clipPathId, data, dispatcher, height, htmlLayout, plotNode, svgContainer, width, updateZoomState, zoomState, } = props;
    const prevWidth = usePrevious(width);
    const prevHeight = usePrevious(height);
    const { normalizedSeriesData, normalizedXAxis, normalizedYAxis } = useNormalizedOriginalData({
        seriesData: data.series.data,
        xAxis: data.xAxis,
        yAxis: data.yAxis,
    });
    const { chart, title, colors } = useChartOptions({
        chart: data.chart,
        colors: data.colors,
        seriesData: normalizedSeriesData,
        title: data.title,
    });
    const preparedSeriesOptions = React.useMemo(() => {
        return getPreparedOptions(data.series.options);
    }, [data.series.options]);
    const { preparedSeries: basePreparedSeries, preparedLegend, handleLegendItemClick, } = useSeries({
        colors,
        legend: data.legend,
        originalSeriesData: normalizedSeriesData,
        seriesData: normalizedSeriesData,
        seriesOptions: data.series.options,
    });
    const { preparedSeries, preparedShapesSeries } = React.useMemo(() => {
        return getZoomedSeriesData({
            seriesData: basePreparedSeries,
            xAxis: normalizedXAxis,
            yAxis: normalizedYAxis,
            zoomState,
        });
    }, [basePreparedSeries, normalizedXAxis, normalizedYAxis, zoomState]);
    const { legendConfig, legendItems } = React.useMemo(() => {
        if (!preparedLegend) {
            return { legendConfig: undefined, legendItems: [] };
        }
        return getLegendComponents({
            chartWidth: width,
            chartHeight: height,
            chartMargin: chart.margin,
            series: preparedSeries,
            preparedLegend,
        });
    }, [width, height, chart.margin, preparedSeries, preparedLegend]);
    const { xAxis, yAxis } = useAxis({
        height,
        preparedChart: chart,
        preparedLegend,
        preparedSeries,
        preparedSeriesOptions,
        width,
        xAxis: normalizedXAxis,
        yAxis: normalizedYAxis,
    });
    const { boundsWidth, boundsHeight } = useChartDimensions({
        height,
        margin: chart.margin,
        preparedLegend,
        preparedSeries: preparedSeries,
        preparedYAxis: yAxis,
        preparedXAxis: xAxis,
        width,
    });
    const preparedSplit = useSplit({ split: data.split, boundsHeight, chartWidth: width });
    const { xScale, yScale } = useAxisScales({
        boundsWidth,
        boundsHeight,
        hasZoomX: Boolean(zoomState.x),
        hasZoomY: Boolean(zoomState.y),
        series: preparedSeries,
        seriesOptions: preparedSeriesOptions,
        split: preparedSplit,
        xAxis,
        yAxis,
    });
    const isOutsideBounds = React.useCallback((x, y) => {
        return x < 0 || x > boundsWidth || y < 0 || y > boundsHeight;
    }, [boundsHeight, boundsWidth]);
    const { shapes, shapesData } = useShapes({
        boundsWidth,
        boundsHeight,
        dispatcher,
        series: preparedShapesSeries,
        seriesOptions: preparedSeriesOptions,
        xAxis,
        xScale,
        yAxis,
        yScale,
        split: preparedSplit,
        htmlLayout,
        clipPathId,
        isOutsideBounds,
    });
    const handleAttemptToSetZoomState = React.useCallback((nextZoomState) => {
        const { preparedSeries: nextZoomedSeriesData } = getZoomedSeriesData({
            seriesData: preparedSeries,
            xAxis,
            yAxis,
            zoomState: nextZoomState,
        });
        const hasData = hasAtLeastOneSeriesDataPerPlot(nextZoomedSeriesData, yAxis);
        if (hasData) {
            updateZoomState(nextZoomState);
        }
    }, [xAxis, yAxis, preparedSeries, updateZoomState]);
    useZoom({
        node: plotNode,
        onUpdate: handleAttemptToSetZoomState,
        plotContainerHeight: boundsHeight,
        plotContainerWidth: boundsWidth,
        preparedSplit,
        preparedZoom: chart.zoom,
        xAxis,
        xScale,
        yAxis,
        yScale,
    });
    const boundsOffsetTop = Math.round(chart.margin.top);
    // We need to calculate the width of each left axis because the first axis can be hidden
    const boundsOffsetLeft = Math.round(chart.margin.left +
        yAxis.reduce((acc, axis) => {
            if (axis.position !== 'left') {
                return acc;
            }
            const axisWidth = getYAxisWidth(axis);
            if (acc < axisWidth) {
                acc = axisWidth;
            }
            return acc;
        }, 0));
    const { x } = (_a = svgContainer === null || svgContainer === void 0 ? void 0 : svgContainer.getBoundingClientRect()) !== null && _a !== void 0 ? _a : {};
    return {
        svgXPos: x,
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        handleLegendItemClick,
        isOutsideBounds,
        legendConfig,
        legendItems,
        preparedLegend,
        preparedSeries,
        preparedSplit,
        preparedZoom: chart.zoom,
        prevHeight,
        prevWidth,
        shapes,
        shapesData,
        title,
        xAxis,
        xScale,
        yAxis,
        yScale,
    };
}
