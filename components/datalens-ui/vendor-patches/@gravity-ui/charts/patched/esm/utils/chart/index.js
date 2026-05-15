import { group, select } from 'd3';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import sortBy from 'lodash/sortBy';
import { DEFAULT_AXIS_LABEL_FONT_SIZE, SeriesType } from '../../constants';
import { getSeriesStackId } from '../../hooks/useSeries/utils';
import { getWaterfallPointSubtotal } from './series/waterfall';
export * from './axis';
export * from './array';
export * from './color';
export * from './format';
export * from './labels';
export * from './legend';
export * from './math';
export * from './series';
export * from './symbol';
export * from './text';
export * from './time';
export * from './zoom';
const CHARTS_WITHOUT_AXIS = ['pie', 'treemap', 'sankey', 'radar'];
export const CHART_SERIES_WITH_VOLUME_ON_Y_AXIS = [
    'bar-x',
    'area',
    'waterfall',
];
export const CHART_SERIES_WITH_VOLUME_ON_X_AXIS = ['bar-y'];
/**
 * Checks whether the series should be drawn with axes.
 *
 * @param series - The series object to check.
 * @returns `true` if the series should be drawn with axes, `false` otherwise.
 */
export function isAxisRelatedSeries(series) {
    return !CHARTS_WITHOUT_AXIS.includes(series.type);
}
export function isSeriesWithNumericalXValues(series) {
    return isAxisRelatedSeries(series);
}
export function isSeriesWithNumericalYValues(series) {
    return isAxisRelatedSeries(series);
}
export function isSeriesWithCategoryValues(series) {
    return isAxisRelatedSeries(series);
}
function getDomainDataForStackedSeries(seriesList, keyAttr = 'x', valueAttr = 'y') {
    const acc = [];
    const stackedSeries = group(seriesList, getSeriesStackId);
    Array.from(stackedSeries).forEach(([_stackId, seriesStack]) => {
        const values = {};
        seriesStack.forEach((singleSeries) => {
            const data = new Map();
            singleSeries.data.forEach((point) => {
                const keyValue = point[keyAttr];
                if (keyValue === null) {
                    return;
                }
                const key = String(keyValue);
                let value = 0;
                if (valueAttr in point && typeof point[valueAttr] === 'number') {
                    value = point[valueAttr];
                }
                if (data.has(key)) {
                    value = Math.max(value, data.get(key));
                }
                data.set(key, value);
            });
            Array.from(data).forEach(([key, value]) => {
                values[key] = (values[key] || 0) + value;
            });
        });
        acc.push(...Object.values(values));
    });
    return acc;
}
export const getDomainDataXBySeries = (series) => {
    const groupedSeries = group(series, (item) => item.type);
    const values = Array.from(groupedSeries).reduce((acc, [type, seriesList]) => {
        switch (type) {
            case 'bar-y': {
                acc.push(...getDomainDataForStackedSeries(seriesList, 'y', 'x'));
                break;
            }
            default: {
                seriesList.filter(isSeriesWithNumericalXValues).forEach((s) => {
                    acc.push(...s.data.map((d) => d.x));
                });
            }
        }
        return acc;
    }, []);
    return Array.from(new Set(values.filter((v) => v !== null)));
};
export function getDefaultMaxXAxisValue(series) {
    if (series.some((s) => s.type === 'bar-y')) {
        return 0;
    }
    return undefined;
}
export function getDefaultMinXAxisValue(series) {
    if (series === null || series === void 0 ? void 0 : series.some((s) => CHART_SERIES_WITH_VOLUME_ON_X_AXIS.includes(s.type))) {
        return series.reduce((minValue, s) => {
            // https://github.com/gravity-ui/charts/issues/160
            // @ts-expect-error
            const minXValue = s.data.reduce((res, d) => Math.min(res, get(d, 'x', 0)), 0);
            return Math.min(minValue, minXValue);
        }, 0);
    }
    return undefined;
}
export function getDefaultMinYAxisValue(series) {
    if (series === null || series === void 0 ? void 0 : series.some((s) => CHART_SERIES_WITH_VOLUME_ON_Y_AXIS.includes(s.type))) {
        if (series.some((s) => s.type === SeriesType.Waterfall)) {
            const seriesData = series.map((s) => s.data).flat();
            const minSubTotal = seriesData.reduce((res, d) => Math.min(res, getWaterfallPointSubtotal(d, seriesData) || 0), 0);
            return Math.min(0, minSubTotal);
        }
        return series.reduce((minValue, s) => {
            // https://github.com/gravity-ui/charts/issues/160
            // @ts-expect-error
            const minYValue = s.data.reduce((res, d) => Math.min(res, get(d, 'y', 0)), 0);
            return Math.min(minValue, minYValue);
        }, 0);
    }
    return undefined;
}
export const getDomainDataYBySeries = (series) => {
    const groupedSeries = group(series, (item) => item.type);
    const items = Array.from(groupedSeries).reduce((acc, [type, seriesList]) => {
        switch (type) {
            case 'area':
            case 'bar-x': {
                acc.push(...getDomainDataForStackedSeries(seriesList));
                break;
            }
            case 'waterfall': {
                let yValue = 0;
                const points = seriesList.map((s) => s.data).flat();
                sortBy(points, (p) => p.index).forEach((d) => {
                    yValue += Number(d.y) || 0;
                    acc.push(yValue);
                });
                break;
            }
            default: {
                seriesList.filter(isSeriesWithNumericalYValues).forEach((s) => {
                    acc.push(...s.data.map((d) => d.y));
                });
            }
        }
        return acc;
    }, []);
    return Array.from(new Set(items));
};
// Uses to get all series names array (except `pie` charts)
export const getSeriesNames = (series) => {
    return series.reduce((acc, s) => {
        if ('name' in s && typeof s.name === 'string') {
            acc.push(s.name);
        }
        return acc;
    }, []);
};
export const getOnlyVisibleSeries = (series) => {
    return series.filter((s) => s.visible);
};
export const getHorizontalHtmlTextHeight = (args) => {
    var _a;
    const { text, style } = args;
    const container = select(document.body).append('div');
    const fontSize = get(style, 'fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE);
    container
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('white-space', 'nowrap')
        .html(text);
    if (fontSize) {
        container.style('font-size', fontSize);
    }
    const height = ((_a = container.node()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().height) || 0;
    container.remove();
    return height;
};
export const getHorizontalSvgTextHeight = (args) => {
    var _a;
    const { text, style } = args;
    const container = select(document.body).append('svg');
    const textSelection = container.append('text').text(text);
    const fontSize = get(style, 'fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE);
    if (fontSize) {
        textSelection.style('font-size', fontSize).style('dominant-baseline', 'text-after-edge');
    }
    const height = ((_a = textSelection.node()) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect().height) || 0;
    container.remove();
    return height;
};
const extractCategoryValue = (args) => {
    const { axisDirection, categories, data } = args;
    const dataCategory = get(data, axisDirection);
    let categoryValue;
    if ('category' in data && data.category) {
        categoryValue = data.category;
    }
    if (typeof dataCategory === 'string') {
        categoryValue = dataCategory;
    }
    if (typeof dataCategory === 'number') {
        categoryValue = categories[dataCategory];
    }
    // Return null instead of throwing — caller must guard against null
    return isNil(categoryValue) ? null : categoryValue;
};
export const getDataCategoryValue = (args) => {
    const { axisDirection, categories, data } = args;
    return extractCategoryValue({ axisDirection, categories, data });
};
