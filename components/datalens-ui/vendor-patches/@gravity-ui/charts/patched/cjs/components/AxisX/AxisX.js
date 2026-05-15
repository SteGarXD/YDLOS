import React from 'react';
import { line, select } from 'd3';
import { block, getAxisTitleRows, getBandsPosition, getLabelFormatter, getLineDashArray, getMaxTickCount, getTicksCount, handleOverflowingText, isBandScale, } from '../../utils';
import { axisBottom } from '../../utils/chart/axis-generators';
import './styles.css';
const b = block('axis');
export function getTitlePosition(args) {
    const { axis, width, rowCount } = args;
    if (rowCount < 1) {
        return { x: 0, y: 0 };
    }
    let x;
    const y = axis.title.height / rowCount + axis.title.margin + axis.labels.height + axis.labels.margin;
    switch (axis.title.align) {
        case 'left': {
            x = axis.title.width / 2;
            break;
        }
        case 'right': {
            x = width - axis.title.width / 2;
            break;
        }
        case 'center': {
            x = width / 2;
            break;
        }
    }
    return { x, y };
}
export const AxisX = React.memo(function AxisX(props) {
    const { axis, boundsOffsetLeft, boundsOffsetTop, height: totalHeight, htmlLayout, leftmostLimit, plotAfterRef, plotBeforeRef, split, scale, width, xAxisBaselineY, } = props;
    const plotBottomY = typeof xAxisBaselineY === 'number' && Number.isFinite(xAxisBaselineY) ? xAxisBaselineY : totalHeight;
    const ref = React.useRef(null);
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!ref.current || !htmlLayout) {
                return;
            }
            const svgElement = select(ref.current);
            svgElement.selectAll('*').remove();
            if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
                select(plotAfterRef.current).selectAll('[data-gcharts-x-corner-tick]').remove();
            }
            if (!axis.visible) {
                return;
            }
            let tickItems = [];
            if (axis.grid.enabled) {
                tickItems = new Array(split.plots.length || 1).fill(null).map((_, index) => {
                    var _a, _b;
                    const top = ((_a = split.plots[index]) === null || _a === void 0 ? void 0 : _a.top) || 0;
                    const height = ((_b = split.plots[index]) === null || _b === void 0 ? void 0 : _b.height) || totalHeight;
                    return [-top, -(top + height)];
                });
            }
            const axisScale = scale;
            const xAxisGenerator = await axisBottom({
                boundsOffsetLeft,
                boundsOffsetTop,
                domain: {
                    size: width + 7,
                    color: axis.lineColor,
                },
                htmlLayout,
                leftmostLimit,
                scale: axisScale,
                ticks: {
                    count: getTicksCount({ axis, range: width }),
                    labelsHtml: axis.labels.html,
                    items: tickItems,
                    labelFormat: getLabelFormatter({ axis, scale }),
                    labelsHeight: axis.labels.height,
                    labelsLineHeight: axis.labels.lineHeight,
                    labelsMargin: axis.labels.margin,
                    labelsMaxWidth: axis.labels.maxWidth,
                    labelsPaddings: axis.labels.padding,
                    labelsStyle: axis.labels.style,
                    maxTickCount: getMaxTickCount({ axis, width }),
                    rotation: axis.labels.rotation,
                    zeroLabelVerticalNudgePx: axis.zeroLabelVerticalNudgePx,
                    zeroLabelHNudgePx: axis.zeroLabelHNudgePx,
                },
            });
            if (cancelled || !ref.current) {
                return;
            }
            svgElement.call(xAxisGenerator).attr('class', b());
            // Use <rect fill> instead of <path stroke> for all axis lines.
            // A stroked path at integer coordinates straddles pixel boundaries and renders as
            // 2 physical pixels at DPR≠1 (e.g. Windows 125% scaling = DPR 1.25).
            // A filled <rect> at physical-pixel-aligned coordinates is guaranteed 1 physical pixel.
            const _dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
            const _pp = (v) => Math.round(v * _dpr) / _dpr;
            const _ps = 1 / _dpr; // 1 physical pixel in CSS px units
            const outerTickLength = typeof axis.tickLength === 'number' && Number.isFinite(axis.tickLength)
                ? axis.tickLength
                : 6;
            const rightTickH = typeof axis.xTickLengthAtRightPx === 'number' &&
                Number.isFinite(axis.xTickLengthAtRightPx) &&
                axis.xTickLengthAtRightPx > 0
                ? axis.xTickLengthAtRightPx
                : outerTickLength;
            const xAxisDomainExtendRight = typeof axis.xDomainExtendRightPx === 'number' &&
                Number.isFinite(axis.xDomainExtendRightPx) &&
                axis.xDomainExtendRightPx >= 0
                ? axis.xDomainExtendRightPx
                : 0;
            // Remove D3 domain path; replace with a physical-pixel-perfect rect.
            svgElement.selectAll('.domain').remove();
            svgElement.selectAll('.gcharts-axis__domain-rect').remove();
            // Use .style() so inline styles override any CSS class rules (fill/stroke from library CSS).
            svgElement.append('rect')
                .attr('class', 'gcharts-axis__domain-rect')
                .attr('x', 0)
                .attr('y', _pp(0))
                .attr('width', Math.round(width) + xAxisDomainExtendRight)
                .attr('height', _ps)
                .attr('shape-rendering', 'crispEdges')
                .style('fill', '#000000')
                .style('stroke', 'none');
            // Remove all D3 tick marks and library duplicates; replace with per-tick rects.
            svgElement.selectAll('.tick line').remove();
            svgElement.selectAll('.gcharts-axis__outer-tick-batch').remove();
            svgElement.selectAll('.gcharts-axis__tick-rect').remove();
            const outerTickXSeen = new Set();
            const xBand = isBandScale(axisScale);
            /** Right-edge stub (e.g. x=0 reverse): paint in plotAfter so Y-domain rect does not cover it. */
            let cornerTickPlot = null;
            svgElement.selectAll('.tick').each(function () {
                const tick = select(this);
                tick.selectAll('.gcharts-axis__outer-tick').remove();
                tick.selectAll('path').remove();
                const currentTransform = tick.attr('transform') || '';
                const tMatch = currentTransform.match(/translate\(\s*([^,)\s]+)/);
                if (tMatch) {
                    const rawX = parseFloat(tMatch[1]);
                    if (xBand) {
                        tick.attr('transform', `translate(${_pp(rawX)}, 0)`);
                        if (rawX > width + 2) {
                            return;
                        }
                        svgElement.append('rect')
                            .attr('class', 'gcharts-axis__tick-rect')
                            .attr('x', _pp(rawX))
                            .attr('y', 0)
                            .attr('width', _ps)
                            .attr('height', outerTickLength)
                            .attr('shape-rendering', 'crispEdges')
                            .style('fill', '#000000')
                            .style('stroke', 'none');
                        return;
                    }
                    const tx = Math.round(rawX);
                    tick.attr('transform', 'translate(' + tx + ', 0)');
                    if (outerTickXSeen.has(tx)) {
                        return;
                    }
                    outerTickXSeen.add(tx);
                    if (tx > Math.round(width)) {
                        return;
                    }
                    const axisRightX = Math.round(width);
                    const atRightEdge = tx >= axisRightX - 1;
                    const tickX = atRightEdge
                        ? Math.max(0, _pp(axisRightX))
                        : Math.min(_pp(tx), _pp(width) - _ps);
                    const tickHeight = atRightEdge ? Math.max(rightTickH, _ps) : outerTickLength;
                    if (atRightEdge) {
                        cornerTickPlot = { x: Math.max(0, tickX), h: tickHeight };
                    }
                    else {
                        svgElement.append('rect')
                            .attr('class', 'gcharts-axis__tick-rect')
                            .attr('x', Math.max(0, tickX))
                            .attr('y', 0)
                            .attr('width', _ps)
                            .attr('height', tickHeight)
                            .attr('shape-rendering', 'crispEdges')
                            .style('fill', '#000000')
                            .style('stroke', 'none');
                    }
                }
            });
            if (!xBand && axis.omitCornerVerticalTick) {
                const axisRightX = Math.round(width);
                if (!outerTickXSeen.has(axisRightX) && !cornerTickPlot) {
                    cornerTickPlot = {
                        x: Math.max(0, _pp(axisRightX)),
                        h: Math.max(rightTickH, _ps),
                    };
                }
            }
            // add an axis header if necessary
            if (axis.title.text) {
                const titleRows = await getAxisTitleRows({ axis, textMaxWidth: width });
                if (cancelled || !ref.current) {
                    return;
                }
                const titleClassName = b('title');
                svgElement.selectAll(`.${titleClassName}`).remove();
                svgElement
                    .append('text')
                    .attr('class', titleClassName)
                    .attr('transform', () => {
                    const { x, y } = getTitlePosition({ axis, width, rowCount: titleRows.length });
                    return `translate(${x}, ${y})`;
                })
                    .attr('font-size', axis.title.style.fontSize)
                    .attr('font-weight', axis.title.style.fontWeight || '500')
                    .attr('fill', '#000000')
                    .attr('text-rendering', 'geometricPrecision')
                    .attr('text-anchor', 'middle')
                    .selectAll('tspan')
                    .data(titleRows)
                    .join('tspan')
                    .attr('x', 0)
                    .attr('y', (d) => d.y)
                    .text((d) => d.text)
                    .each((_d, index, nodes) => {
                    if (index === axis.title.maxRowCount - 1) {
                        handleOverflowingText(nodes[index], width);
                    }
                });
            }
            const plotDataAttr = 'data-plot-x';
            let plotBeforeContainer = null;
            let plotAfterContainer = null;
            if (plotBeforeRef === null || plotBeforeRef === void 0 ? void 0 : plotBeforeRef.current) {
                plotBeforeContainer = select(plotBeforeRef.current);
                plotBeforeContainer.selectAll(`[${plotDataAttr}]`).remove();
            }
            if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
                plotAfterContainer = select(plotAfterRef.current);
                plotAfterContainer.selectAll(`[${plotDataAttr}]`).remove();
            }
            // add plot bands
            if (axis.plotBands.length > 0) {
                const plotBandDataAttr = 'plot-x-band';
                const setPlotBands = (plotContainer, plotBands) => {
                    if (!plotContainer || !plotBands.length) {
                        return;
                    }
                    const plotBandsSelection = plotContainer
                        .selectAll(`[${plotBandDataAttr}]`)
                        .remove()
                        .data(plotBands)
                        .join('g')
                        .attr(plotDataAttr, 1)
                        .attr(plotBandDataAttr, 1);
                    plotBandsSelection.each(function () {
                        var _a, _b, _c, _e;
                        const plotBandSelection = select(this);
                        const band = plotBandSelection.datum();
                        const { from, to } = getBandsPosition({ band, axisScale, axis: 'x' });
                        const halfBandwidth = ((_b = (_a = axisScale.bandwidth) === null || _a === void 0 ? void 0 : _a.call(axisScale)) !== null && _b !== void 0 ? _b : 0) / 2;
                        const startPos = halfBandwidth + Math.min(from, to);
                        const x = Math.max(0, startPos);
                        plotBandSelection
                            .append('rect')
                            .attr('x', x)
                            .attr('width', () => {
                            const endPos = Math.min(Math.abs(to - from), width - Math.min(from, to));
                            return Math.min(endPos, width);
                        })
                            .attr('y', 0)
                            .attr('height', totalHeight)
                            .attr('fill', () => band.color)
                            .attr('opacity', () => band.opacity);
                        if (band.label.text) {
                            const labelPadding = (_e = (_c = band.label) === null || _c === void 0 ? void 0 : _c.padding) !== null && _e !== void 0 ? _e : 0;
                            plotBandSelection
                                .append('text')
                                .text(band.label.text)
                                .style('fill', () => { var _a, _b; return (_b = (_a = band.label.style) === null || _a === void 0 ? void 0 : _a.fontColor) !== null && _b !== void 0 ? _b : null; })
                                .style('font-size', () => { var _a, _b; return (_b = (_a = band.label.style) === null || _a === void 0 ? void 0 : _a.fontSize) !== null && _b !== void 0 ? _b : null; })
                                .style('font-weight', () => { var _a, _b; return (_b = (_a = band.label.style) === null || _a === void 0 ? void 0 : _a.fontWeight) !== null && _b !== void 0 ? _b : null; })
                                .style('dominant-baseline', 'text-before-edge')
                                .style('text-anchor', 'end')
                                .style('transform', `translate(${x + labelPadding}px, ${labelPadding}px) rotate(-90deg)`);
                        }
                    });
                };
                setPlotBands(plotBeforeContainer, axis.plotBands.filter((d) => d.layerPlacement === 'before'));
                setPlotBands(plotAfterContainer, axis.plotBands.filter((d) => d.layerPlacement === 'after'));
            }
            // add plot lines
            if (axis.plotLines.length > 0) {
                const plotLineDataAttr = 'plot-x-line';
                const setPlotLines = (plotContainer, plotLines) => {
                    if (!plotContainer || !plotLines.length) {
                        return;
                    }
                    const plotLinesSelection = plotContainer
                        .selectAll(`[${plotLineDataAttr}]`)
                        .remove()
                        .data(plotLines)
                        .join('g')
                        .attr(plotDataAttr, 1)
                        .attr(plotLineDataAttr, 1);
                    const lineGenerator = line();
                    plotLinesSelection.each(function () {
                        const itemSelection = select(this);
                        const plotLine = itemSelection.datum();
                        const plotLineValue = Number(axisScale(plotLine.value));
                        const points = [
                            [plotLineValue, 0],
                            [plotLineValue, plotBottomY],
                        ];
                        itemSelection
                            .append('path')
                            .attr('d', lineGenerator(points))
                            .attr('stroke', plotLine.color)
                            .attr('stroke-width', plotLine.width)
                            .attr('stroke-dasharray', getLineDashArray(plotLine.dashStyle, plotLine.width))
                            .attr('opacity', plotLine.opacity);
                        if (plotLine.label.text) {
                            itemSelection
                                .append('text')
                                .text(plotLine.label.text)
                                .style('fill', () => { var _a; return (_a = plotLine.label.style.fontColor) !== null && _a !== void 0 ? _a : null; })
                                .attr('font-size', plotLine.label.style.fontSize)
                                .style('font-weight', () => { var _a; return (_a = plotLine.label.style.fontWeight) !== null && _a !== void 0 ? _a : null; })
                                .style('dominant-baseline', 'text-after-edge')
                                .style('text-anchor', 'end')
                                .style('transform', `translate(${plotLineValue - plotLine.label.padding}px, ${plotLine.label.padding}px) rotate(-90deg)`);
                        }
                    });
                };
                setPlotLines(plotBeforeContainer, axis.plotLines.filter((d) => d.layerPlacement === 'before'));
                setPlotLines(plotAfterContainer, axis.plotLines.filter((d) => d.layerPlacement === 'after'));
            }
            if (cornerTickPlot) {
                const corner = cornerTickPlot;
                const paintCornerTick = () => {
                    if (cancelled) {
                        return;
                    }
                    if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
                        const pa = select(plotAfterRef.current);
                        pa.selectAll('[data-gcharts-x-corner-tick]').remove();
                        pa.append('rect')
                            .attr('data-gcharts-x-corner-tick', '1')
                            .attr('class', 'gcharts-axis__tick-rect')
                            .attr('x', corner.x)
                            .attr('y', plotBottomY)
                            .attr('width', _ps)
                            .attr('height', corner.h)
                            .attr('shape-rendering', 'crispEdges')
                            .style('fill', '#000000')
                            .style('stroke', 'none');
                    }
                    else {
                        svgElement.append('rect')
                            .attr('class', 'gcharts-axis__tick-rect')
                            .attr('x', corner.x)
                            .attr('y', 0)
                            .attr('width', _ps)
                            .attr('height', corner.h)
                            .attr('shape-rendering', 'crispEdges')
                            .style('fill', '#000000')
                            .style('stroke', 'none');
                    }
                };
                queueMicrotask(paintCornerTick);
            }
        })();
        return () => {
            cancelled = true;
            if (ref.current) {
                select(ref.current).selectAll('*').remove();
            }
            if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
                select(plotAfterRef.current).selectAll('[data-gcharts-x-corner-tick]').remove();
            }
        };
    }, [
        axis,
        boundsOffsetLeft,
        boundsOffsetTop,
        htmlLayout,
        leftmostLimit,
        plotAfterRef,
        plotBeforeRef,
        scale,
        split,
        totalHeight,
        width,
        xAxisBaselineY,
    ]);
    return React.createElement("g", { ref: ref });
});
