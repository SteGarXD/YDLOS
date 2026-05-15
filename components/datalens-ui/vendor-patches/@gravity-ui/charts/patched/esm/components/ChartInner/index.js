import React from 'react';
import { ArrowRotateLeft } from '@gravity-ui/icons';
import { Button, ButtonIcon, useUniqId } from '@gravity-ui/uikit';
import { useCrosshair } from '../../hooks';
import { getPreparedTooltip } from '../../hooks/useChartOptions/tooltip';
import { EventType, block, getDispatcher } from '../../utils';
import { AxisX } from '../AxisX/AxisX';
import { AxisY } from '../AxisY/AxisY';
import { prepareAxisData } from '../AxisY/prepare-axis-data';
import { Legend } from '../Legend';
import { PlotTitle } from '../PlotTitle';
import { Title } from '../Title';
import { Tooltip } from '../Tooltip';
import { useChartInnerHandlers } from './useChartInnerHandlers';
import { useChartInnerProps } from './useChartInnerProps';
import { useChartInnerState } from './useChartInnerState';
import { getResetZoomButtonStyle, useAsyncState } from './utils';
import './styles.css';
const b = block('chart');
export const ChartInner = (props) => {
    var _a, _b, _c, _d;
    const { width, height, data } = props;
    const svgRef = React.useRef(null);
    const resetZoomButtonRef = React.useRef(null);
    const [htmlLayout, setHtmlLayout] = React.useState(null);
    const plotRef = React.useRef(null);
    const plotBeforeRef = React.useRef(null);
    const plotAfterRef = React.useRef(null);
    const dispatcher = React.useMemo(() => getDispatcher(), []);
    const clipPathId = useUniqId();
    const preparedTooltip = React.useMemo(() => {
        return getPreparedTooltip({
            tooltip: data.tooltip,
            seriesData: data.series.data,
            yAxes: data.yAxis,
            xAxis: data.xAxis,
        });
    }, [data.series.data, data.tooltip, data.yAxis, data.xAxis]);
    const { tooltipPinned, togglePinTooltip, unpinTooltip, updateZoomState, zoomState } = useChartInnerState({
        dispatcher,
        tooltip: preparedTooltip,
    });
    const { boundsHeight, boundsOffsetLeft, boundsOffsetTop, boundsWidth, handleLegendItemClick, isOutsideBounds, legendConfig, legendItems, preparedSeries, preparedSplit, preparedLegend, preparedZoom, prevHeight, prevWidth, shapes, shapesData, svgXPos, title, xAxis, xScale, yAxis, yScale, } = useChartInnerProps(Object.assign(Object.assign({}, props), { clipPathId,
        dispatcher,
        htmlLayout, plotNode: plotRef.current, svgContainer: svgRef.current, updateZoomState,
        zoomState }));
    const { handleChartClick, handleMouseLeave, throttledHandleMouseMove, throttledHandleTouchMove } = useChartInnerHandlers({
        boundsHeight,
        boundsOffsetLeft,
        boundsOffsetTop,
        boundsWidth,
        dispatcher,
        shapesData,
        svgContainer: svgRef.current,
        togglePinTooltip,
        tooltipPinned,
        unpinTooltip,
        xAxis,
        yAxis,
        tooltipThrottle: preparedTooltip.throttle,
        isOutsideBounds,
    });
    const clickHandler = (_b = (_a = data.chart) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.click;
    const pointerMoveHandler = (_d = (_c = data.chart) === null || _c === void 0 ? void 0 : _c.events) === null || _d === void 0 ? void 0 : _d.pointermove;
    useCrosshair({
        split: preparedSplit,
        plotElement: plotAfterRef.current,
        boundsOffsetLeft,
        boundsOffsetTop,
        width: boundsWidth,
        height: boundsHeight,
        xAxis,
        yAxes: yAxis,
        yScale,
        xScale,
        dispatcher,
    });
    React.useEffect(() => {
        if (clickHandler) {
            dispatcher.on(EventType.CLICK_CHART, clickHandler);
        }
        if (pointerMoveHandler) {
            dispatcher.on(EventType.POINTERMOVE_CHART, (...args) => {
                const [handlerData, event] = args;
                pointerMoveHandler(handlerData, event);
            });
        }
        return () => {
            dispatcher.on(EventType.CLICK_CHART, null);
            dispatcher.on(EventType.POINTERMOVE_CHART, null);
        };
    }, [dispatcher, clickHandler, pointerMoveHandler]);
    React.useEffect(() => {
        if ((prevWidth !== width || prevHeight !== height) && tooltipPinned) {
            unpinTooltip === null || unpinTooltip === void 0 ? void 0 : unpinTooltip();
        }
    }, [prevWidth, width, prevHeight, height, tooltipPinned, unpinTooltip]);
    const setYAxisDataItems = React.useCallback(async () => {
        const items = [];
        for (let i = 0; i < yAxis.length; i++) {
            const axis = yAxis[i];
            const scale = yScale === null || yScale === void 0 ? void 0 : yScale[i];
            if (scale) {
                const axisData = await prepareAxisData({
                    axis,
                    scale,
                    top: boundsOffsetTop,
                    width: boundsWidth,
                    height: boundsHeight,
                    split: preparedSplit,
                    series: preparedSeries.filter((s) => s.visible),
                });
                items.push(axisData);
            }
        }
        return items;
    }, [boundsHeight, boundsOffsetTop, boundsWidth, preparedSeries, preparedSplit, yAxis, yScale]);
    const yAxisDataItems = useAsyncState([], setYAxisDataItems);
    // X-axis group was translate(0, boundsHeight); Y grid/ticks use snapTickY(plot.top + scale(domainMin))
    // from prepare-axis-data. If those differ (D3 float / DPR snap), the baseline sits off the y=0 row.
    const axisXTranslateY = React.useMemo(() => {
        var _a;
        const plot0 = ((_a = preparedSplit === null || preparedSplit === void 0 ? void 0 : preparedSplit.plots) === null || _a === void 0 ? void 0 : _a[0]) || { top: 0, height: boundsHeight };
        const top = plot0.top || 0;
        const plotH = typeof plot0.height === 'number' ? plot0.height : boundsHeight;
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const snapY = (raw) => {
            const r = Math.round(raw);
            return Math.round(r * dpr) / dpr;
        };
        const yS = yScale === null || yScale === void 0 ? void 0 : yScale[0];
        let rawBottom = top + plotH;
        if (yS && typeof yS.domain === 'function') {
            try {
                const dom = yS.domain();
                if (dom && dom.length) {
                    const n0 = Number(dom[0]);
                    const n1 = Number(dom[dom.length - 1]);
                    if (Number.isFinite(n0) && Number.isFinite(n1)) {
                        const domainMin = Math.min(n0, n1);
                        const mapped = yS(domainMin);
                        if (typeof mapped === 'number' && Number.isFinite(mapped)) {
                            rawBottom = top + mapped;
                        }
                    }
                }
            }
            catch (_e) {
                rawBottom = top + plotH;
            }
        }
        return snapY(rawBottom);
    }, [boundsHeight, preparedSplit, yScale]);
    return (React.createElement("div", { className: b() },
        React.createElement("svg", { ref: svgRef, width: width, height: height,
            // We use onPointerMove here because onMouseMove works incorrectly when the zoom setting is enabled:
            // when starting to select an area, the tooltip remains in the position where the selection began
            onPointerMove: throttledHandleMouseMove, onMouseLeave: handleMouseLeave, onTouchStart: throttledHandleTouchMove, onTouchMove: throttledHandleTouchMove, onClick: handleChartClick },
            React.createElement("defs", null,
                React.createElement("clipPath", { id: clipPathId },
                    React.createElement("rect", { x: 0, y: 0, width: boundsWidth, height: boundsHeight }))),
            title &&
                React.createElement(Title, Object.assign({}, title, {
                    chartWidth: boundsWidth +
                        (((preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.position) === 'right'
                            ? ((preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.panelWidth) || 0) + ((preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.margin) || 0)
                            : 0)),
                    chartOffsetLeft: boundsOffsetLeft + 54,
                    titleOffsetTop: 4,
                })),
            React.createElement("g", { transform: `translate(0, ${boundsOffsetTop})` }, preparedSplit.plots.map((plot, index) => {
                return React.createElement(PlotTitle, { key: `plot-${index}`, title: plot.title });
            })),
            React.createElement("g", { width: boundsWidth, height: boundsHeight, transform: `translate(${[boundsOffsetLeft, boundsOffsetTop].join(',')})`, ref: plotRef },
                xScale && xAxis && (React.createElement("g", { transform: `translate(0, ${axisXTranslateY})` },
                    React.createElement(AxisX, { axis: xAxis, boundsOffsetLeft: boundsOffsetLeft, boundsOffsetTop: boundsOffsetTop, height: boundsHeight, htmlLayout: htmlLayout, leftmostLimit: svgXPos, plotAfterRef: plotAfterRef, plotBeforeRef: plotBeforeRef, scale: xScale, split: preparedSplit, width: boundsWidth, xAxisBaselineY: axisXTranslateY }))),
                Boolean(yAxisDataItems.length) && (React.createElement(React.Fragment, null, yAxisDataItems.map((axisData, index) => {
                    if (!axisData) {
                        return null;
                    }
                    return (React.createElement(AxisY, { key: index, htmlLayout: htmlLayout, plotAfterRef: plotAfterRef, plotBeforeRef: plotBeforeRef, preparedAxisData: axisData }));
                }))),
                React.createElement("g", { ref: plotBeforeRef }),
                shapes,
                React.createElement("g", { ref: plotAfterRef })),
            (preparedLegend === null || preparedLegend === void 0 ? void 0 : preparedLegend.enabled) && legendConfig && (React.createElement(Legend, { chartSeries: preparedSeries, legend: preparedLegend, items: legendItems, config: legendConfig, onItemClick: handleLegendItemClick, onUpdate: unpinTooltip, htmlLayout: htmlLayout }))),
        React.createElement("div", { className: b('html-layer'), ref: setHtmlLayout, style: {
                '--g-html-layout-transform': `translate(${boundsOffsetLeft}px, ${boundsOffsetTop}px)`,
            } }),
        Object.keys(zoomState).length > 0 && preparedZoom && (React.createElement(Button, { onClick: () => updateZoomState({}), ref: resetZoomButtonRef, style: getResetZoomButtonStyle(Object.assign({ boundsHeight,
                boundsOffsetLeft,
                boundsOffsetTop,
                boundsWidth, node: resetZoomButtonRef.current, titleHeight: title === null || title === void 0 ? void 0 : title.height }, preparedZoom.resetButton)) },
            React.createElement(ButtonIcon, null,
                React.createElement(ArrowRotateLeft, null)))),
        React.createElement(Tooltip, { dispatcher: dispatcher, tooltip: preparedTooltip, svgContainer: svgRef.current, xAxis: xAxis, yAxis: yAxis[0], onOutsideClick: unpinTooltip, tooltipPinned: tooltipPinned })));
};
