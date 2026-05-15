import React from 'react';
import { color, line as lineGenerator, select } from 'd3';
import get from 'lodash/get';
import { block, filterOverlappingLabels, getLineDashArray } from '../../../utils';
import { HtmlLayer } from '../HtmlLayer';
import { getMarkerHaloVisibility, getMarkerVisibility, renderMarker, selectMarkerHalo, selectMarkerSymbol, setMarker, } from '../marker';
import { setActiveState } from '../utils';
const b = block('line');
export const LineSeriesShapes = (args) => {
    const { dispatcher, preparedData, seriesOptions, htmlLayout, clipPathId } = args;
    const hoveredDataRef = React.useRef(null);
    const plotRef = React.useRef(null);
    const markersRef = React.useRef(null);
    React.useEffect(() => {
        var _a;
        if (!plotRef.current || !markersRef.current) {
            return () => { };
        }
        const plotSvgElement = select(plotRef.current);
        const markersSvgElement = select(markersRef.current);
        const hoverOptions = get(seriesOptions, 'line.states.hover');
        const inactiveOptions = get(seriesOptions, 'line.states.inactive');
        const line = lineGenerator()
            .defined((d) => d.y !== null && d.x !== null)
            .x((d) => d.x)
            .y((d) => d.y);
        plotSvgElement.selectAll('*').remove();
        markersSvgElement.selectAll('*').remove();
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const pp = (v) => Math.round(v * dpr) / dpr;
        const ps = 1 / dpr;
        // Empirical: path Y from snapLinePathY vs AxisY grid/tick rects — center band + tiny shift down.
        const hCrispBandYAlignPx = 0.35;
        const Y_FLAT_EPS = 1e-3;
        const isHorizontalCrisp = (seriesPrepared) => {
            var _a;
            const crisp = Boolean((_a = seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.series) === null || _a === void 0 ? void 0 : _a.crisp);
            if (!crisp) {
                return false;
            }
            const points = (seriesPrepared === null || seriesPrepared === void 0 ? void 0 : seriesPrepared.points) || [];
            if (points.length < 2) {
                return false;
            }
            const ys = points
                .map((p) => p.y)
                .filter((y) => typeof y === 'number' && Number.isFinite(y));
            if (ys.length < 2) {
                return false;
            }
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return maxY - minY < Y_FLAT_EPS;
        };
        const hBandData = preparedData.filter(isHorizontalCrisp);
        const pathData = preparedData.filter((d) => !isHorizontalCrisp(d));
        const lineSelection = plotSvgElement
            .selectAll(`path.${b('path-geom')}`)
            .data(pathData, (d) => d.id)
            .join('path')
            .attr('class', b('path-geom'))
            .attr('data-series-line-id', (d) => String(d.id))
            .attr('d', (d) => line(d.points))
            .attr('fill', 'none')
            .attr('stroke', (d) => d.color)
            .attr('stroke-width', (d) => d.width)
            // Keep line ends flush at the plot edge to avoid crossing Y-axis.
            .attr('stroke-linejoin', 'miter')
            .attr('stroke-linecap', 'butt')
            .attr('stroke-dasharray', (d) => getLineDashArray(d.dashStyle, d.width))
            .attr('shape-rendering', null)
            .attr('opacity', (d) => d.opacity)
            .attr('cursor', (d) => d.series.cursor);
        // After paths so bands paint above data (matches high zIndex threshold series).
        // Same geometry as AxisY grid: filled rect y=_pp(Math.round(y)), height=1/dpr.
        const crispBandRects = plotSvgElement
            .selectAll(`rect.${b('y-grid-band')}`)
            .data(hBandData, (d) => d.id)
            .join('rect')
            .attr('class', b('y-grid-band'))
            .attr('data-series-line-id', (d) => String(d.id))
            .attr('x', (d) => {
            const xs = d.points.map((p) => p.x).filter((x) => typeof x === 'number' && Number.isFinite(x));
            return xs.length ? Math.min(...xs) : 0;
        })
            .attr('width', (d) => {
            const xs = d.points.map((p) => p.x).filter((x) => typeof x === 'number' && Number.isFinite(x));
            if (!xs.length) {
                return 0;
            }
            const w = Math.max(...xs) - Math.min(...xs);
            return Number.isFinite(w) ? Math.max(0, w) : 0;
        })
            // Grid band is [top0, top0+ps]; center thick fill on that band (symmetric up/down).
            .attr('y', (d) => {
            const ys = d.points
                .map((p) => p.y)
                .filter((y) => typeof y === 'number' && Number.isFinite(y));
            const rawY = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : d.points[0].y;
            const lw = Number(d.width);
            const linePx = Number.isFinite(lw) && lw > 0 ? lw : 1;
            const h = Math.max(ps, linePx);
            const top0 = pp(Math.round(rawY));
            return top0 + ps / 2 - h / 2 + hCrispBandYAlignPx;
        })
            .attr('height', (d) => {
            const lw = Number(d.width);
            const linePx = Number.isFinite(lw) && lw > 0 ? lw : 1;
            return Math.max(ps, linePx);
        })
            .attr('fill', (d) => d.color)
            .style('stroke', 'none')
            .attr('shape-rendering', 'crispEdges')
            .attr('opacity', (d) => d.opacity)
            .attr('cursor', (d) => d.series.cursor);
        let dataLabels = preparedData.reduce((acc, d) => {
            return acc.concat(d.labels);
        }, []);
        if (!((_a = preparedData[0]) === null || _a === void 0 ? void 0 : _a.series.dataLabels.allowOverlap)) {
            dataLabels = filterOverlappingLabels(dataLabels);
        }
        const labelsSelection = plotSvgElement
            .selectAll('text')
            .data(dataLabels)
            .join('text')
            .text((d) => d.text)
            .attr('class', b('label'))
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('text-anchor', (d) => d.textAnchor)
            .style('font-size', (d) => d.style.fontSize)
            .style('font-weight', (d) => d.style.fontWeight || null)
            .style('fill', (d) => d.style.fontColor || null);
        const markers = preparedData.reduce((acc, d) => acc.concat(d.markers), []);
        const markerSelection = markersSvgElement
            .selectAll('marker')
            .data(markers)
            .join('g')
            .call(renderMarker);
        const hoverEnabled = hoverOptions === null || hoverOptions === void 0 ? void 0 : hoverOptions.enabled;
        const inactiveEnabled = inactiveOptions === null || inactiveOptions === void 0 ? void 0 : inactiveOptions.enabled;
        function handleShapeHover(data) {
            hoveredDataRef.current = data;
            const selected = (data === null || data === void 0 ? void 0 : data.filter((d) => d.series.type === 'line')) || [];
            const selectedDataItems = selected.map((d) => d.data);
            const selectedSeriesIds = selected.map((d) => { var _a; return (_a = d.series) === null || _a === void 0 ? void 0 : _a.id; });
            const applyHoverPaint = (elementSelection, dSelection) => {
                var _a;
                const initialColor = dSelection.color || '';
                const nextColor = dSelection.hovered
                    ? (((_a = color(initialColor)) === null || _a === void 0 ? void 0 : _a.brighter(hoverOptions === null || hoverOptions === void 0 ? void 0 : hoverOptions.brightness).toString()) || initialColor)
                    : initialColor;
                const n = elementSelection.node();
                if (n && String(n.tagName).toLowerCase() === 'rect') {
                    elementSelection.attr('fill', nextColor);
                }
                else {
                    elementSelection.attr('stroke', nextColor);
                }
            };
            lineSelection.datum((d, index, list) => {
                const elementSelection = select(list[index]);
                const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.call((sel) => applyHoverPaint(sel, d));
                }
                return setActiveState({
                    element: list[index],
                    state: inactiveOptions,
                    active: Boolean(!inactiveEnabled ||
                        !selectedSeriesIds.length ||
                        selectedSeriesIds.includes(d.id)),
                    datum: d,
                });
            });
            crispBandRects.datum((d, index, list) => {
                const elementSelection = select(list[index]);
                const hovered = Boolean(hoverEnabled && selectedSeriesIds.includes(d.id));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.call((sel) => applyHoverPaint(sel, d));
                }
                return setActiveState({
                    element: list[index],
                    state: inactiveOptions,
                    active: Boolean(!inactiveEnabled ||
                        !selectedSeriesIds.length ||
                        selectedSeriesIds.includes(d.id)),
                    datum: d,
                });
            });
            labelsSelection.datum((d, index, list) => {
                return setActiveState({
                    element: list[index],
                    state: inactiveOptions,
                    active: Boolean(!inactiveEnabled ||
                        !selectedSeriesIds.length ||
                        selectedSeriesIds.includes(d.series.id)),
                    datum: d,
                });
            });
            markerSelection.datum((d, index, list) => {
                const elementSelection = select(list[index]);
                const hovered = Boolean(hoverEnabled && selectedDataItems.includes(d.point.data));
                if (d.hovered !== hovered) {
                    d.hovered = hovered;
                    elementSelection.attr('visibility', getMarkerVisibility(d));
                    selectMarkerHalo(elementSelection).attr('visibility', getMarkerHaloVisibility);
                    selectMarkerSymbol(elementSelection).call(setMarker, hovered ? 'hover' : 'normal');
                }
                if (d.point.series.marker.states.normal.enabled) {
                    const isActive = Boolean(!inactiveEnabled ||
                        !selectedSeriesIds.length ||
                        selectedSeriesIds.includes(d.point.series.id));
                    setActiveState({
                        element: list[index],
                        state: inactiveOptions,
                        active: isActive,
                        datum: d,
                    });
                }
                return d;
            });
        }
        if (hoveredDataRef.current !== null) {
            handleShapeHover(hoveredDataRef.current);
        }
        dispatcher.on('hover-shape.line', handleShapeHover);
        return () => {
            dispatcher.on('hover-shape.line', null);
        };
    }, [dispatcher, preparedData, seriesOptions]);
    return (React.createElement(React.Fragment, null,
        React.createElement("g", { ref: plotRef, className: b(), clipPath: `url(#${clipPathId})` }),
        React.createElement("g", { ref: markersRef }),
        React.createElement(HtmlLayer, { preparedData: preparedData, htmlLayout: htmlLayout })));
};
