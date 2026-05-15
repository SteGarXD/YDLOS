import get from 'lodash/get';
import { getDataCategoryValue, getLabelsSize, getLeftPosition } from '../../../utils';
import { getFormattedValue } from '../../../utils/chart/format';
import { getXValue, getYValue } from '../utils';
function snapLinePathY(y) {
    if (typeof y !== 'number' || !Number.isFinite(y)) {
        return y;
    }
    var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    var rounded = Math.round(y);
    return Math.round(rounded * dpr) / dpr;
}
async function getLabelData(point, series, xMax) {
    const text = getFormattedValue(Object.assign({ value: point.data.label || point.data.y }, series.dataLabels));
    const style = series.dataLabels.style;
    const size = await getLabelsSize({ labels: [text], style });
    const labelData = {
        text,
        x: point.x,
        y: point.y - series.dataLabels.padding,
        style,
        size: { width: size.maxWidth, height: size.maxHeight },
        textAnchor: 'middle',
        series: series,
        active: true,
    };
    const left = getLeftPosition(labelData);
    if (left < 0) {
        labelData.x = labelData.x + Math.abs(left);
    }
    else {
        const right = left + labelData.size.width;
        if (right > xMax) {
            labelData.x = labelData.x - xMax - right;
        }
    }
    return labelData;
}
async function getHtmlLabel(point, series, xMax) {
    const content = String(point.data.label || point.data.y);
    const size = await getLabelsSize({ labels: [content], html: true });
    return {
        x: Math.min(xMax - size.maxWidth, Math.max(0, point.x)),
        y: Math.max(0, point.y - series.dataLabels.padding - size.maxHeight),
        content,
        size: { width: size.maxWidth, height: size.maxHeight },
        style: series.dataLabels.style,
    };
}
export const prepareLineData = async (args) => {
    var _a;
    const { series, xAxis, yAxis, xScale, yScale, split, isOutsideBounds } = args;
    const [_xMin, xRangeMax] = xScale.range();
    const xMax = xRangeMax / (1 - xAxis.maxPadding);
    const acc = [];
    for (let i = 0; i < series.length; i++) {
        const s = series[i];
        const yAxisIndex = s.yAxis;
        const seriesYAxis = yAxis[yAxisIndex];
        const yAxisTop = ((_a = split.plots[seriesYAxis.plotIndex]) === null || _a === void 0 ? void 0 : _a.top) || 0;
        const seriesYScale = yScale[s.yAxis];
        if (!seriesYScale) {
            continue;
        }
        const points = s.data.map((d) => {
            const yValue = getYValue({
                point: d,
                points: s.data,
                yAxis: seriesYAxis,
                yScale: seriesYScale,
            });
            const x = getXValue({ point: d, points: s.data, xAxis, xScale });
            return {
                x,
                y: yValue === null ? null : snapLinePathY(yAxisTop + yValue),
                active: true,
                data: d,
                series: s,
            };
        });
        const htmlElements = [];
        let labels = [];
        if (s.dataLabels.enabled) {
            if (s.dataLabels.html) {
                const list = await Promise.all(points.reduce((result, p) => {
                    if (p.y === null) {
                        return result;
                    }
                    result.push(getHtmlLabel(p, s, xMax));
                    return result;
                }, []));
                htmlElements.push(...list);
            }
            else {
                labels = await Promise.all(points.reduce((result, p) => {
                    if (p.y === null) {
                        return result;
                    }
                    result.push(getLabelData(p, s, xMax));
                    return result;
                }, []));
            }
        }
        let markers = [];
        if (s.marker.states.normal.enabled || s.marker.states.hover.enabled) {
            markers = points.reduce((result, p) => {
                if (p.y === null || p.x === null) {
                    return result;
                }
                result.push({
                    point: p,
                    active: true,
                    hovered: false,
                    clipped: isOutsideBounds(p.x, p.y),
                });
                return result;
            }, []);
        }
        const result = {
            points,
            markers,
            labels,
            color: s.color,
            width: s.lineWidth,
            series: s,
            hovered: false,
            active: true,
            id: s.id,
            dashStyle: s.dashStyle,
            linecap: s.linecap,
            opacity: s.opacity,
            htmlElements,
        };
        acc.push(result);
    }
    return acc;
};

