import get from 'lodash/get';
import { DASH_STYLE, DEFAULT_AXIS_LABEL_FONT_SIZE, SeriesType, axisCrosshairDefaults, axisLabelsDefaults, xAxisTitleDefaults, } from '../../constants';
import { calculateCos, calculateNumericProperty, formatAxisTickLabel, getAxisItems, getClosestPointsRange, getDefaultDateFormat, getHorizontalHtmlTextHeight, getHorizontalSvgTextHeight, getLabelsSize, getMaxTickCount, getTicksCount, hasOverlappingLabels, isAxisRelatedSeries, wrapText, } from '../../utils';
import { createXScale } from '../useAxisScales';
import { prepareAxisPlotLabel } from './utils';
async function setLabelSettings({ axis, seriesData, seriesOptions, width, autoRotation = true, }) {
    const scale = createXScale({ axis, series: seriesData, seriesOptions, boundsWidth: width });
    if (!scale) {
        axis.labels.height = 0;
        axis.labels.rotation = 0;
        return;
    }
    const tickCount = getTicksCount({ axis, range: width });
    const ticks = getAxisItems({
        scale: scale,
        count: tickCount,
        maxCount: getMaxTickCount({ width, axis }),
    });
    const step = getClosestPointsRange(axis, ticks);
    if (axis.type === 'datetime' && !axis.labels.dateFormat) {
        axis.labels.dateFormat = getDefaultDateFormat(step);
    }
    const labels = ticks.map((value) => {
        return formatAxisTickLabel({
            axis,
            value,
            step,
        });
    });
    const overlapping = axis.labels.html
        ? false
        : hasOverlappingLabels({
            width,
            labels,
            padding: axis.labels.padding,
            style: axis.labels.style,
        });
    const defaultRotation = overlapping && autoRotation ? -45 : 0;
    const rotation = axis.labels.html ? 0 : axis.labels.rotation || defaultRotation;
    const labelsHeight = rotation || axis.labels.html
        ? (await getLabelsSize({
            labels,
            style: axis.labels.style,
            rotation,
            html: axis.labels.html,
        })).maxHeight
        : axis.labels.lineHeight;
    const maxHeight = rotation ? calculateCos(rotation) * axis.labels.maxWidth : labelsHeight;
    axis.labels.height = Math.min(maxHeight, labelsHeight);
    axis.labels.rotation = rotation;
}
function getMaxPaddingBySeries({ series }) {
    if (series.some((s) => s.type === SeriesType.Heatmap)) {
        return 0;
    }
    return 0.01;
}
export const getPreparedXAxis = async ({ xAxis, seriesData, seriesOptions, width, }) => {
    var _a, _b, _c, _d, _e;
    const hasAxisRelatedSeries = seriesData.some(isAxisRelatedSeries);
    if (!hasAxisRelatedSeries) {
        return Promise.resolve(null);
    }
    const titleText = get(xAxis, 'title.text', '');
    const titleStyle = Object.assign(Object.assign({}, xAxisTitleDefaults.style), get(xAxis, 'title.style'));
    const titleMaxRowsCount = get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount);
    const estimatedTitleRows = (await wrapText({
        text: titleText,
        style: titleStyle,
        width,
    })).slice(0, titleMaxRowsCount);
    const titleSize = await getLabelsSize({
        labels: [titleText],
        style: titleStyle,
    });
    const labelsStyle = {
        fontSize: get(xAxis, 'labels.style.fontSize', DEFAULT_AXIS_LABEL_FONT_SIZE),
        fontWeight: get(xAxis, 'labels.style.fontWeight', '400'),
    };
    const labelsHtml = get(xAxis, 'labels.html', false);
    const labelsLineHeight = labelsHtml
        ? getHorizontalHtmlTextHeight({ text: 'Tmp', style: labelsStyle })
        : getHorizontalSvgTextHeight({ text: 'Tmp', style: labelsStyle });
    const shouldHideGrid = seriesData.some((s) => s.type === SeriesType.Heatmap);
    const preparedXAxis = {
        type: get(xAxis, 'type', 'linear'),
        labels: {
            enabled: get(xAxis, 'labels.enabled', true),
            margin: get(xAxis, 'labels.margin', axisLabelsDefaults.margin),
            padding: get(xAxis, 'labels.padding', axisLabelsDefaults.padding),
            dateFormat: get(xAxis, 'labels.dateFormat'),
            numberFormat: get(xAxis, 'labels.numberFormat'),
            rotation: get(xAxis, 'labels.rotation', 0),
            align: get(xAxis, 'labels.align'),
            x: get(xAxis, 'labels.x'),
            y: get(xAxis, 'labels.y'),
            style: labelsStyle,
            width: 0,
            height: 0,
            lineHeight: labelsLineHeight,
            maxWidth: (_b = calculateNumericProperty({ base: width, value: (_a = xAxis === null || xAxis === void 0 ? void 0 : xAxis.labels) === null || _a === void 0 ? void 0 : _a.maxWidth })) !== null && _b !== void 0 ? _b : axisLabelsDefaults.maxWidth,
            html: labelsHtml,
        },
        lineColor: get(xAxis, 'lineColor'),
        categories: xAxis === null || xAxis === void 0 ? void 0 : xAxis.categories,
        timestamps: get(xAxis, 'timestamps'),
        title: {
            text: titleText,
            style: titleStyle,
            margin: get(xAxis, 'title.margin', xAxisTitleDefaults.margin),
            height: titleSize.maxHeight * estimatedTitleRows.length,
            width: titleSize.maxWidth,
            align: get(xAxis, 'title.align', xAxisTitleDefaults.align),
            maxRowCount: get(xAxis, 'title.maxRowCount', xAxisTitleDefaults.maxRowCount),
        },
        min: get(xAxis, 'min'),
        max: get(xAxis, 'max'),
        maxPadding: get(xAxis, 'maxPadding', getMaxPaddingBySeries({ series: seriesData })),
        grid: {
            enabled: shouldHideGrid ? false : get(xAxis, 'grid.enabled', true),
        },
        ticks: {
            pixelInterval: ((_c = xAxis === null || xAxis === void 0 ? void 0 : xAxis.ticks) === null || _c === void 0 ? void 0 : _c.interval)
                ? calculateNumericProperty({
                    base: width,
                    value: xAxis.ticks.interval,
                })
                : (_d = xAxis === null || xAxis === void 0 ? void 0 : xAxis.ticks) === null || _d === void 0 ? void 0 : _d.pixelInterval,
        },
        position: 'bottom',
        plotIndex: 0,
        plotLines: get(xAxis, 'plotLines', []).map((d) => ({
            value: get(d, 'value', 0),
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            width: get(d, 'width', 1),
            dashStyle: get(d, 'dashStyle', DASH_STYLE.Solid),
            opacity: get(d, 'opacity', 1),
            layerPlacement: get(d, 'layerPlacement', 'before'),
            label: prepareAxisPlotLabel(d),
        })),
        plotBands: get(xAxis, 'plotBands', []).map((d) => ({
            color: get(d, 'color', 'var(--g-color-base-brand)'),
            opacity: get(d, 'opacity', 1),
            from: get(d, 'from', 0),
            to: get(d, 'to', 0),
            layerPlacement: get(d, 'layerPlacement', 'before'),
            label: prepareAxisPlotLabel(d),
        })),
        crosshair: {
            enabled: get(xAxis, 'crosshair.enabled', axisCrosshairDefaults.enabled),
            color: get(xAxis, 'crosshair.color', axisCrosshairDefaults.color),
            layerPlacement: get(xAxis, 'crosshair.layerPlacement', axisCrosshairDefaults.layerPlacement),
            snap: get(xAxis, 'crosshair.snap', axisCrosshairDefaults.snap),
            dashStyle: get(xAxis, 'crosshair.dashStyle', axisCrosshairDefaults.dashStyle),
            width: get(xAxis, 'crosshair.width', axisCrosshairDefaults.width),
            opacity: get(xAxis, 'crosshair.opacity', axisCrosshairDefaults.opacity),
        },
        visible: get(xAxis, 'visible', true),
        order: xAxis === null || xAxis === void 0 ? void 0 : xAxis.order,
        tickLength: get(xAxis, 'tickLength'),
        tickPosition: get(xAxis, 'tickPosition'),
        lineWidth: get(xAxis, 'lineWidth'),
        omitCornerVerticalTick: get(xAxis, 'omitCornerVerticalTick'),
        zeroLabelVerticalNudgePx: get(xAxis, 'zeroLabelVerticalNudgePx'),
        zeroLabelHNudgePx: get(xAxis, 'zeroLabelHNudgePx'),
        xTickLengthAtRightPx: get(xAxis, 'xTickLengthAtRightPx'),
        xDomainExtendRightPx: get(xAxis, 'xDomainExtendRightPx'),
        startOnTick: get(xAxis, 'startOnTick'),
        endOnTick: get(xAxis, 'endOnTick'),
        minPadding: get(xAxis, 'minPadding'),
    };
    await setLabelSettings({
        axis: preparedXAxis,
        seriesData,
        seriesOptions,
        width,
        autoRotation: (_e = xAxis === null || xAxis === void 0 ? void 0 : xAxis.labels) === null || _e === void 0 ? void 0 : _e.autoRotation,
    });
    return preparedXAxis;
};
