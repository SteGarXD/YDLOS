import get from 'lodash/get';
import merge from 'lodash/merge';
import { DASH_STYLE, DEFAULT_DATALABELS_STYLE, LineCap } from '../../constants';
import { getUniqId } from '../../utils';
import { DEFAULT_DATALABELS_PADDING, DEFAULT_HALO_OPTIONS, DEFAULT_LEGEND_SYMBOL_PADDING, DEFAULT_POINT_MARKER_OPTIONS, } from './constants';
export const DEFAULT_LEGEND_SYMBOL_SIZE = 16;
export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_DASH_STYLE = DASH_STYLE.Solid;
export const DEFAULT_MARKER = Object.assign(Object.assign({}, DEFAULT_POINT_MARKER_OPTIONS), { enabled: false });
function prepareLinecap(dashStyle, series, seriesOptions) {
    const defaultLineCap = dashStyle === DASH_STYLE.Solid ? LineCap.Round : LineCap.None;
    const lineCapFromSeriesOptions = get(seriesOptions, 'line.linecap', defaultLineCap);
    return get(series, 'linecap', lineCapFromSeriesOptions);
}
function prepareLineLegendSymbol(series, seriesOptions) {
    var _a;
    const symbolOptions = ((_a = series.legend) === null || _a === void 0 ? void 0 : _a.symbol) || {};
    const defaultLineWidth = get(seriesOptions, 'line.lineWidth', DEFAULT_LINE_WIDTH);
    return {
        shape: 'path',
        width: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.width) || DEFAULT_LEGEND_SYMBOL_SIZE,
        padding: (symbolOptions === null || symbolOptions === void 0 ? void 0 : symbolOptions.padding) || DEFAULT_LEGEND_SYMBOL_PADDING,
        strokeWidth: get(series, 'lineWidth', defaultLineWidth),
    };
}
function prepareMarker(series, seriesOptions) {
    var _a;
    const seriesHoverState = get(seriesOptions, 'line.states.hover');
    const markerNormalState = Object.assign({}, DEFAULT_MARKER, (_a = seriesOptions === null || seriesOptions === void 0 ? void 0 : seriesOptions.line) === null || _a === void 0 ? void 0 : _a.marker, series.marker);
    const hoveredMarkerDefaultOptions = {
        enabled: true,
        radius: markerNormalState.radius,
        borderWidth: 1,
        borderColor: '#ffffff',
        halo: DEFAULT_HALO_OPTIONS,
    };
    return {
        states: {
            normal: markerNormalState,
            hover: merge(hoveredMarkerDefaultOptions, seriesHoverState === null || seriesHoverState === void 0 ? void 0 : seriesHoverState.marker),
        },
    };
}
function prepareSeriesData(series) {
    var _a;
    const nullMode = (_a = series.nullMode) !== null && _a !== void 0 ? _a : 'skip';
    const data = series.data;
    switch (nullMode) {
        case 'zero':
            return data.map((p) => { var _a; return (Object.assign(Object.assign({}, p), { y: (_a = p.y) !== null && _a !== void 0 ? _a : 0 })); });
        case 'connect':
            return data.filter((p) => p.y !== null);
        case 'skip':
        default:
            return data;
    }
}
export function prepareLineSeries(args) {
    const { colorScale, series: seriesList, seriesOptions, legend } = args;
    const defaultLineWidth = get(seriesOptions, 'line.lineWidth', DEFAULT_LINE_WIDTH);
    const defaultDashStyle = get(seriesOptions, 'line.dashStyle', DEFAULT_DASH_STYLE);
    return seriesList.map((series) => {
        var _a, _b, _c;
        const id = getUniqId();
        const name = series.name || '';
        const color = series.color || colorScale(name);
        const dashStyle = get(series, 'dashStyle', defaultDashStyle);
        const prepared = {
            type: series.type,
            color,
            lineWidth: get(series, 'lineWidth', defaultLineWidth),
            name,
            id,
            visible: get(series, 'visible', true),
            legend: {
                enabled: get(series, 'legend.enabled', legend.enabled),
                symbol: prepareLineLegendSymbol(series, seriesOptions),
            },
            data: prepareSeriesData(series),
            dataLabels: {
                enabled: ((_a = series.dataLabels) === null || _a === void 0 ? void 0 : _a.enabled) || false,
                style: Object.assign({}, DEFAULT_DATALABELS_STYLE, (_b = series.dataLabels) === null || _b === void 0 ? void 0 : _b.style),
                padding: get(series, 'dataLabels.padding', DEFAULT_DATALABELS_PADDING),
                allowOverlap: get(series, 'dataLabels.allowOverlap', false),
                html: get(series, 'dataLabels.html', false),
                format: (_c = series.dataLabels) === null || _c === void 0 ? void 0 : _c.format,
            },
            marker: prepareMarker(series, seriesOptions),
            dashStyle: dashStyle,
            linecap: prepareLinecap(dashStyle, series, seriesOptions),
            opacity: get(series, 'opacity', null),
            cursor: get(series, 'cursor', null),
            yAxis: get(series, 'yAxis', 0),
            tooltip: series.tooltip,
            ...(typeof series.crisp === 'boolean' ? { crisp: series.crisp } : {}),
            ...(typeof series.clip === 'boolean' ? { clip: series.clip } : {}),
            ...(typeof series.zIndex === 'number' && Number.isFinite(series.zIndex) ? { zIndex: series.zIndex } : {}),
            ...(series.states ? { states: series.states } : {}),
        };
        return prepared;
    }, []);
}
