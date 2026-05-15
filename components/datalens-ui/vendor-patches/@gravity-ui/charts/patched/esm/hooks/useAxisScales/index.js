import React from 'react';
import { extent, scaleBand, scaleLinear, scaleLog, scalePoint, scaleUtc } from 'd3';
import get from 'lodash/get';
import { DEFAULT_AXIS_TYPE, SeriesType } from '../../constants';
import { CHART_SERIES_WITH_VOLUME_ON_Y_AXIS, getAxisHeight, getDataCategoryValue, getDefaultMaxXAxisValue, getDefaultMinXAxisValue, getDomainDataXBySeries, getDomainDataYBySeries, getOnlyVisibleSeries, isAxisRelatedSeries, isSeriesWithCategoryValues, } from '../../utils';
import { getBarXLayoutForNumericScale, groupBarXDataByXValue } from '../utils/bar-x';
import { getBandSize } from '../utils/get-band-size';
const X_AXIS_ZOOM_PADDING = 0.02;
function validateArrayData(data) {
    let hasNumberAndNullValues;
    let hasOnlyNullValues;
    for (const d of data) {
        const isNumber = typeof d === 'number';
        const isNull = d === null;
        hasNumberAndNullValues =
            typeof hasNumberAndNullValues === 'undefined'
                ? isNumber || isNull
                : hasNumberAndNullValues && (isNumber || isNull);
        hasOnlyNullValues =
            typeof hasOnlyNullValues === 'undefined' ? isNull : hasOnlyNullValues && isNull;
        if (!hasNumberAndNullValues) {
            break;
        }
    }
    return { hasNumberAndNullValues, hasOnlyNullValues };
}
function filterCategoriesByVisibleSeries(args) {
    const { axisDirection, categories, series } = args;
    if (axisDirection === 'x') {
        const axisSeries = series.filter(isAxisRelatedSeries);
        if (axisSeries.length > 0 && axisSeries.every((s) => s.type === SeriesType.Line)) {
            return categories;
        }
    }
    const visibleCategories = new Set();
    series.forEach((s) => {
        if (isSeriesWithCategoryValues(s)) {
            s.data.forEach((d) => {
                const val = getDataCategoryValue({ axisDirection, categories, data: d });
                if (val !== null && val !== undefined) {
                    visibleCategories.add(val);
                }
            });
        }
    });
    const filteredCategories = categories.filter((c) => visibleCategories.has(c));
    return filteredCategories.length > 0 ? filteredCategories : categories;
}
// axis is validated in `validation/index.ts`, so the value of `axis.type` is definitely valid.
// eslint-disable-next-line consistent-return
function getYScaleRange(args) {
    const { axis, boundsHeight } = args;
    switch (axis.type) {
        case 'datetime':
        case 'linear':
        case 'logarithmic': {
            const range = [boundsHeight, 0];
            switch (axis.order) {
                case 'sortDesc':
                case 'reverse': {
                    range.reverse();
                }
            }
            return range;
        }
        case 'category': {
            return [boundsHeight, 0];
        }
    }
}
function isSeriesWithYAxisOffset(series) {
    const types = [SeriesType.BarY, SeriesType.Heatmap];
    return series.some((s) => types.includes(s.type));
}
// eslint-disable-next-line complexity
export function createYScale(args) {
    const { axis, boundsHeight, series } = args;
    const yMinProps = get(axis, 'min');
    const yMaxProps = get(axis, 'max');
    const yCategories = get(axis, 'categories');
    const yTimestamps = get(axis, 'timestamps');
    const range = getYScaleRange({ axis, boundsHeight });
    switch (axis.type) {
        case 'linear':
        case 'logarithmic': {
            const domain = getDomainDataYBySeries(series);
            const { hasNumberAndNullValues, hasOnlyNullValues } = validateArrayData(domain);
            if (hasOnlyNullValues || domain.length === 0) {
                return undefined;
            }
            if (hasNumberAndNullValues) {
                const [yMinDomain, yMaxDomain] = extent(domain);
                const yMin = typeof yMinProps === 'number' ? yMinProps : yMinDomain;
                let yMax;
                if (typeof yMaxProps === 'number') {
                    yMax = yMaxProps;
                }
                else {
                    const hasSeriesWithVolumeOnYAxis = series.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type));
                    yMax = hasSeriesWithVolumeOnYAxis ? Math.max(yMaxDomain, 0) : yMaxDomain;
                }
                const scaleFn = axis.type === 'logarithmic' ? scaleLog : scaleLinear;
                const scale = scaleFn().domain([yMin, yMax]).range(range);
                let offsetMin = 0;
                // We should ignore padding if we are drawing only one point on the plot.
                let offsetMax = yMin === yMax ? 0 : boundsHeight * axis.maxPadding;
                if (isSeriesWithYAxisOffset(series)) {
                    if (domain.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale,
                            domain: domain,
                        });
                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }
                const domainOffsetMin = Math.abs(scale.invert(offsetMin) - scale.invert(0));
                const domainOffsetMax = Math.abs(scale.invert(offsetMax) - scale.invert(0));
                const effectiveMax = yMax + domainOffsetMax;
                const niceHint = effectiveMax > 120 ? 3 : 7;
                // DataLens: явный max + tickPositions — не расширять .nice(), иначе 110→120 и «лишний» шаг сетки.
                const skipNice = get(axis, 'fixedNumericDomain') === true ||
                    (Array.isArray(get(axis, 'tickPositions')) && get(axis, 'tickPositions').length > 0);
                if (skipNice) {
                    return scale.domain([yMin - domainOffsetMin, effectiveMax]);
                }
                return scale.domain([yMin - domainOffsetMin, effectiveMax]).nice(niceHint);
            }
            break;
        }
        case 'category': {
            if (yCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'y',
                    categories: yCategories,
                    series: series,
                });
                return scaleBand().domain(filteredCategories).range(range);
            }
            break;
        }
        case 'datetime': {
            if (yTimestamps) {
                const [yMinTimestamp, yMaxTimestamp] = extent(yTimestamps);
                const yMin = typeof yMinProps === 'number' ? yMinProps : yMinTimestamp;
                const yMax = typeof yMaxProps === 'number' ? yMaxProps : yMaxTimestamp;
                return scaleUtc().domain([yMin, yMax]).range(range).nice();
            }
            else {
                const domain = getDomainDataYBySeries(series);
                const { hasNumberAndNullValues, hasOnlyNullValues } = validateArrayData(domain);
                if (hasOnlyNullValues || domain.length === 0) {
                    return undefined;
                }
                if (hasNumberAndNullValues) {
                    const [yMinTimestamp, yMaxTimestamp] = extent(domain);
                    const yMin = typeof yMinProps === 'number' ? yMinProps : yMinTimestamp;
                    const yMax = typeof yMaxProps === 'number' ? yMaxProps : yMaxTimestamp;
                    const scale = scaleUtc().domain([yMin, yMax]).range(range);
                    let offsetMin = 0;
                    let offsetMax = boundsHeight * axis.maxPadding;
                    if (isSeriesWithYAxisOffset(series)) {
                        if (Object.keys(domain).length > 1) {
                            const bandWidth = getBandSize({
                                scale: scale,
                                domain: domain,
                            });
                            offsetMin += bandWidth / 2;
                            offsetMax += bandWidth / 2;
                        }
                    }
                    const domainOffsetMin = Math.abs(scale.invert(offsetMin).getTime() - scale.invert(0).getTime());
                    const domainOffsetMax = Math.abs(scale.invert(offsetMax).getTime() - scale.invert(0).getTime());
                    return scale.domain([yMin - domainOffsetMin, yMax + domainOffsetMax]);
                }
            }
        }
    }
    throw new Error('Failed to create yScale');
}
function calculateXAxisPadding(series) {
    let result = 0;
    series.forEach((s) => {
        switch (s.type) {
            case 'bar-y': {
                // Since labels can be located to the right of the bar, need to add an additional space
                const inside = get(s, 'dataLabels.inside');
                if (!inside) {
                    const labelsMaxWidth = get(s, 'dataLabels.maxWidth', 0);
                    result = Math.max(result, labelsMaxWidth);
                }
                break;
            }
        }
    });
    return result;
}
function isSeriesWithXAxisOffset(series) {
    const types = [SeriesType.Heatmap];
    return series.some((s) => types.includes(s.type));
}
function getXScaleRange({ boundsWidth, series, seriesOptions, hasZoomX, axis, maxPadding, }) {
    const xAxisZoomPadding = boundsWidth * X_AXIS_ZOOM_PADDING;
    const xRange = [0, boundsWidth - maxPadding];
    const xRangeZoom = [0 + xAxisZoomPadding, boundsWidth - xAxisZoomPadding];
    const range = hasZoomX ? xRangeZoom : xRange;
    const barXSeries = series.filter((s) => s.type === SeriesType.BarX);
    if (barXSeries.length) {
        const groupedData = groupBarXDataByXValue(barXSeries, axis);
        if (Object.keys(groupedData).length > 1) {
            const { bandSize } = getBarXLayoutForNumericScale({
                plotWidth: boundsWidth - maxPadding,
                groupedData,
                seriesOptions,
            });
            const offset = bandSize / 2;
            return [range[0] + offset, range[1] - offset];
        }
    }
    return range;
}
// eslint-disable-next-line complexity
export function createXScale(args) {
    const { axis, boundsWidth, series, seriesOptions, hasZoomX } = args;
    const xMinProps = get(axis, 'min');
    const xMaxProps = get(axis, 'max');
    const xType = get(axis, 'type', DEFAULT_AXIS_TYPE);
    const xCategories = get(axis, 'categories');
    const maxPadding = get(axis, 'maxPadding', 0);
    const xAxisMaxPadding = boundsWidth * maxPadding + calculateXAxisPadding(series);
    const range = getXScaleRange({
        boundsWidth,
        series,
        seriesOptions,
        hasZoomX,
        axis,
        maxPadding: xAxisMaxPadding,
    });
    switch (axis.order) {
        case 'sortDesc':
        case 'reverse': {
            range.reverse();
        }
    }
    switch (xType) {
        case 'linear':
        case 'logarithmic': {
            const domainData = getDomainDataXBySeries(series);
            const { hasNumberAndNullValues, hasOnlyNullValues } = validateArrayData(domainData);
            if (hasOnlyNullValues || domainData.length === 0) {
                return undefined;
            }
            if (series.some((s) => s.stacking === 'percent')) {
                return scaleLinear().domain([0, 100]).range(range);
            }
            if (hasNumberAndNullValues) {
                const [xMinDomain, xMaxDomain] = extent(domainData);
                let xMin;
                let xMax;
                if (typeof xMinProps === 'number') {
                    xMin = xMinProps;
                }
                else {
                    const xMinDefault = getDefaultMinXAxisValue(series);
                    xMin = xMinDefault !== null && xMinDefault !== void 0 ? xMinDefault : xMinDomain;
                }
                if (typeof xMaxProps === 'number') {
                    xMax = xMaxProps;
                }
                else {
                    const xMaxDefault = getDefaultMaxXAxisValue(series);
                    xMax =
                        typeof xMaxDefault === 'number'
                            ? Math.max(xMaxDefault, xMaxDomain)
                            : xMaxDomain;
                }
                const scaleFn = xType === 'logarithmic' ? scaleLog : scaleLinear;
                const scale = scaleFn().domain([xMin, xMax]).range(range);
                let offsetMin = 0;
                let offsetMax = 0;
                const hasOffset = isSeriesWithXAxisOffset(series);
                if (hasOffset) {
                    if (domainData.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale,
                            domain: domainData,
                        });
                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }
                const domainOffsetMin = Math.abs(scale.invert(offsetMin) - scale.invert(0));
                const domainOffsetMax = Math.abs(scale.invert(offsetMax) - scale.invert(0));
                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);
                if (!hasZoomX && !hasOffset) {
                    // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                    scale.nice(Math.max(10, domainData.length));
                    // Restore explicitly set min/max that nice() may have rounded away
                    const [nicedMin, nicedMax] = scale.domain();
                    scale.domain([
                        typeof xMinProps === 'number' ? xMinProps : nicedMin,
                        typeof xMaxProps === 'number' ? xMaxProps : nicedMax,
                    ]);
                }
                return scale;
            }
            break;
        }
        case 'category': {
            if (xCategories) {
                const filteredCategories = filterCategoriesByVisibleSeries({
                    axisDirection: 'x',
                    categories: xCategories,
                    series: series,
                });
                const axisSeries = series.filter(isAxisRelatedSeries);
                const pointScaleSeriesTypes = new Set([SeriesType.Line, SeriesType.Area]);
                const useCategoryPointScale = filteredCategories.length >= 2 &&
                    axisSeries.length > 0 &&
                    axisSeries.every((s) => pointScaleSeriesTypes.has(s.type));
                if (useCategoryPointScale) {
                    return scalePoint()
                        .domain(filteredCategories)
                        .range([0, boundsWidth])
                        .padding(0);
                }
                return scaleBand()
                    .domain(filteredCategories)
                    .range([0, boundsWidth])
                    .paddingInner(0)
                    .paddingOuter(0);
            }
            break;
        }
        case 'datetime': {
            let domain = null;
            const domainData = get(axis, 'timestamps') || getDomainDataXBySeries(series);
            const { hasNumberAndNullValues, hasOnlyNullValues } = validateArrayData(domainData);
            if (hasOnlyNullValues || domainData.length === 0) {
                return undefined;
            }
            if (hasNumberAndNullValues) {
                const [xMinTimestamp, xMaxTimestamp] = extent(domainData);
                const xMin = typeof xMinProps === 'number' ? xMinProps : xMinTimestamp;
                const xMax = typeof xMaxProps === 'number' ? xMaxProps : xMaxTimestamp;
                domain = [xMin, xMax];
                const scale = scaleUtc().domain(domain).range(range);
                let offsetMin = 0;
                let offsetMax = 0;
                const hasOffset = isSeriesWithXAxisOffset(series);
                if (hasOffset) {
                    if (domainData.length > 1) {
                        const bandWidth = getBandSize({
                            scale: scale,
                            domain: domainData,
                        });
                        offsetMin += bandWidth / 2;
                        offsetMax += bandWidth / 2;
                    }
                }
                const domainOffsetMin = Math.abs(scale.invert(offsetMin).getTime() - scale.invert(0).getTime());
                const domainOffsetMax = Math.abs(scale.invert(offsetMax).getTime() - scale.invert(0).getTime());
                scale.domain([xMin - domainOffsetMin, xMax + domainOffsetMax]);
                if (!hasZoomX && !hasOffset) {
                    // 10 is the default value for the number of ticks. Here, to preserve the appearance of a series with a small number of points
                    scale.nice(Math.max(10, domainData.length));
                }
                return scale;
            }
            break;
        }
    }
    throw new Error('Failed to create xScale');
}
const createScales = (args) => {
    const { boundsWidth, boundsHeight, hasZoomX, series, seriesOptions, split, xAxis, yAxis } = args;
    let visibleSeries = getOnlyVisibleSeries(series);
    // Reassign to all series in case of all series unselected,
    // otherwise we will get an empty space without grid
    visibleSeries = visibleSeries.length === 0 ? series : visibleSeries;
    return {
        xScale: xAxis
            ? createXScale({
                axis: xAxis,
                boundsWidth,
                series: visibleSeries,
                seriesOptions,
                hasZoomX,
            })
            : undefined,
        yScale: yAxis.map((axis, index) => {
            const axisSeries = series.filter((s) => {
                const seriesAxisIndex = get(s, 'yAxis', 0);
                return seriesAxisIndex === index;
            });
            const visibleAxisSeries = getOnlyVisibleSeries(axisSeries);
            const axisHeight = getAxisHeight({ boundsHeight, split });
            return createYScale({
                axis,
                boundsHeight: axisHeight,
                series: visibleAxisSeries.length ? visibleAxisSeries : axisSeries,
            });
        }),
    };
};
/**
 * Uses to create scales for axis related series
 */
export const useAxisScales = (args) => {
    const { boundsWidth, boundsHeight, hasZoomX, hasZoomY, series, seriesOptions, split, xAxis, yAxis, } = args;
    return React.useMemo(() => {
        let xScale;
        let yScale;
        const hasAxisRelatedSeries = series.some(isAxisRelatedSeries);
        if (hasAxisRelatedSeries) {
            ({ xScale, yScale } = createScales({
                boundsWidth,
                boundsHeight,
                hasZoomX,
                hasZoomY,
                series,
                seriesOptions,
                split,
                xAxis,
                yAxis,
            }));
        }
        return { xScale, yScale };
    }, [boundsWidth, boundsHeight, hasZoomX, hasZoomY, series, seriesOptions, split, xAxis, yAxis]);
};
