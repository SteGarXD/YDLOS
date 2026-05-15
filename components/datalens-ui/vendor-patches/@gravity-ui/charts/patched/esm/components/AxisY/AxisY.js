import React from 'react';
import { line, select } from 'd3';
import { HtmlLayer } from '../../hooks/useShapes/HtmlLayer';
import { block, getLineDashArray } from '../../utils';
import './styles.css';
const b = block('y-axis');
export const AxisY = (props) => {
    const { htmlLayout, plotBeforeRef, plotAfterRef, preparedAxisData } = props;
    const ref = React.useRef(null);
    const lineGenerator = line();
    const htmlLabels = preparedAxisData.ticks.map((d) => d.htmlLabel).filter(Boolean);
    React.useEffect(() => {
        if (!ref.current) {
            return;
        }
        const svgElement = select(ref.current);
        svgElement.selectAll('*').remove();
        let plotBeforeContainer = null;
        let plotAfterContainer = null;
        const plotDataAttr = 'data-plot-y';
        if (plotBeforeRef === null || plotBeforeRef === void 0 ? void 0 : plotBeforeRef.current) {
            plotBeforeContainer = select(plotBeforeRef.current);
            plotBeforeContainer.selectAll(`[${plotDataAttr}]`).remove();
        }
        if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
            plotAfterContainer = select(plotAfterRef.current);
            plotAfterContainer.selectAll(`[${plotDataAttr}]`).remove();
            plotAfterContainer.selectAll('[data-y-outer-ticks]').remove();
            plotAfterContainer.selectAll('[data-y-domain-overlay]').remove();
        }
        if (preparedAxisData.title) {
            const tt = preparedAxisData.title;
            const titleTextSelection = svgElement
                .append('g')
                .attr('class', b('title'))
                .attr('transform', `translate(${Math.round(tt.x)}, ${Math.round(tt.y)}) rotate(${tt.rotate}) translate(0, ${Math.round(tt.offset)})`)
                .append('text')
                .attr('text-anchor', 'start')
                .style('dominant-baseline', 'central')
                .attr('text-rendering', 'optimizeLegibility')
                .attr('font-size', tt.style.fontSize)
                .attr('font-weight', tt.style.fontWeight || '500')
                .attr('fill', '#000000')
                .style('letter-spacing', (tt.style && tt.style.letterSpacing) || 'normal');
            if (tt.content.length === 1) {
                const row = tt.content[0];
                titleTextSelection
                    .text(row.text)
                    .attr('x', row.x)
                    .attr('y', row.y);
            }
            else {
                titleTextSelection
                    .selectAll('tspan')
                    .data(tt.content)
                    .join('tspan')
                    .text((d) => d.text)
                    .attr('x', (d) => (d.x != null ? d.x : null))
                    .attr('y', (d) => (d.y != null ? d.y : null))
                    .attr('dx', (d) => (d.dx != null ? d.dx : null))
                    .attr('dy', (d) => (d.dy != null ? d.dy : null))
                    .attr('text-anchor', 'start');
            }
        }
        // Compute tick Y extents first so the domain line aligns exactly with actual tick positions.
        let bottomMostTickY = -Infinity;
        let topMostTickY = Infinity;
        for (const t of preparedAxisData.ticks) {
            const ty = t.line ? t.line.points[0][1] : (t.svgLabel ? t.svgLabel.y : null);
            if (ty !== null) {
                if (ty > bottomMostTickY) {
                    bottomMostTickY = ty;
                }
                if (ty < topMostTickY) {
                    topMostTickY = ty;
                }
            }
        }
        const domainX = preparedAxisData.domain
            ? Math.round(preparedAxisData.domain.start[0])
            : null;
        // Use <rect fill> instead of <path stroke> for all axis lines.
        // A stroked path at integer coordinates straddles pixel boundaries and renders as
        // 2 physical pixels at DPR≠1 (e.g. Windows 125% scaling = DPR 1.25).
        // A filled <rect> at physical-pixel-aligned coordinates is guaranteed 1 physical pixel.
        const _dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const _pp = (v) => Math.round(v * _dpr) / _dpr;
        const _ps = 1 / _dpr; // 1 physical pixel in CSS px units
        if (preparedAxisData.domain) {
            // dStartY = bottom end of Y-axis; no extra "foot" below y=0,
            // чтобы в углу (0,0) не рисовался второй вертикальный штрих.
            // dEndY   = top end of Y-axis (smallest SVG Y = highest on screen) = exactly at topmost tick
            const dStartY = bottomMostTickY > -Infinity
                ? _pp(Math.round(bottomMostTickY))
                : _pp(Math.round(preparedAxisData.domain.end[1]));
            const dEndY = topMostTickY < Infinity
                ? _pp(Math.round(topMostTickY))
                : _pp(Math.round(preparedAxisData.domain.start[1]));
            const domainContainer = plotAfterContainer || svgElement;
            // Physical-pixel-wide vertical rect for the Y-axis domain line.
            // Use .style() (inline style) not .attr() so CSS class rules cannot override fill/stroke.
            domainContainer
                .append('rect')
                .attr('class', 'gcharts-y-axis__domain-rect')
                .attr('data-y-domain-overlay', 1)
                .attr('x', _pp(domainX))
                .attr('y', dEndY)
                .attr('width', _ps)
                .attr('height', dStartY - dEndY)
                .attr('shape-rendering', 'crispEdges')
                .style('fill', '#000000')
                .style('stroke', 'none');
        }
        const tickClassName = b('tick');
        const ticks = svgElement
            .selectAll(`.${tickClassName}`)
            .remove()
            .data(preparedAxisData.ticks)
            .join('g')
            .attr('class', tickClassName);
        const labelClassName = b('label');
        const tickLength = typeof preparedAxisData.tickLength === 'number' &&
            Number.isFinite(preparedAxisData.tickLength) &&
            preparedAxisData.tickLength > 0
            ? preparedAxisData.tickLength
            : 8;
        const bottomTickLength = typeof preparedAxisData.yTickLengthAtBottomPx === 'number' &&
            Number.isFinite(preparedAxisData.yTickLengthAtBottomPx) &&
            preparedAxisData.yTickLengthAtBottomPx > 0
            ? preparedAxisData.yTickLengthAtBottomPx
            : tickLength;
        const outerTickSegments = [];
        const outerTickYSeen = new Set();
        ticks.each(function () {
            var _a;
            const tickSelection = select(this);
            const tickData = tickSelection.datum();
            const rawTickY = tickData.line
                ? tickData.line.points[0][1]
                : (tickData.svgLabel ? tickData.svgLabel.y : 0);
            const roundedTickY = Math.round(rawTickY);
            const isBottomTick = bottomMostTickY > -Infinity && Math.abs(rawTickY - bottomMostTickY) < 1;
            if (tickData.line && !isBottomTick) {
                const xLeft = tickData.line.points[0][0];
                const xRight = tickData.line.points[1][0];
                let gridX0 = xLeft;
                let gridX1 = xRight;
                if (domainX !== null) {
                    if (xRight <= domainX) {
                        gridX1 = xRight;
                    } else {
                        gridX0 = Math.max(xLeft, domainX + tickLength);
                    }
                }
                if (gridX1 > gridX0) {
                    // Physical-pixel-tall horizontal rect for each grid line.
                    tickSelection.append('rect')
                        .attr('class', 'gcharts-y-axis__grid-seg-rect')
                        .attr('x', gridX0)
                        .attr('y', _pp(roundedTickY))
                        .attr('width', gridX1 - gridX0)
                        .attr('height', _ps)
                        .attr('shape-rendering', 'crispEdges')
                        .style('fill', 'var(--g-color-line-generic)')
                        .style('stroke', 'none');
                }
            }
            if (domainX !== null) {
                // Show outer tick mark for ALL Y-axis values including the bottommost (y=0).
                // The grid line at y=0 is still skipped (it would overlap the X-axis domain),
                // but the horizontal dash on the Y-axis itself must be visible at every value.
                const endX = domainX + (isBottomTick ? bottomTickLength : tickLength);
                if (!outerTickYSeen.has(roundedTickY)) {
                    outerTickYSeen.add(roundedTickY);
                    outerTickSegments.push({ tickStartX: domainX, endX, roundedTickY });
                }
            }
            if (tickData.svgLabel) {
                const label = tickData.svgLabel;
                const textSelection = tickSelection
                    .append('text')
                    .style('transform', [
                    `translate(${label.x}px, ${label.y}px)`,
                    label.angle ? `rotate(${label.angle}deg)` : '',
                ]
                    .filter(Boolean)
                    .join(' '));
                if (label.title) {
                    textSelection.append('title').html(label.title);
                }
                textSelection
                    .selectAll('tspan')
                    .data(label.content)
                    .join('tspan')
                    .html((d) => d.text)
                    .attr('x', (d) => d.x)
                    .attr('y', (d) => d.y)
                    .attr('text-anchor', 'start')
                    .attr('class', labelClassName)
                    .style('dominant-baseline', 'text-before-edge')
                    .style('font-size', label.style.fontSize)
                    .style('font-weight', label.style.fontWeight || '400')
                    .style('fill', (_a = label.style.fontColor) !== null && _a !== void 0 ? _a : '');
            }
        });
        if (preparedAxisData.plotBands.length > 0) {
            const plotBandDataAttr = `data-plot-y-band-${preparedAxisData.id}`;
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
                    .attr(plotBandDataAttr, 1)
                    .style('transform', (d) => `translate(${d.x}px, ${d.y}px)`);
                plotBandsSelection
                    .append('rect')
                    .attr('width', (d) => d.width)
                    .attr('height', (d) => d.height)
                    .attr('fill', (d) => d.color)
                    .attr('opacity', (d) => d.opacity);
                plotBandsSelection.each(function () {
                    var _a, _b;
                    const plotBandSelection = select(this);
                    const band = plotBandSelection.datum();
                    const label = band.label;
                    if (label) {
                        plotBandSelection
                            .append('text')
                            .html(label.text)
                            .style('fill', (_a = label.style.fontColor) !== null && _a !== void 0 ? _a : '')
                            .style('font-size', label.style.fontSize)
                            .style('font-weight', (_b = label.style.fontWeight) !== null && _b !== void 0 ? _b : '')
                            .style('dominant-baseline', 'text-before-edge')
                            .attr('x', label.x)
                            .attr('y', label.y);
                    }
                });
            };
            setPlotBands(plotBeforeContainer, preparedAxisData.plotBands.filter((item) => item.layerPlacement === 'before'));
            setPlotBands(plotAfterContainer, preparedAxisData.plotBands.filter((item) => item.layerPlacement === 'after'));
        }
        if (preparedAxisData.plotLines.length > 0) {
            const plotLineDataAttr = `data-plot-y-line-${preparedAxisData.id}`;
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
                    .attr(plotLineDataAttr, 1)
                    .style('transform', (d) => `translate(${d.x}px, ${d.y}px)`);
                plotLinesSelection.each(function () {
                    const itemSelection = select(this);
                    const plotLine = itemSelection.datum();
                    const points = plotLine.points || [];
                    const isHorizontal = points.length >= 2 && points.every((p) => p[1] === points[0][1]);
                    if (isHorizontal) {
                        const rawY = points[0][1];
                        const x0 = Math.min(points[0][0], points[points.length - 1][0]);
                        const x1 = Math.max(points[0][0], points[points.length - 1][0]);
                        itemSelection
                            .append('rect')
                            .attr('x', x0)
                            .attr('y', _pp(rawY))
                            .attr('width', Math.max(0, x1 - x0))
                            .attr('height', _ps)
                            .attr('shape-rendering', 'crispEdges')
                            .style('fill', plotLine.color)
                            .style('stroke', 'none')
                            .style('opacity', plotLine.opacity);
                    }
                    else {
                        itemSelection
                            .append('path')
                            .attr('d', lineGenerator(plotLine.points))
                            .attr('stroke', plotLine.color)
                            .attr('stroke-width', plotLine.lineWidth)
                            .attr('stroke-dasharray', getLineDashArray(plotLine.dashStyle, plotLine.lineWidth))
                            .style('stroke-linecap', 'butt')
                            .style('shape-rendering', 'geometricPrecision')
                            .attr('fill', 'none')
                            .attr('opacity', plotLine.opacity);
                    }
                });
                plotLinesSelection.each(function () {
                    var _a, _b;
                    const itemSelection = select(this);
                    const plotLine = itemSelection.datum();
                    const label = plotLine.label;
                    if (label) {
                        itemSelection
                            .append('text')
                            .text(label.text)
                            .style('fill', (_a = label.style.fontColor) !== null && _a !== void 0 ? _a : '')
                            .style('font-size', label.style.fontSize)
                            .style('font-weight', (_b = label.style.fontWeight) !== null && _b !== void 0 ? _b : '')
                            .style('dominant-baseline', 'text-before-edge')
                            .attr('x', label.x)
                            .attr('y', label.y);
                    }
                });
            };
            setPlotLines(plotBeforeContainer, preparedAxisData.plotLines.filter((item) => item.layerPlacement === 'before'));
            setPlotLines(plotAfterContainer, preparedAxisData.plotLines.filter((item) => item.layerPlacement === 'after'));
        }
        if (outerTickSegments.length) {
            // Physical-pixel-tall horizontal rects for Y-axis outer tick marks.
            const appendOuterTicks = (container) => {
                if (!container) {
                    return;
                }
                const layer = container
                    .append('g')
                    .attr('data-y-outer-ticks', preparedAxisData.id)
                    .attr('class', 'gcharts-y-axis__outer-ticks-overlay');
                outerTickSegments.forEach((seg) => {
                    layer.append('rect')
                        .attr('class', 'gcharts-y-axis__outer-tick-rect')
                        .attr('x', seg.tickStartX)
                        .attr('y', _pp(seg.roundedTickY))
                        .attr('width', seg.endX - seg.tickStartX)
                        .attr('height', _ps)
                        .attr('shape-rendering', 'crispEdges')
                        .style('fill', '#000000')
                        .style('stroke', 'none');
                });
            };
            if (plotAfterContainer) {
                appendOuterTicks(plotAfterContainer);
            }
            else {
                outerTickSegments.forEach((seg) => {
                    svgElement.append('rect')
                        .attr('class', 'gcharts-y-axis__outer-tick-rect')
                        .attr('x', seg.tickStartX)
                        .attr('y', _pp(seg.roundedTickY))
                        .attr('width', seg.endX - seg.tickStartX)
                        .attr('height', _ps)
                        .attr('shape-rendering', 'crispEdges')
                        .style('fill', '#000000')
                        .style('stroke', 'none');
                });
            }
        }
        return () => {
            if (ref.current) {
                select(ref.current).selectAll('*').remove();
            }
            if (plotAfterRef === null || plotAfterRef === void 0 ? void 0 : plotAfterRef.current) {
                const after = select(plotAfterRef.current);
                after.selectAll('[data-y-outer-ticks]').remove();
                after.selectAll('[data-y-domain-overlay]').remove();
            }
        };
    }, [lineGenerator, plotAfterRef, plotBeforeRef, preparedAxisData]);
    return (React.createElement(React.Fragment, null,
        React.createElement(HtmlLayer, { preparedData: { htmlElements: htmlLabels }, htmlLayout: htmlLayout }),
        React.createElement("g", { ref: ref, className: b() })));
};

