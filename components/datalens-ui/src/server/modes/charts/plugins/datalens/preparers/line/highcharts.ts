import _isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';

import type {
    Field,
    ServerField,
    ServerPlaceholderSettings,
    WizardVisualizationId,
} from '../../../../../../../shared';
import {
    AxisLabelFormatMode,
    AxisMode,
    ChartkitHandlers,
    DATASET_FIELD_TYPES,
    MINIMUM_FRACTION_DIGITS,
    PlaceholderId,
    getAxisMode,
    getFakeTitleOrTitle,
    getIsNavigatorEnabled,
    getXAxisMode,
    isDateField,
    isFloatField,
    isMeasureNameOrValue,
    isNumberField,
    isVisualizationWithSeveralFieldsXPlaceholder,
} from '../../../../../../../shared';
import {isHtmlField} from '../../../../../../../shared/types/index';
import {getConfigWithActualFieldTypes} from '../../utils/config-helpers';
import {getFieldExportingOptions} from '../../utils/export-helpers';
import {getFieldTitle, isLegendEnabled} from '../../utils/misc-helpers';
import {addAxisFormatter, addAxisFormatting, getAxisType} from '../helpers/axis';
import {getAxisTitle} from '../../utils/axis-helpers';
import {getAxisChartkitFormatting} from '../helpers/axis/get-axis-formatting';
import {
    getVisualizationCustomizationBehaviorFlags,
    hasExplicitVisualizationCustomizationProfile,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import {getHighchartsColorAxis, isXAxisReversed} from '../helpers/highcharts';
import {getYPlaceholders} from '../helpers/layers';
import {shouldUseGradientLegend} from '../helpers/legend';
import {getSegmentMap} from '../helpers/segments';
import type {PrepareFunctionArgs} from '../types';

import type {AxisGridStepSource} from './axis-nice-step';
import {computeYAxisMaxWithOneNiceHeadroomStep} from './axis-nice-step';
import {getSegmentsYAxis} from './helpers';
import {prepareLineData} from './prepare-line-data';

function isStrictDaysBeforeDepartureXHighcharts(
    x: ServerField | undefined,
    xPlaceholder: {settings?: {title?: string; titleValue?: string}} | undefined,
    idToDataType: Record<string, DATASET_FIELD_TYPES>,
): boolean {
    if (!x) {
        return false;
    }
    const xf = {guid: x.guid, data_type: idToDataType[x.guid]} as Field;
    if (!isNumberField(xf)) {
        return false;
    }
    if (String(x.guid) === 'diff') {
        return true;
    }
    const parts: string[] = [getFieldTitle(x)];
    if (xPlaceholder?.settings) {
        const axisTitle = getAxisTitle(xPlaceholder.settings as ServerPlaceholderSettings, x);
        if (typeof axisTitle === 'string' && axisTitle.trim()) {
            parts.push(axisTitle.trim());
        }
        const st = xPlaceholder.settings;
        if (st.title === 'manual' && typeof st.titleValue === 'string' && st.titleValue.trim()) {
            parts.push(st.titleValue.trim());
        }
    }
    const haystack = parts.join(' ').toLowerCase();
    return /дн|день|дней/.test(haystack) && /вылет/.test(haystack);
}

function isFlightDaysAxisContext(
    x: ServerField | undefined,
    xPlaceholder: {settings?: {title?: string; titleValue?: string}} | undefined,
): boolean {
    if (!x) {
        return false;
    }
    if (String(x.guid) === 'diff') {
        return true;
    }
    const parts: string[] = [getFieldTitle(x)];
    if (xPlaceholder?.settings) {
        const axisTitle = getAxisTitle(xPlaceholder.settings as ServerPlaceholderSettings, x);
        if (typeof axisTitle === 'string' && axisTitle.trim()) {
            parts.push(axisTitle.trim());
        }
        const st = xPlaceholder.settings;
        if (st.title === 'manual' && typeof st.titleValue === 'string' && st.titleValue.trim()) {
            parts.push(st.titleValue.trim());
        }
    }
    const haystack = parts.join(' ').toLowerCase();
    return /дн|день|дней/.test(haystack) && /вылет/.test(haystack);
}

function parseFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(',', '.').trim();
        if (!normalized) {
            return null;
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

const STRICT_FLIGHT_X_TICK_LENGTH_PX = 5;
const STRICT_FLIGHT_X_ZERO_TICK_LENGTH_PX = 2.12;
const STRICT_FLIGHT_Y_TICK_LENGTH_PX = 8;
const STRICT_FLIGHT_X_ZERO_LABEL_SHIFT_PX = -18;
const STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX = -13;
const STRICT_FLIGHT_X_LABELS_Y_PX = -8;
const STRICT_THRESHOLD_Y_VISUAL_SHIFT = 0;
const STRICT_FLIGHT_X_ZERO_LABEL_DX_PX = -7;
const STRICT_FLIGHT_X_ZERO_LABEL_DY_PX = 8;

function adjustFlightGuidePlotLineValue(value: unknown): number {
    const numeric = parseFiniteNumber(value);
    if (numeric === null) {
        return 0;
    }
    return numeric;
}

function adjustFlightGuidePlotLines(plotLines: any): any[] {
    if (!Array.isArray(plotLines)) {
        return [];
    }
    return plotLines.map((line) => ({
        ...line,
        value: adjustFlightGuidePlotLineValue(line?.value),
    }));
}

/** Совпадает с gravity preparer: горизонтали не должны задавать max X оси. */
function isForcedTailGuideGraph(graph: any): boolean {
    const normalized = String(graph?.legendTitle ?? graph?.title ?? '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    const data = Array.isArray(graph?.data) ? graph.data : [];
    const numericY: number[] = data
        .map((point: any) => parseFiniteNumber(point?.y))
        .filter((v: number | null): v is number => v !== null);
    const isFlatGuideByData =
        numericY.length >= 8 &&
        numericY.every((v: number) => Math.abs(v - numericY[0]) < 0.0001) &&
        [60, 61, 80, 100].some((mark) => Math.abs(numericY[0] - mark) < 0.0001);
    return (
        normalized === 'y' ||
        normalized.includes('пкз') ||
        normalized.includes('load') ||
        normalized.includes('%') ||
        (/(^|\s)60(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        (/(^|\s)61(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        (/(^|\s)80(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        (/(^|\s)100(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        isFlatGuideByData
    );
}

function getFlightThresholdValueFromName(rawName: string): number | null {
    const normalized = String(rawName ?? '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized.includes('заг') && !normalized.includes('load') && !normalized.includes('%')) {
        return null;
    }
    if (/(^|\s)100(\s|%|$)/.test(normalized)) {
        return 100;
    }
    if (/(^|\s)80(\s|%|$)/.test(normalized)) {
        return 80;
    }
    if (/(^|\s)61(\s|%|$)/.test(normalized)) {
        return 61;
    }
    if (/(^|\s)60(\s|%|$)/.test(normalized)) {
        return 60;
    }
    return null;
}

function maxFlightGuideYFromGraphs(graphs: any[]): number {
    let m = 0;
    for (const graph of graphs ?? []) {
        if (!isForcedTailGuideGraph(graph)) {
            continue;
        }
        const t = String(graph?.legendTitle ?? graph?.title ?? '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
        if (/(^|\s)100(\s|%|$)/.test(t) && t.includes('заг')) {
            m = Math.max(m, 100);
        } else if (/(^|\s)80(\s|%|$)/.test(t) && t.includes('заг')) {
            m = Math.max(m, 80);
        } else if (/(^|\s)61(\s|%|$)/.test(t) && t.includes('заг')) {
            m = Math.max(m, 61);
        } else if (/(^|\s)60(\s|%|$)/.test(t) && t.includes('заг')) {
            m = Math.max(m, 60);
        }
    }
    return m;
}

function strictFlightYAxisFromData(
    actualMaxY: number,
    graphs: any[] | undefined,
    settings?: AxisGridStepSource,
): {boundedMax: number; step: number; tickPositions: number[]} {
    const guideMax = graphs?.length ? maxFlightGuideYFromGraphs(graphs) : 0;
    let factualTop = Math.max(actualMaxY, guideMax);
    if (!Number.isFinite(factualTop) || factualTop <= 0) {
        factualTop = guideMax > 0 ? guideMax : 1;
    }
    const {axisMax, step, tickPositions} = computeYAxisMaxWithOneNiceHeadroomStep({
        factualTop,
        settings,
    });
    return {boundedMax: axisMax, step, tickPositions};
}

function sortLineGraphPointsByX(graphs: any[], direction: 'asc' | 'desc'): void {
    for (const graph of graphs) {
        const pts = graph?.data;
        if (!Array.isArray(pts) || pts.length < 2) {
            continue;
        }
        pts.sort((a: any, b: any) => {
            const ax = typeof a?.x === 'number' && Number.isFinite(a.x) ? a.x : Number(a?.x);
            const bx = typeof b?.x === 'number' && Number.isFinite(b.x) ? b.x : Number(b?.x);
            const aOk = Number.isFinite(ax);
            const bOk = Number.isFinite(bx);
            if (aOk && bOk) {
                return direction === 'asc' ? ax - bx : bx - ax;
            }
            if (aOk) {
                return -1;
            }
            if (bOk) {
                return 1;
            }
            return 0;
        });
    }
}

function extendThresholdSeriesToStrictFullDomain(graphs: any[]): void {
    const contentX = new Set<number>();
    let maxX = 0;
    for (const graph of graphs ?? []) {
        if (isForcedTailGuideGraph(graph)) {
            continue;
        }
        for (const point of graph?.data ?? []) {
            const xVal =
                typeof point?.x === 'number' && Number.isFinite(point.x)
                    ? point.x
                    : Number(point?.x);
            if (Number.isFinite(xVal)) {
                contentX.add(xVal);
                maxX = Math.max(maxX, xVal);
            }
        }
    }
    if (!Number.isFinite(maxX) || maxX < 0) {
        return;
    }
    const orderedContentX = Array.from(contentX).sort((a, b) => b - a);
    const domainX = orderedContentX.length ? orderedContentX : maxX === 0 ? [0] : [maxX, 0];
    if (domainX[domainX.length - 1] !== 0) {
        domainX.push(0);
    }
    if (domainX[0] !== maxX) {
        domainX.unshift(maxX);
    }
    for (const graph of graphs ?? []) {
        if (!isForcedTailGuideGraph(graph)) {
            continue;
        }
        const title = String(graph?.legendTitle ?? graph?.title ?? '');
        const thresholdFromName = getFlightThresholdValueFromName(title);
        const firstFinitePoint = (Array.isArray(graph?.data) ? graph.data : []).find((p: any) => {
            const y = parseFiniteNumber(p?.y);
            return y !== null;
        });
        const yValue =
            thresholdFromName ??
            (firstFinitePoint ? parseFiniteNumber(firstFinitePoint?.y) : null);
        if (yValue === null) {
            continue;
        }
        graph.data = domainX.map((x) => ({
            x,
            y: yValue,
            ...(firstFinitePoint?.custom !== undefined ? {custom: firstFinitePoint.custom} : {}),
        }));
    }
}

function applyStrictFlightZeroTicks(chart: any): void {
    const prevMarks = Array.isArray(chart.__strictFlightZeroTicks) ? chart.__strictFlightZeroTicks : [];
    prevMarks.forEach((mark: any) => {
        if (mark?.destroy) {
            mark.destroy();
        }
    });
    chart.__strictFlightZeroTicks = [];

    const xAxis = Array.isArray(chart?.xAxis) ? chart.xAxis[0] : undefined;
    if (xAxis && typeof xAxis.toPixels === 'function') {
        const xTicks = xAxis.ticks ? Object.entries(xAxis.ticks) : [];
        let zeroX: number | null = null;
        let zeroLabelElement: any = null;
        const rightEdgeX = xAxis.left + xAxis.len;
        xTicks.forEach(([key, tick]: [string, any]) => {
            const v = Number(key);
            const labelText = String(
                tick?.label?.textStr ?? tick?.label?.element?.textContent ?? '',
            ).trim();
            const isZeroByKey = Number.isFinite(v) && Math.abs(v) < 1e-8;
            const isZeroByLabel = labelText === '0';
            const tickPosPx =
                typeof tick?.pos === 'number' && Number.isFinite(tick.pos)
                    ? xAxis.toPixels(tick.pos, false)
                    : Number.isFinite(v)
                      ? xAxis.toPixels(v, false)
                      : NaN;
            const isRightEdgeTick =
                Number.isFinite(tickPosPx) && Math.abs(tickPosPx - rightEdgeX) < 1.25;
            if ((isZeroByKey || isZeroByLabel || isRightEdgeTick) && tick?.mark) {
                tick.mark.attr({opacity: 0});
            }
            if ((isZeroByKey || isZeroByLabel || isRightEdgeTick) && tick?.label?.element) {
                tick.label.element.style.opacity = '0';
            }
            if ((isZeroByKey || isZeroByLabel || isRightEdgeTick) && zeroX === null) {
                const pos = tickPosPx;
                if (Number.isFinite(pos)) {
                    zeroX = pos;
                }
                if (tick?.label?.element) {
                    zeroLabelElement = tick.label.element;
                }
            }
        });
        if (zeroLabelElement) {
            zeroLabelElement.style.transform = `translateY(${STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX - 2}px)`;
        }
        const x = zeroX ?? xAxis.toPixels(0, false);
        if (Number.isFinite(x)) {
            const y = xAxis.top + xAxis.height;
            const xTick = chart.renderer
                .path(['M', x, y, 'L', x, y + STRICT_FLIGHT_X_ZERO_TICK_LENGTH_PX])
                .attr({
                    stroke: xAxis.options?.tickColor || '#333333',
                    'stroke-width': 1,
                    zIndex: 8,
                })
                .add();
            chart.__strictFlightZeroTicks.push(xTick);

            const xZeroLabel = chart.renderer
                .text('0', x + STRICT_FLIGHT_X_ZERO_LABEL_DX_PX, y + STRICT_FLIGHT_X_ZERO_LABEL_DY_PX)
                .css({
                    fontSize: '11px',
                    fontWeight: '400',
                    color: '#333333',
                })
                .attr({zIndex: 9})
                .add();
            chart.__strictFlightZeroTicks.push(xZeroLabel);
        }
    }

    // Do not override Y=0 tick manually.
    // In editor mode Y-axis geometry may differ and custom overlay can drift.

    // Keep threshold guides as native Highcharts series to preserve shared tooltip and hover.
}

// eslint-disable-next-line complexity
function getHighchartsConfig(
    args: PrepareFunctionArgs & {
        graphs: any[];
        enableFlightDaysLinePreset: boolean;
        allowFlightDaysAxisHeuristics: boolean;
    },
) {
    const {
        placeholders,
        colors,
        colorsConfig,
        sort,
        visualizationId,
        shared,
        shapes,
        graphs,
        segments,
        idToDataType,
        enableFlightDaysLinePreset,
        allowFlightDaysAxisHeuristics,
    } = args;
    const xPlaceholder = placeholders.find((p) => p.id === PlaceholderId.X);
    const xPlaceholderSettings = xPlaceholder?.settings;
    const x: ServerField | undefined = xPlaceholder?.items[0];
    const isXDiscrete = getAxisMode(xPlaceholderSettings, x?.guid) === AxisMode.Discrete;
    const x2 = isVisualizationWithSeveralFieldsXPlaceholder(visualizationId)
        ? xPlaceholder?.items[1]
        : undefined;
    const yPlaceholder = placeholders.find((p) => p.id === PlaceholderId.Y);
    const y2Placeholder = placeholders.find((p) => p.id === PlaceholderId.Y2);
    const ySectionItems = yPlaceholder?.items || [];
    const y2SectionItems = y2Placeholder?.items || [];
    const mergedYSections = [...ySectionItems, ...y2SectionItems];
    const colorItem = colors[0];
    const shapeItem = shapes[0];
    const segment = segments[0];
    const segmentsMap = getSegmentMap(args);

    const xField = x ? ({guid: x.guid, data_type: idToDataType[x.guid]} as Field) : x;
    const chartConfig = getConfigWithActualFieldTypes({config: shared, idToDataType});
    const xAxisMode = getXAxisMode({config: chartConfig});
    const xAxisType = getAxisType({
        field: xField,
        settings: xPlaceholder?.settings,
        axisMode: xAxisMode,
    });

    let wizardXAxisFormatter =
        isDateField(x) && xAxisType === 'category'
            ? ChartkitHandlers.WizardXAxisFormatter
            : undefined;

    const customConfig: any = {
        plotOptions: {
            series: {
                clip: true,
                linecap: 'butt',
            },
        },
        xAxis: {
            type: xAxisType,
            reversed: isXAxisReversed(x, sort, visualizationId as WizardVisualizationId),
            labels: {
                useHTML: isHtmlField(x),
                // Keep the right-edge "0" visually under the Y axis in reversed flight charts.
                align: 'right',
                x: -2,
                style: {
                    fontSize: '11px',
                    fontWeight: '400',
                },
            },
            minPadding: 0,
            maxPadding: 0,
            startOnTick: false,
            endOnTick: false,
            minPixelPadding: 0,
            offset: 0,
        },
        yAxis: {},
        axesFormatting: {
            xAxis: [],
            yAxis: [],
        },
        exporting: {
            csv: {
                custom: {
                    categoryHeader: getFieldExportingOptions(x),
                },
                columnHeaderFormatter: ChartkitHandlers.WizardExportColumnNamesFormatter,
            },
        },
    };
    let strictNumericXAxisForEdgeFix = false;

    if (xAxisType === 'category') {
        customConfig.xAxis.tickmarkPlacement = 'on';
        const firstGraph = graphs.find((g) => Array.isArray(g?.data));
        const maxCategoryIndex = Math.max((firstGraph?.data?.length ?? 1) - 1, 0);
        customConfig.xAxis.min = 0;
        customConfig.xAxis.max = maxCategoryIndex;
    } else {
        const xf = x
            ? ({guid: x.guid, data_type: idToDataType[x.guid]} as Field)
            : undefined;
        const strictNumericXAxis =
            Boolean(xf && isNumberField(xf)) &&
            (String(x?.guid) === 'diff' ||
                isStrictDaysBeforeDepartureXHighcharts(x, xPlaceholder, idToDataType));
        const shouldForceFlightAxisByContext =
            enableFlightDaysLinePreset &&
            (strictNumericXAxis ||
                (allowFlightDaysAxisHeuristics && isFlightDaysAxisContext(x, xPlaceholder)));
        strictNumericXAxisForEdgeFix = shouldForceFlightAxisByContext;
        if (shouldForceFlightAxisByContext) {
            wizardXAxisFormatter = ChartkitHandlers.WizardXAxisFormatter;
            customConfig.xAxis.labels = {
                ...(customConfig.xAxis.labels || {}),
                useHTML: true,
                y: STRICT_FLIGHT_X_LABELS_Y_PX,
                edgeZeroShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_SHIFT_PX,
                edgeZeroVerticalShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX,
            };
            customConfig.xAxis.tickLength = STRICT_FLIGHT_X_TICK_LENGTH_PX;
        }
        let actualMinX = Number.POSITIVE_INFINITY;
        let actualMaxX = Number.NEGATIVE_INFINITY;
        for (const graph of graphs) {
            if (enableFlightDaysLinePreset && strictNumericXAxis && isForcedTailGuideGraph(graph)) {
                continue;
            }
            for (const point of graph?.data ?? []) {
                const xVal =
                    typeof point?.x === 'number' && Number.isFinite(point.x)
                        ? point.x
                        : Number(point?.x);
                if (!Number.isFinite(xVal)) {
                    continue;
                }
                actualMinX = Math.min(actualMinX, xVal);
                actualMaxX = Math.max(actualMaxX, xVal);
            }
        }
        if (Number.isFinite(actualMinX) && Number.isFinite(actualMaxX)) {
            if (strictNumericXAxis) {
                // Как у gravity-charts: домен [0 .. max по контенту], 0 у правого края (reversed).
                customConfig.xAxis.min = 0;
                customConfig.xAxis.max = actualMaxX;
                customConfig.xAxis.reversed = true;
            } else {
                customConfig.xAxis.min = actualMinX;
                customConfig.xAxis.max = actualMaxX;
            }
        }
    }

    addAxisFormatting(customConfig.axesFormatting.xAxis, visualizationId, xPlaceholder);
    addAxisFormatter({
        axisConfig: customConfig.xAxis,
        placeholder: xPlaceholder,
        otherwiseFormatter: wizardXAxisFormatter,
        chartConfig,
    });
    if (strictNumericXAxisForEdgeFix) {
        customConfig.xAxis.labels = {
            ...(customConfig.xAxis.labels || {}),
            formatter: ChartkitHandlers.WizardXAxisFormatter,
            useHTML: true,
            y: STRICT_FLIGHT_X_LABELS_Y_PX,
            edgeZeroShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_SHIFT_PX,
            edgeZeroVerticalShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX,
        };
    }

    let factualMaxYOverall = 0;
    if (mergedYSections.length) {
        // Ensure Y max always covers factual data points only.
        // Service guides (60/80/100, ПКЗ) must not trigger extra top scale.
        const actualMaxYByAxis = new Map<number, number>();
        for (const graph of graphs) {
            const graphTitle = String(graph?.legendTitle ?? graph?.title ?? '')
                .toUpperCase()
                .trim();
            if (enableFlightDaysLinePreset && isForcedTailGuideGraph(graph)) {
                continue;
            }
            if (graphTitle === 'Y') {
                continue;
            }
            const axisIndex =
                typeof graph?.yAxis === 'number' && Number.isFinite(graph.yAxis) ? graph.yAxis : 0;
            let axisMax = actualMaxYByAxis.get(axisIndex) ?? 0;
            for (const point of graph?.data ?? []) {
                const y = parseFiniteNumber(point?.y);
                if (y !== null) {
                    axisMax = Math.max(axisMax, y);
                }
            }
            actualMaxYByAxis.set(axisIndex, axisMax);
        }
        factualMaxYOverall = Math.max(0, ...Array.from(actualMaxYByAxis.values()));
        if (shouldUseGradientLegend(colorItem, colorsConfig, shared)) {
            customConfig.colorAxis = getHighchartsColorAxis(graphs, colorsConfig);
            customConfig.legend = {
                title: {
                    text: getFakeTitleOrTitle(colorItem),
                },
                enabled: isLegendEnabled(shared.extraSettings),
                symbolWidth: null,
            };
        }

        if (getIsNavigatorEnabled(shared)) {
            customConfig.xAxis.ordinal = isXDiscrete;
        }

        if (shared.extraSettings) {
            const {tooltipSum} = shared.extraSettings;

            if (typeof tooltipSum === 'undefined' || tooltipSum === 'on') {
                customConfig.enableSum = true;
            }
        }

        if (x && !isMeasureNameOrValue(x)) {
            customConfig.tooltipHeaderFormatter = getFakeTitleOrTitle(x);
        }

        if (_isEmpty(segmentsMap)) {
            const [layerYPlaceholder, layerY2Placeholder] = getYPlaceholders(args);

            addAxisFormatting(
                customConfig.axesFormatting.yAxis,
                visualizationId,
                layerYPlaceholder,
            );

            const formatMode = layerY2Placeholder?.settings?.axisFormatMode;
            if (formatMode && formatMode !== AxisLabelFormatMode.Auto) {
                const formatting = getAxisChartkitFormatting(layerY2Placeholder, visualizationId);
                if (formatting) {
                    if (customConfig.axesFormatting.yAxis.length === 0) {
                        customConfig.axesFormatting.yAxis.push({});
                    }

                    customConfig.axesFormatting.yAxis.push(formatting);
                }
            }

            if (layerYPlaceholder?.items.length && layerY2Placeholder?.items.length) {
                const y1 = {};
                const y2 = {};
                addAxisFormatter({
                    axisConfig: y1,
                    placeholder: layerYPlaceholder,
                });
                addAxisFormatter({
                    axisConfig: y2,
                    placeholder: layerY2Placeholder,
                });
                customConfig.yAxis = [y1, y2];
            } else if (layerYPlaceholder?.items.length) {
                addAxisFormatter({
                    axisConfig: customConfig.yAxis,
                    placeholder: layerYPlaceholder,
                });
            } else {
                addAxisFormatter({
                    axisConfig: customConfig.yAxis,
                    placeholder: layerY2Placeholder,
                });
            }
        } else {
            customConfig.legend = {
                enabled:
                    Boolean(
                        colorItem ||
                            shapeItem ||
                            x2 ||
                            ySectionItems.length > 1 ||
                            y2SectionItems.length > 1,
                    ) && isLegendEnabled(shared.extraSettings),
                symbolWidth: enableFlightDaysLinePreset ? 36 : undefined,
            };

            const {yAxisFormattings, yAxisSettings} = getSegmentsYAxis({
                segment,
                segmentsMap,
                placeholders: {
                    y: yPlaceholder,
                    y2: y2Placeholder,
                },
                visualizationId,
            });
            customConfig.yAxis = yAxisSettings;
            customConfig.axesFormatting.yAxis = yAxisFormattings;
        }

        // Promote axis max when actual series value is above configured/manual max.
        // For flight-load charts, keep 0..100 when factual values do not exceed 100.
        const hasFlightGuideSeries =
            enableFlightDaysLinePreset && graphs.some((graph) => isForcedTailGuideGraph(graph));
        const yAxes = Array.isArray(customConfig.yAxis)
            ? customConfig.yAxis
            : [customConfig.yAxis || {}];
        yAxes.forEach((axis: any, index: number) => {
            const actualMax = actualMaxYByAxis.get(index) ?? Math.max(0, ...Array.from(actualMaxYByAxis.values()));
            if (strictNumericXAxisForEdgeFix || hasFlightGuideSeries) {
                const yPh = index === 0 ? yPlaceholder : y2Placeholder;
                const {boundedMax, step, tickPositions} = strictFlightYAxisFromData(
                    actualMax,
                    graphs,
                    yPh?.settings as AxisGridStepSource,
                );
                axis.min = 0;
                axis.max = boundedMax;
                axis.tickInterval = step;
                axis.tickAmount = tickPositions.length;
                axis.tickPositions = tickPositions;
                axis.startOnTick = false;
                axis.endOnTick = false;
                axis.ceiling = boundedMax <= 100 ? 100 : boundedMax;
                axis.softMax = boundedMax <= 100 ? 100 : boundedMax;
                axis.maxPadding = 0;
                axis.tickLength = STRICT_FLIGHT_Y_TICK_LENGTH_PX;
                axis.labels = {
                    ...(axis.labels || {}),
                    y: 3,
                };
                axis.plotLines = adjustFlightGuidePlotLines(axis?.plotLines);
                return;
            }
            if (!actualMax || !Number.isFinite(actualMax)) {
                return;
            }
            const configuredMax = Number(axis?.max);
            if (Number.isFinite(configuredMax) && configuredMax >= actualMax) {
                return;
            }
            axis.max = Math.ceil(actualMax / 10) * 10;
            axis.min = Number.isFinite(Number(axis?.min)) ? Number(axis.min) : 0;
            axis.endOnTick = false;
            axis.startOnTick = false;
            axis.labels = {
                ...(axis.labels || {}),
                style: {
                    ...(axis.labels?.style || {}),
                    fontSize: '11px',
                    fontWeight: '400',
                },
            };
            axis.tickPosition = 'outside';
            axis.tickLength = 8;
            axis.title = {
                ...(axis.title || {}),
                margin: 24,
                style: {
                    ...(axis.title?.style || {}),
                    letterSpacing: 'normal',
                },
            };
        });
        customConfig.yAxis = Array.isArray(customConfig.yAxis) ? yAxes : yAxes[0];
    }

    const shouldForceFlightAxis =
        enableFlightDaysLinePreset &&
        (strictNumericXAxisForEdgeFix || graphs.some((graph) => isForcedTailGuideGraph(graph)));
    if (shouldForceFlightAxis) {
        const yAxes = Array.isArray(customConfig.yAxis)
            ? customConfig.yAxis
            : [customConfig.yAxis || {}];
        const {boundedMax, step, tickPositions} = strictFlightYAxisFromData(
            factualMaxYOverall,
            graphs,
            yPlaceholder?.settings as AxisGridStepSource,
        );
        yAxes.forEach((axis: any) => {
            axis.min = 0;
            axis.max = boundedMax;
            axis.tickInterval = step;
            axis.tickAmount = tickPositions.length;
            axis.tickPositions = tickPositions;
            axis.startOnTick = false;
            axis.endOnTick = false;
            axis.ceiling = boundedMax <= 100 ? 100 : boundedMax;
            axis.softMax = boundedMax <= 100 ? 100 : boundedMax;
            axis.maxPadding = 0;
            axis.tickLength = STRICT_FLIGHT_Y_TICK_LENGTH_PX;
            axis.labels = {
                ...(axis.labels || {}),
                y: 3,
            };
            axis.plotLines = adjustFlightGuidePlotLines(axis?.plotLines);
        });
        customConfig.yAxis = Array.isArray(customConfig.yAxis) ? yAxes : yAxes[0];
        const xAxes = Array.isArray(customConfig.xAxis)
            ? customConfig.xAxis
            : [customConfig.xAxis || {}];
        xAxes.forEach((axis: any) => {
            axis.tickLength = STRICT_FLIGHT_X_TICK_LENGTH_PX;
            axis.labels = {
                ...(axis.labels || {}),
                formatter: ChartkitHandlers.WizardXAxisFormatter,
                useHTML: true,
                y: STRICT_FLIGHT_X_LABELS_Y_PX,
                edgeZeroShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_SHIFT_PX,
                edgeZeroVerticalShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX,
                align: 'right',
                x: -2,
            };
        });
        customConfig.xAxis = Array.isArray(customConfig.xAxis) ? xAxes : xAxes[0];

    }

    if (shouldForceFlightAxis) {
        const previousLoad = customConfig.chart?.events?.load;
        const previousRender = customConfig.chart?.events?.render;
        customConfig.chart = {
            ...(customConfig.chart || {}),
            alignTicks: false,
            events: {
                ...(customConfig.chart?.events || {}),
                load: function (this: any) {
                    if (typeof previousLoad === 'function') {
                        previousLoad.apply(this, arguments as any);
                    }
                    const {boundedMax, step, tickPositions: fixedTickPositions} = strictFlightYAxisFromData(
                        factualMaxYOverall,
                        graphs,
                        yPlaceholder?.settings as AxisGridStepSource,
                    );
                    const yAxes = Array.isArray(this?.yAxis) ? this.yAxis : [];
                    yAxes.forEach((axis: any) => {
                        axis.update(
                            {
                                tickInterval: step,
                                tickAmount: fixedTickPositions.length,
                                tickPositions: fixedTickPositions,
                                startOnTick: false,
                                endOnTick: false,
                                ceiling: boundedMax <= 100 ? 100 : boundedMax,
                                softMax: boundedMax <= 100 ? 100 : boundedMax,
                                maxPadding: 0,
                                tickLength: STRICT_FLIGHT_Y_TICK_LENGTH_PX,
                                labels: {
                                    ...(axis.options?.labels || {}),
                                    y: 3,
                                },
                                plotLines: adjustFlightGuidePlotLines(axis.options?.plotLines),
                            },
                            false,
                        );
                        axis.setExtremes(0, boundedMax, false, false);
                    });
                    const xAxes = Array.isArray(this?.xAxis) ? this.xAxis : [];
                    xAxes.forEach((axis: any) => {
                        axis.update({tickLength: STRICT_FLIGHT_X_TICK_LENGTH_PX}, false);
                    });
                    this.redraw(false);
                },
                render: function (this: any) {
                    if (typeof previousRender === 'function') {
                        previousRender.apply(this, arguments as any);
                    }
                    applyStrictFlightZeroTicks(this);
                },
            },
        };
    }

    const shouldUseHtmlForLegend = [colorItem, shapeItem].some(isHtmlField);
    if (shouldUseHtmlForLegend) {
        set(customConfig, 'legend.useHTML', true);
    }

    return customConfig;
}

function getConfig(args: PrepareFunctionArgs) {
    const {placeholders, shared} = args;
    const config: any = {};

    const xFields = placeholders.find((p) => p.id === PlaceholderId.X)?.items || [];
    if (xFields.some(Boolean) && getIsNavigatorEnabled(shared)) {
        // For old charts. In the new charts, we put the navigator settings in navigatorSettings and
        // adding to the config in config.ts
        config.highstock = {
            base_series_name: shared.extraSettings?.navigatorSeriesName,
        };
    }

    const yFields = placeholders.find((p) => p.id === PlaceholderId.Y)?.items || [];
    const y2Fields = placeholders.find((p) => p.id === PlaceholderId.Y2)?.items || [];
    const hasFloatYFields = yFields.some(isFloatField) || y2Fields.some(isFloatField);
    if (hasFloatYFields) {
        config.precision = MINIMUM_FRACTION_DIGITS;
    }

    return config;
}

export function prepareHighchartsLine(args: PrepareFunctionArgs) {
    const {ChartEditor} = args;

    const preparedData = prepareLineData(args);
    const xPlaceholder = args.placeholders.find((p) => p.id === PlaceholderId.X);
    const xField = xPlaceholder?.items?.[0];
    const yFields = args.placeholders.find((p) => p.id === PlaceholderId.Y)?.items || [];
    const extraSettings = args.shared.extraSettings as Record<string, unknown>;
    const hasExplicitCustomizationProfile =
        hasExplicitVisualizationCustomizationProfile(extraSettings);
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings,
        titleHints: [
            String((args.shared as any).title ?? ''),
            String(xField?.fakeTitle ?? xField?.title ?? ''),
            ...yFields.map((field) => String(field?.fakeTitle ?? field?.title ?? '')),
        ],
    });
    const customizationBehavior =
        getVisualizationCustomizationBehaviorFlags(customizationProfile);
    const chartConfig = getConfigWithActualFieldTypes({config: args.shared, idToDataType: args.idToDataType});
    const xAxisMode = getXAxisMode({config: chartConfig});
    const xAxisType = getAxisType({
        field: xField ? ({guid: xField.guid, data_type: args.idToDataType[xField.guid]} as Field) : undefined,
        settings: xPlaceholder?.settings,
        axisMode: xAxisMode,
    });
    const hasStrictDaysBeforeDepartureXAxis =
        Boolean(xField && isNumberField({guid: xField.guid, data_type: args.idToDataType[xField.guid]} as Field)) &&
        (String(xField?.guid) === 'diff' ||
            isStrictDaysBeforeDepartureXHighcharts(xField, xPlaceholder, args.idToDataType));
    const shouldUseStrictNumericEdgeAxis =
        (customizationBehavior.enableFlightDaysLinePreset || !hasExplicitCustomizationProfile) &&
        hasStrictDaysBeforeDepartureXAxis;
    const enableFlightDaysLinePreset =
        customizationBehavior.enableFlightDaysLinePreset ||
        customizationBehavior.enableFlightSalesDynamicsComparisonLinePreset ||
        (!hasExplicitCustomizationProfile &&
            (hasStrictDaysBeforeDepartureXAxis ||
                preparedData.graphs.some((graph: any) => isForcedTailGuideGraph(graph))));
    const shouldForceFlightAxisByContext =
        enableFlightDaysLinePreset &&
        (hasStrictDaysBeforeDepartureXAxis ||
            (!hasExplicitCustomizationProfile && isFlightDaysAxisContext(xField, xPlaceholder)));

    // Dashboard 3: keep key guide/target lines visually consistent with gravity config
    // (solid line, same color mapping, readable width on low-DPI displays).
    preparedData.graphs = preparedData.graphs.map((graph: any) => {
        if (!enableFlightDaysLinePreset) {
            return graph;
        }
        const legendTitle = String(graph?.legendTitle ?? graph?.title ?? '').trim();
        const normalized = legendTitle.toUpperCase();
        const isYSeries = normalized === 'Y';
        const isTotalSeries = normalized === 'ВСЕГО';
        const isPkzSeries = normalized.includes('ПКЗ');
        const isClassCSeries =
            normalized === 'C' ||
            normalized === 'С' ||
            /CLASS\s+C$/.test(normalized) ||
            /^КЛАСС\s+[CС]\s*$/.test(normalized);
        const isLoad61 = /61\s*%/.test(normalized) && normalized.includes('ЗАГ');
        const isLoad60 = /60\s*%/.test(normalized) && normalized.includes('ЗАГ');
        const isLoad80 = /80\s*%/.test(normalized) && normalized.includes('ЗАГ');
        const isLoad100 = /100\s*%/.test(normalized) && normalized.includes('ЗАГ');

        let forcedColor: string | undefined;
        if (isYSeries) forcedColor = '#a1d8ee';
        else if (isTotalSeries) forcedColor = '#932893';
        else if (isPkzSeries) forcedColor = '#269326';
        else if (isLoad61 || isLoad60) forcedColor = '#ff0000';
        else if (isLoad80) forcedColor = '#ffff00';
        else if (isLoad100) forcedColor = '#2f972f';
        else if (isClassCSeries) forcedColor = '#5b5bff';

        if (!forcedColor && !isYSeries) {
            return graph;
        }

        const isThresholdLoadSeries = isLoad61 || isLoad60 || isLoad80 || isLoad100;
        const hasAnyZeroPoint =
            Array.isArray(graph?.data) &&
            graph.data.some((point: any) => {
                const y = parseFiniteNumber(point?.y);
                return y !== null && Math.abs(y) < 1e-8;
            });
        const thresholdTargetY = isLoad100 ? 100 : isLoad80 ? 80 : isLoad61 ? 61 : isLoad60 ? 60 : null;
        const adjustedData = isThresholdLoadSeries
            ? (Array.isArray(graph?.data) ? graph.data : []).map((point: any) => {
                  const y = parseFiniteNumber(point?.y);
                  if (y === null) {
                      return point;
                  }
                  return {
                      ...point,
                      y:
                          thresholdTargetY !== null
                              ? thresholdTargetY
                              : y + STRICT_THRESHOLD_Y_VISUAL_SHIFT,
                  };
              })
            : graph.data;

        return {
            ...graph,
            ...(forcedColor ? {color: forcedColor} : {}),
            lineWidth: 1,
            ...(shouldForceFlightAxisByContext
                ? ({
                      enableMouseTracking: true,
                      marker: {
                          enabled: false,
                          states: {
                              hover: {
                                  enabled: true,
                                  radius: normalized === 'Y' ? 4 : 3,
                                  fillColor: normalized === 'Y' ? '#ffffff' : forcedColor || graph.color,
                                  lineColor: forcedColor || graph.color,
                                  lineWidth: normalized === 'Y' ? 2 : 1,
                              },
                          },
                      },
                      states: {
                          hover: {
                              enabled: true,
                              lineWidthPlus: 0,
                              halo: {size: 0},
                          },
                          inactive: {opacity: 1},
                      },
                  } as any)
                : {}),
            // Keep threshold guides snapped to the same pixel grid as Y ticks.
            crisp: true,
            ...(isThresholdLoadSeries || hasAnyZeroPoint ? {clip: false} : {}),
            opacity: 1,
            connectNulls: true,
            ...(isThresholdLoadSeries
                ? ({
                      linecap: 'butt',
                      enableMouseTracking: true,
                      states: {
                          hover: {
                              enabled: true,
                              lineWidthPlus: 0,
                              halo: {size: 0},
                          },
                          inactive: {opacity: 1},
                      },
                  } as any)
                : {}),
            zIndex: hasAnyZeroPoint ? 28 : isYSeries ? 6 : graph.zIndex,
            data: adjustedData,
        };
    });

    // Только strict «дни до вылета» / diff: порядок точек для линии (как у gravity), без зеркалирования X.
    const plotXSortDir: 'asc' | 'desc' =
        shouldUseStrictNumericEdgeAxis &&
        xAxisType !== 'category' &&
        Boolean(xField && isNumberField({guid: xField.guid, data_type: args.idToDataType[xField.guid]} as Field))
            ? 'desc'
            : 'asc';
    // Keep threshold/guide series point arrays intact so shared tooltip
    // can include all classes at hovered X positions.
    if (enableFlightDaysLinePreset) {
        extendThresholdSeriesToStrictFullDomain(preparedData.graphs);
    }
    sortLineGraphPointsByX(preparedData.graphs, plotXSortDir);

    if (ChartEditor) {
        const highchartsConfig = getHighchartsConfig({
            ...args,
            graphs: preparedData.graphs,
            enableFlightDaysLinePreset,
            allowFlightDaysAxisHeuristics: !hasExplicitCustomizationProfile,
        });
        // Final hard-override layer: keep strict flight chart geometry stable
        // even if persisted dashboard axis settings try to override it later.
        const hasFlightGuides =
            enableFlightDaysLinePreset &&
            preparedData.graphs.some((graph: any) => isForcedTailGuideGraph(graph));
        if (hasFlightGuides || shouldForceFlightAxisByContext) {
            let factualMax = 0;
            preparedData.graphs.forEach((graph: any) => {
                if (isForcedTailGuideGraph(graph)) {
                    return;
                }
                (graph?.data || []).forEach((point: any) => {
                    const y = parseFiniteNumber(point?.y);
                    if (y !== null) {
                        factualMax = Math.max(factualMax, y);
                    }
                });
            });
            const yPhEditor = args.placeholders.find((p) => p.id === PlaceholderId.Y);
            const {boundedMax, step, tickPositions} = strictFlightYAxisFromData(
                factualMax,
                preparedData.graphs,
                yPhEditor?.settings as AxisGridStepSource,
            );
            const yAxes = Array.isArray(highchartsConfig.yAxis)
                ? highchartsConfig.yAxis
                : [highchartsConfig.yAxis || {}];
            yAxes.forEach((axis: any) => {
                axis.tickLength = STRICT_FLIGHT_Y_TICK_LENGTH_PX;
                if (hasFlightGuides || shouldForceFlightAxisByContext) {
                    axis.min = 0;
                    axis.max = boundedMax;
                    axis.tickInterval = step;
                    axis.tickAmount = tickPositions.length;
                    axis.tickPositions = tickPositions;
                    axis.startOnTick = false;
                    axis.endOnTick = false;
                    axis.ceiling = boundedMax <= 100 ? 100 : boundedMax;
                    axis.softMax = boundedMax <= 100 ? 100 : boundedMax;
                    axis.maxPadding = 0;
                    axis.labels = {
                        ...(axis.labels || {}),
                        y: 3,
                    };
                    axis.plotLines = adjustFlightGuidePlotLines(axis?.plotLines);
                }
            });
            highchartsConfig.yAxis = Array.isArray(highchartsConfig.yAxis) ? yAxes : yAxes[0];
            const xAxisList = Array.isArray(highchartsConfig.xAxis)
                ? highchartsConfig.xAxis
                : [highchartsConfig.xAxis || {}];
            xAxisList.forEach((axis: any) => {
                axis.tickLength = STRICT_FLIGHT_X_TICK_LENGTH_PX;
                axis.labels = {
                    ...(axis.labels || {}),
                    formatter: ChartkitHandlers.WizardXAxisFormatter,
                    useHTML: true,
                    y: STRICT_FLIGHT_X_LABELS_Y_PX,
                    edgeZeroShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_SHIFT_PX,
                    edgeZeroVerticalShiftPx: STRICT_FLIGHT_X_ZERO_LABEL_VERTICAL_SHIFT_PX,
                    align: 'right',
                    x: -2,
                };
            });
            highchartsConfig.xAxis = Array.isArray(highchartsConfig.xAxis) ? xAxisList : xAxisList[0];
            highchartsConfig.chart = {
                ...(highchartsConfig.chart || {}),
                alignTicks: false,
            };
        }
        const config = getConfig(args);
        ChartEditor.updateConfig(config);
        // Apply highcharts config LAST so persisted dashboard config cannot override strict fixes.
        ChartEditor.updateHighchartsConfig(highchartsConfig);
    }

    return preparedData;
}
