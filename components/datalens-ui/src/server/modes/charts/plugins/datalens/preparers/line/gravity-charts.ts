import type {
    ChartData,
    ChartSeries,
    ChartYAxis,
    LineSeries,
    LineSeriesData,
} from '@gravity-ui/chartkit/gravity-charts';
import merge from 'lodash/merge';
import sortBy from 'lodash/sortBy';

import type {
    SeriesExportSettings,
    ServerField,
    ServerPlaceholder,
    WrappedHTML,
    WrappedMarkdown,
} from '../../../../../../../shared';
import {
    AxisMode,
    PlaceholderId,
    getXAxisMode,
    isDateField,
    isHtmlField,
    isMarkdownField,
    isMarkupField,
    isNumberField,
} from '../../../../../../../shared';
import {getBaseChartConfig} from '../../gravity-charts/utils';
import {getFormattedLabel} from '../../gravity-charts/utils/dataLabels';
import {getFieldFormatOptions} from '../../gravity-charts/utils/format';
import {getAxisTitle} from '../../utils/axis-helpers';
import {getConfigWithActualFieldTypes} from '../../utils/config-helpers';
import {getExportColumnSettings} from '../../utils/export-helpers';
import {getFieldTitle, getOriginalTitleOrTitle} from '../../utils/misc-helpers';
import {getAxisType} from '../helpers/axis';
import {
    getVisualizationCustomizationBehaviorFlags,
    hasExplicitVisualizationCustomizationProfile,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import {getSegmentMap} from '../helpers/segments';
import type {PrepareFunctionArgs} from '../types';

import {
    ceilToTickStep,
    computeYAxisMaxWithOneNiceHeadroomStep,
    resolveLinearAxisTickStep,
} from './axis-nice-step';
import {prepareLineData} from './prepare-line-data';

/** Match getBaseChartConfig axis titles; line chart discrete X uses 11px only for tick labels. */
const LINE_CHART_AXIS_TITLE_STYLE = {
    fontSize: '13px',
    fontWeight: '400',
    fontColor: '#000000',
    letterSpacing: 'normal',
} as const;

/** Единый размер подписей делений для strict «дней до вылета» (ось X+Y). */
const STRICT_FLIGHT_AXIS_TICK_LABEL_STYLE = {
    fontSize: '12px',
    fontWeight: '400',
} as const;

// В strict-графике: X-штрихи короче, Y-штрихи длиннее; цифры на обеих осях одинакового размера.
const STRICT_FLIGHT_AXIS_X_TICK_LENGTH = 5;
const STRICT_FLIGHT_AXIS_Y_TICK_LENGTH = 8;
/** У «0» по X (правый край при reverse): длина штриха вниз, px. */
const STRICT_FLIGHT_AXIS_X_ZERO_TICK_LENGTH_PX = 4.6315925;
/** Толщина линий рядов/порогов в strict «днях до вылета» (цвета те же; stroke по центру пути). */
const STRICT_FLIGHT_SERIES_LINE_WIDTH = 2;
/** У «0» по Y: продолжение оси X вправо, еще на субпиксель короче. */
const STRICT_FLIGHT_AXIS_Y_ZERO_HORIZONTAL_LENGTH_PX = 3.75;
/** У «0» по Y: горизонтальный штрих на оси Y немного короче остальных штрихов Y. */
const STRICT_FLIGHT_AXIS_Y_ZERO_TICK_LENGTH_PX = 6.9;
/** Сдвиг подписи «0» по X (px в translate): чуть ниже остальных подписей X, дальше от линии оси. */
const STRICT_FLIGHT_AXIS_ZERO_LABEL_VERTICAL_NUDGE_PX = -0.60;
const STRICT_FLIGHT_AXIS_ZERO_LABEL_HORIZONTAL_NUDGE_PX = 0.09;
// Keep threshold lines on integer Y to avoid anti-alias "darker edges" on line sides.
const STRICT_THRESHOLD_Y_VISUAL_SHIFT = 0;

type ExtendedLineSeriesData = Omit<LineSeriesData, 'x'> & {
    x?: LineSeriesData['x'] | WrappedHTML | WrappedMarkdown;
};

type ExtendedLineSeries = Omit<LineSeries, 'data'> & {
    custom?: {
        exportSettings?: SeriesExportSettings;
    };
    data: ExtendedLineSeriesData[];
};

const SERIES_COLOR_BY_NAME: Record<string, string> = {
    Y: '#a1d8ee',
    ВСЕГО: '#932893',
    ПКЗ: '#269326',
    /** Дашборд 6 «Сравнение динамики продаж» + общие пороги — точные hex из макета */
    '61% загрузка': '#ff0000',
    '60% загрузка': '#ff0000',
    '80% загрузка': '#ffff00',
    '100% загрузка': '#2f972f',
    FLIGHT_1: '#ff00ff',
    FLIGHT_2: '#972f97',
    REF_60: '#ff0000',
    REF_80: '#ffff00',
    REF_100: '#2f972f',
    C: '#5b5bff',
    С: '#5b5bff',
};

const SERIES_ORDER: Record<string, number> = {
    Y: 0,
    ВСЕГО: 1,
    ПКЗ: 2,
    '61% загрузка': 3,
    '60% загрузка': 3,
    '80% загрузка': 4,
    '100% загрузка': 5,
    C: 6,
    С: 6,
};

function normalizedSeriesTitle(rawTitle: string): string {
    return String(rawTitle ?? '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Legend / SQL often use "class C" — must hit the same color + lineWidth/opacity as "C". */
function isClassCSeriesTitle(rawTitle: string): boolean {
    const norm = normalizedSeriesTitle(rawTitle);
    if (norm === 'C' || norm === 'С') {
        return true;
    }
    if (norm.length === 1 && norm.toLowerCase() === 'c') {
        return true;
    }
    if (/class\s+c$/i.test(norm)) {
        return true;
    }
    if (/^класс\s+[cс]\s*$/i.test(norm)) {
        return true;
    }
    return false;
}

function forcedColorForSeriesTitle(rawTitle: string): string | undefined {
    const norm = normalizedSeriesTitle(rawTitle);
    const direct = SERIES_COLOR_BY_NAME[norm];
    if (direct !== undefined) {
        return direct;
    }
    if (isClassCSeriesTitle(rawTitle)) {
        return SERIES_COLOR_BY_NAME.C;
    }
    const lower = norm.toLowerCase();
    if (lower.includes('заг')) {
        if (/(^|\s)(60|61)(\s|%|$)/.test(lower)) {
            return '#ff0000';
        }
        if (/(^|\s)80(\s|%|$)/.test(lower)) {
            return '#ffff00';
        }
        if (/(^|\s)100(\s|%|$)/.test(lower)) {
            return '#2f972f';
        }
    }
    return undefined;
}

/** Пороговые линии в легенде (60/80/100% загрузка, ПКЗ) — не путать с линиями рейсов. */
function isComparisonThresholdLegendTitle(rawTitle: string): boolean {
    const n = normalizedSeriesTitle(rawTitle).toLowerCase();
    if (n.includes('пкз')) {
        return true;
    }
    if (!n.includes('заг')) {
        return false;
    }
    return /(^|\s)(60|61|80|100)(\s|%|$)/.test(n);
}

/**
 * Ровно 2 серии рейсов + 3 порога — типичный макет дашборда 6; включаем порядок легенды и цвета рейсов.
 */
type GraphLegendMeta = {title?: string; data?: unknown};

function detectTwoFlightThreeThresholdLayout(graphs: GraphLegendMeta[]): boolean {
    const titles = graphs
        .map((g) => normalizedSeriesTitle(g.title ?? ''))
        .filter((t) => Boolean(t));
    const thr = titles.filter((t) => isComparisonThresholdLegendTitle(t));
    const flights = titles.filter((t) => !isComparisonThresholdLegendTitle(t));
    const uniqueFlights = new Set(flights);
    return uniqueFlights.size === 2 && thr.length === 3;
}

/** Ранги 5,6 — рейсы; 30+ — пороги (после стандартных Y/ВСЕГО/ПКЗ). */
function buildCompFlightSalesOrderMap(graphs: GraphLegendMeta[]): Map<string, number> | undefined {
    if (!detectTwoFlightThreeThresholdLayout(graphs)) {
        return undefined;
    }
    const flightTitles = [
        ...new Set(
            graphs
                .map((g) => normalizedSeriesTitle(g.title ?? ''))
                .filter((t) => t && !isComparisonThresholdLegendTitle(t)),
        ),
    ].sort((a, b) => a.localeCompare(b, 'ru'));
    if (flightTitles.length !== 2) {
        return undefined;
    }
    return new Map(flightTitles.map((t, i) => [t, 5 + i] as const));
}

function compFlightSalesThresholdOrderRank(seriesName: string): number | undefined {
    if (!isComparisonThresholdLegendTitle(seriesName)) {
        return undefined;
    }
    const n = normalizedSeriesTitle(seriesName).toLowerCase();
    const base = 30;
    if (n.includes('пкз')) {
        return base + 3;
    }
    if (/(^|\s)(60|61)(\s|%|$)/.test(n) && n.includes('заг')) {
        return base;
    }
    if (/(^|\s)80(\s|%|$)/.test(n) && n.includes('заг')) {
        return base + 1;
    }
    if (/(^|\s)100(\s|%|$)/.test(n) && n.includes('заг')) {
        return base + 2;
    }
    return base + 10;
}

function seriesOrderRank(seriesName: string, compFlightOrder?: Map<string, number>): number {
    const norm = normalizedSeriesTitle(seriesName);
    if (compFlightOrder?.has(norm)) {
        return compFlightOrder.get(norm)!;
    }
    const compThr = compFlightOrder ? compFlightSalesThresholdOrderRank(seriesName) : undefined;
    if (compThr !== undefined) {
        return compThr;
    }
    const fromMap = SERIES_ORDER[norm];
    if (fromMap !== undefined) {
        return fromMap;
    }
    if (isClassCSeriesTitle(seriesName)) {
        return SERIES_ORDER.C;
    }
    return Number.MAX_SAFE_INTEGER;
}

const COMP_FLIGHT_SALES_LINE_COLORS: [string, string] = ['#ff00ff', '#972f97'];

function parseFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
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

function withTopHeadroomIfEdgeHit(args: {actualMax: number; roundedMax: number}): number {
    const {actualMax, roundedMax} = args;
    if (!Number.isFinite(actualMax) || !Number.isFinite(roundedMax) || roundedMax <= 0) {
        return roundedMax;
    }
    // Keep Y max on the rounded step itself; do not add an extra top step.
    return roundedMax;
}

/**
 * Строгая ось «дней до вылета»: смотрим fakeTitle/original/title поля, подпись оси (auto/manual),
 * иначе Wizard часто оставляет поле с коротким title, а «Дней до вылета…» только в fakeTitle/titleValue.
 */
function isStrictDaysBeforeDepartureXAxis(
    xField?: ServerField,
    xPlaceholder?: ServerPlaceholder,
): boolean {
    if (!xField || !isNumberField(xField)) {
        return false;
    }
    if (String(xField.guid) === 'diff') {
        return true;
    }
    const parts: string[] = [
        getFieldTitle(xField),
        String(getOriginalTitleOrTitle({title: xField.title ?? '', originalTitle: xField.originalTitle}) ?? ''),
    ];
    if (xPlaceholder?.settings) {
        const axisTitle = getAxisTitle(xPlaceholder.settings, xField);
        if (typeof axisTitle === 'string' && axisTitle.trim()) {
            parts.push(axisTitle.trim());
        }
        const st = xPlaceholder.settings as {title?: string; titleValue?: string};
        if (st.title === 'manual' && typeof st.titleValue === 'string' && st.titleValue.trim()) {
            parts.push(st.titleValue.trim());
        }
    }
    const haystack = parts.join(' ').toLowerCase();
    return /дн|день|дней/.test(haystack) && /вылет/.test(haystack);
}

function assignCompFlightSalesLineColors(
    seriesList: ExtendedLineSeries[],
    compFlightOrder: Map<string, number> | undefined,
): void {
    if (!compFlightOrder || compFlightOrder.size !== 2) {
        return;
    }
    for (const s of seriesList) {
        const norm = normalizedSeriesTitle(String(s.name ?? ''));
        if (!compFlightOrder.has(norm)) {
            continue;
        }
        if (forcedColorForSeriesTitle(String(s.name ?? '')) !== undefined) {
            continue;
        }
        const idx = (compFlightOrder.get(norm) ?? 5) - 5;
        if (idx === 0 || idx === 1) {
            s.color = COMP_FLIGHT_SALES_LINE_COLORS[idx];
        }
    }
}

/** Fills every integer between min and max (descending) so X includes 0 when data ends earlier. */
const DENSE_NUMERIC_X_CATEGORY_RANGE_LIMIT = 400;

function buildDenseNumericCategoryOrder(uniqueValues: number[]): number[] | null {
    if (uniqueValues.length === 0) {
        return null;
    }
    const min = Math.min(...uniqueValues);
    const max = Math.max(...uniqueValues);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null;
    }
    if (max - min > DENSE_NUMERIC_X_CATEGORY_RANGE_LIMIT) {
        return Array.from(new Set(uniqueValues)).sort((a, b) => b - a);
    }
    const lo = min > 0 ? 0 : min;
    const out: number[] = [];
    for (let v = max; v >= lo; v--) {
        out.push(v);
    }
    return out;
}

/**
 * X extent from series that are not long flat lines (per-day thresholds share one Y for all categories).
 * Short flat series (e.g. 2-point guides) still contribute X so endpoints stay on scale.
 */
function collectNumericXFromGraphs(graphs: any[], categories: readonly unknown[]): number[] {
    const set = new Set<number>();
    const catLen = categories.length;
    for (const g of graphs) {
        const data = g.data || [];
        const ys = data
            .map((pt: any) => pt?.y)
            .filter(
                (y: unknown) => typeof y === 'number' && Number.isFinite(y as number),
            ) as number[];
        const isFlat = ys.length >= 2 && ys.every((y) => y === ys[0]);
        if (isFlat && data.length > 20) {
            continue;
        }
        for (const pt of data) {
            const idx = pt?.x;
            let n: number | null = null;
            if (
                typeof idx === 'number' &&
                Number.isFinite(idx) &&
                catLen > 0 &&
                idx >= 0 &&
                idx < catLen
            ) {
                n = Number(categories[idx]);
            } else if (typeof idx === 'number' && Number.isFinite(idx)) {
                n = Number(idx);
            }
            if (n !== null && Number.isFinite(n)) {
                set.add(n);
            }
        }
    }
    return Array.from(set);
}

/** Макс. числовой X только по «контентным» сериям (без ПКЗ/порогов %), чтобы ось не раздували горизонтали. */
function maxNumericXOverSeries(
    seriesList: ExtendedLineSeries[],
    includeSeries: (seriesTitle: string) => boolean,
): number {
    let m = 0;
    for (const s of seriesList) {
        if (!includeSeries(String(s.name ?? '').trim())) {
            continue;
        }
        for (const p of s.data) {
            if (typeof p.x === 'number' && Number.isFinite(p.x)) {
                m = Math.max(m, p.x);
            }
        }
    }
    return m;
}

/** Horizontal threshold lines should span the full category range (left = max days, right = 0). */
function isForcedTailSeriesName(name: string): boolean {
    const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
    return (
        normalized === 'y' ||
        normalized.includes('пкз') ||
        (/(\b|^)(60|61|80|100)(\b|%|$)/.test(normalized) &&
            (normalized.includes('заг') || normalized.includes('load') || normalized.includes('%')))
    );
}

function isTop100ThresholdSeriesName(name: string): boolean {
    const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
    return (/(^|\s)100(\s|%|$)/.test(normalized) && normalized.includes('заг'));
}

function getForcedThresholdValueBySeriesName(name: string): number | null {
    const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
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

/** Верх пороговых рядов по легенде/имени — чтобы ось Y закрывала все линии + ровно один шаг сетки. */
function maxForcedThresholdYFromSeries(seriesList: ExtendedLineSeries[]): number {
    let m = 0;
    for (const s of seriesList) {
        const n = String(s.name ?? '').trim();
        if (!isForcedTailSeriesName(n)) {
            continue;
        }
        const fromName = getForcedThresholdValueBySeriesName(n);
        if (fromName !== null) {
            m = Math.max(m, fromName);
        }
        for (const p of s.data) {
            if (typeof p.y === 'number' && Number.isFinite(p.y)) {
                m = Math.max(m, p.y);
            }
        }
    }
    return m;
}

function extendSelectedSeriesToRightEdge(
    seriesList: ExtendedLineSeries[],
    maxInclusiveX: number,
    dataLabelsEnabled: boolean,
): void {
    if (maxInclusiveX < 1) {
        return;
    }
    const maxXIdx = Math.floor(maxInclusiveX);
    for (const s of seriesList) {
        const seriesName = String(s.name ?? '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            continue;
        }
        const pts = s.data;
        if (pts.length === 0) {
            continue;
        }
        let lastFiniteIndex = -1;
        let maxDataX = -Infinity;
        for (let i = 0; i < pts.length; i++) {
            const py = pts[i].y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                lastFiniteIndex = i;
            }
            const px = pts[i].x;
            if (typeof px === 'number' && Number.isFinite(px)) {
                maxDataX = Math.max(maxDataX, px);
            }
        }
        if (lastFiniteIndex < 0) {
            continue;
        }

        const anchor = pts[lastFiniteIndex];
        const y = anchor.y;
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            continue;
        }

        // Fill trailing empty points with the same Y so the segment remains native in series color.
        for (let i = lastFiniteIndex + 1; i < pts.length; i++) {
            const point = pts[i];
            const py = point.y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                continue;
            }
            point.y = y;
            if (anchor.custom !== undefined && point.custom === undefined) {
                point.custom = anchor.custom;
            }
            if (dataLabelsEnabled) {
                point.label = '';
            }
        }

        // If dense categories (e.g. ... 3,2,1,0) are not represented by points at all,
        // add all missing right-side points (same Y) to keep the line visually native.
        if (Number.isFinite(maxDataX) && maxDataX < maxXIdx) {
            const existingX = new Set<number>();
            for (const p of pts) {
                if (typeof p.x === 'number' && Number.isFinite(p.x)) {
                    existingX.add(p.x);
                }
            }
            for (let x = Math.floor(maxDataX) + 1; x <= maxXIdx; x++) {
                if (existingX.has(x)) {
                    continue;
                }
                const tailPoint: ExtendedLineSeriesData = {
                    x,
                    y,
                    ...(anchor.custom !== undefined ? {custom: anchor.custom} : {}),
                };
                if (dataLabelsEnabled) {
                    tailPoint.label = '';
                }
                pts.push(tailPoint);
            }
        }
    }
}

/** Same Y from category index 0 to the first point — removes a gap at the max-days side. */
function extendSelectedSeriesToLeftEdge(
    seriesList: ExtendedLineSeries[],
    dataLabelsEnabled: boolean,
): void {
    if (!seriesList.length) {
        return;
    }
    const leftmostIdx = 0;
    for (const s of seriesList) {
        const seriesName = String(s.name ?? '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            continue;
        }
        const pts = s.data;
        if (pts.length === 0) {
            continue;
        }
        let minDataX = Infinity;
        let anchor: ExtendedLineSeriesData | null = null;
        for (const p of pts) {
            const px = p.x;
            const py = p.y;
            if (typeof px !== 'number' || !Number.isFinite(px)) {
                continue;
            }
            if (typeof py === 'number' && Number.isFinite(py)) {
                if (px < minDataX) {
                    minDataX = px;
                    anchor = p;
                }
            }
        }
        if (anchor === null || !Number.isFinite(minDataX) || minDataX <= leftmostIdx) {
            continue;
        }
        const y = anchor.y;
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            continue;
        }
        const existingX = new Set<number>();
        for (const p of pts) {
            if (typeof p.x === 'number' && Number.isFinite(p.x)) {
                existingX.add(p.x);
            }
        }
        const toPrepend: ExtendedLineSeriesData[] = [];
        for (let x = leftmostIdx; x < minDataX; x++) {
            if (existingX.has(x)) {
                continue;
            }
            const headPoint: ExtendedLineSeriesData = {
                x,
                y,
                ...(anchor.custom !== undefined ? {custom: anchor.custom} : {}),
            };
            if (dataLabelsEnabled) {
                headPoint.label = '';
            }
            toPrepend.push(headPoint);
        }
        if (toPrepend.length > 0) {
            s.data = [...toPrepend, ...pts];
        }
    }
}

function sortForcedTailSeriesByX(seriesList: ExtendedLineSeries[], direction: 'asc' | 'desc'): void {
    for (const s of seriesList) {
        const n = String(s.name ?? '').trim();
        if (!isForcedTailSeriesName(n)) {
            continue;
        }
        s.data.sort((a, b) => {
            const ax = typeof a.x === 'number' && Number.isFinite(a.x) ? a.x : 0;
            const bx = typeof b.x === 'number' && Number.isFinite(b.x) ? b.x : 0;
            return direction === 'asc' ? ax - bx : bx - ax;
        });
    }
}

function sortAllSeriesByX(seriesList: ExtendedLineSeries[], direction: 'asc' | 'desc'): void {
    for (const s of seriesList) {
        s.data.sort((a, b) => {
            const ax = typeof a.x === 'number' && Number.isFinite(a.x) ? a.x : 0;
            const bx = typeof b.x === 'number' && Number.isFinite(b.x) ? b.x : 0;
            return direction === 'asc' ? ax - bx : bx - ax;
        });
    }
}

function alignForcedTailSeriesToStrictFullDomain(args: {
    seriesList: ExtendedLineSeries[];
    maxInclusiveX: number;
    sortDir: 'asc' | 'desc';
    dataLabelsEnabled: boolean;
}): void {
    const {seriesList, maxInclusiveX, sortDir, dataLabelsEnabled} = args;
    if (!Number.isFinite(maxInclusiveX) || maxInclusiveX < 0) {
        return;
    }
    const maxX = Math.floor(maxInclusiveX);
    const contentX = new Set<number>();

    seriesList.forEach((series) => {
        const seriesName = String(series.name ?? '').trim();
        if (isForcedTailSeriesName(seriesName)) {
            return;
        }
        series.data.forEach((point) => {
            if (typeof point.x === 'number' && Number.isFinite(point.x)) {
                contentX.add(point.x);
            }
        });
    });

    const orderedContentX = Array.from(contentX).sort((a, b) => (sortDir === 'asc' ? a - b : b - a));
    const domainX = orderedContentX.length
        ? orderedContentX
        : maxX === 0
          ? [0]
          : sortDir === 'desc'
            ? [maxX, 0]
            : [0, maxX];
    const firstDomainX = domainX[0];
    const lastDomainX = domainX[domainX.length - 1];
    if (sortDir === 'desc') {
        if (firstDomainX !== maxX) {
            domainX.unshift(maxX);
        }
        if (lastDomainX !== 0) {
            domainX.push(0);
        }
    } else {
        if (firstDomainX !== 0) {
            domainX.unshift(0);
        }
        if (lastDomainX !== maxX) {
            domainX.push(maxX);
        }
    }

    seriesList.forEach((s) => {
        const seriesName = String(s.name ?? '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            return;
        }
        const forcedY = getForcedThresholdValueBySeriesName(seriesName);
        const firstFinite = s.data.find((p) => typeof p.y === 'number' && Number.isFinite(p.y));
        const y = forcedY ?? firstFinite?.y;
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            return;
        }
        s.data = domainX.map((x) => ({
            x,
            y,
            ...(firstFinite?.custom !== undefined ? {custom: firstFinite.custom} : {}),
            ...(dataLabelsEnabled ? {label: ''} : {}),
        }));
    });
}

export function prepareGravityChartLine(args: PrepareFunctionArgs) {
    const {
        labels,
        placeholders,
        disableDefaultSorting = false,
        shared,
        idToDataType,
        colors,
        shapes,
        visualizationId,
        sort,
        ChartEditor,
    } = args;
    const xPlaceholder = placeholders.find((p) => p.id === PlaceholderId.X);
    const xField: ServerField | undefined = xPlaceholder?.items?.[0];
    const yPlaceholder = placeholders.find((p) => p.id === PlaceholderId.Y);
    const yFields = yPlaceholder?.items || [];
    const labelField = labels?.[0];
    const isDataLabelsEnabled = Boolean(labelField);
    const extraSettings = shared.extraSettings as Record<string, unknown>;
    const hasExplicitCustomizationProfile =
        hasExplicitVisualizationCustomizationProfile(extraSettings);
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings,
        titleHints: [
            String((shared as any).title ?? ''),
            String(xField?.fakeTitle ?? xField?.title ?? ''),
            ...yFields.map((field) => String(field?.fakeTitle ?? field?.title ?? '')),
        ],
    });
    const customizationBehavior =
        getVisualizationCustomizationBehaviorFlags(customizationProfile);
    const chartConfig = getConfigWithActualFieldTypes({config: shared, idToDataType});
    const xAxisMode = getXAxisMode({config: chartConfig}) ?? AxisMode.Discrete;
    const isCategoriesXAxis =
        !xField ||
        getAxisType({
            field: xField,
            settings: xPlaceholder?.settings,
            axisMode: xAxisMode,
        }) === 'category' ||
        disableDefaultSorting;
    const hasStrictDaysBeforeDepartureXAxis =
        isNumberField(xField) &&
        (String(xField?.guid) === 'diff' ||
            isStrictDaysBeforeDepartureXAxis(xField, xPlaceholder));
    const shouldUseStrictNumericEdgeAxis =
        (customizationBehavior.enableFlightDaysLinePreset || !hasExplicitCustomizationProfile) &&
        hasStrictDaysBeforeDepartureXAxis;

    if (!xField || !yFields.length) {
        return {
            series: {
                data: [],
            },
        };
    }

    const preparedData = prepareLineData(args);
    const enableComparisonLinePreset =
        customizationBehavior.enableFlightSalesDynamicsComparisonLinePreset ||
        (!hasExplicitCustomizationProfile &&
            detectTwoFlightThreeThresholdLayout(preparedData.graphs));
    const enableFlightDaysLinePreset =
        customizationBehavior.enableFlightDaysLinePreset ||
        enableComparisonLinePreset ||
        (!hasExplicitCustomizationProfile &&
            (hasStrictDaysBeforeDepartureXAxis ||
                preparedData.graphs.some((graph: any) =>
                    isForcedTailSeriesName(String(graph?.title ?? graph?.legendTitle ?? '')),
                )));
    const xCategories = preparedData.categories;
    const xNumericFromSeries = collectNumericXFromGraphs(preparedData.graphs, xCategories ?? []);
    const fallbackNumericUnique = Array.from(
        new Set((xCategories ?? []).map((v) => Number(v)).filter((v) => Number.isFinite(v))),
    );
    const uniqueNumericForDense =
        xNumericFromSeries.length > 0 ? xNumericFromSeries : fallbackNumericUnique;
    const numericCategoryOrder =
        isCategoriesXAxis && isNumberField(xField) && !shouldUseStrictNumericEdgeAxis
            ? buildDenseNumericCategoryOrder(uniqueNumericForDense)
            : null;
    const numericCategoryIndexByValue = numericCategoryOrder
        ? new Map(numericCategoryOrder.map((v, i) => [String(v), i]))
        : null;

    const exportSettings: SeriesExportSettings = {
        columns: [
            getExportColumnSettings({path: 'x', field: xField}),
            getExportColumnSettings({path: 'y', field: yFields[0]}),
        ],
    };

    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push(
            getExportColumnSettings({path: 'series.custom.colorValue', field: colorItem}),
        );
    }

    const shapeItem = shapes[0];
    if (shapeItem) {
        exportSettings.columns.push(
            getExportColumnSettings({path: 'series.custom.shapeValue', field: shapeItem}),
        );
    }

    const shouldUseHtmlForLabels =
        isMarkupField(labelField) || isHtmlField(labelField) || isMarkdownField(labelField);

    const compFlightOrderMap = enableComparisonLinePreset
        ? buildCompFlightSalesOrderMap(preparedData.graphs)
        : undefined;

    const seriesData: ExtendedLineSeries[] = preparedData.graphs.map<LineSeries>((graph: any) => {
        const graphName = normalizedSeriesTitle(graph.title ?? '');
        const forcedColor = enableFlightDaysLinePreset
            ? forcedColorForSeriesTitle(graph.title ?? '')
            : undefined;
        const isForcedTailSeries =
            enableFlightDaysLinePreset && isForcedTailSeriesName(graphName);
        const forcedThresholdY = enableFlightDaysLinePreset
            ? getForcedThresholdValueBySeriesName(graphName)
            : null;
        const isTop100ThresholdSeries =
            enableFlightDaysLinePreset && isTop100ThresholdSeriesName(graphName);
        const isYGuideSeries = enableFlightDaysLinePreset && graphName.toUpperCase() === 'Y';
        const hasAnyZeroPoint =
            Array.isArray(graph?.data) &&
            graph.data.some((point: any) => {
                const y = parseFiniteNumber(point?.y);
                return y !== null && Math.abs(y) < 1e-8;
            });
        // Цвет/палитра — здесь; толщина линии и легенды — из series.options.line.lineWidth (единая для всех рядов).
        const emphasizedLineStyle = forcedColor !== undefined || isForcedTailSeries || isYGuideSeries;
        return {
            name: graphName,
            type: 'line',
            // Иначе пороги из визарда несут lineWidth:1 и перебивают series.options.line в prepareLineSeries.
            ...(shouldUseStrictNumericEdgeAxis ? {lineWidth: STRICT_FLIGHT_SERIES_LINE_WIDTH} : {}),
            ...(shouldUseStrictNumericEdgeAxis
                ? ({
                      marker: {
                          enabled: false,
                          states: {
                              hover: {
                                  enabled: true,
                                  radius: graphName.toUpperCase() === 'Y' ? 4 : 3,
                                  fillColor:
                                      graphName.toUpperCase() === 'Y'
                                          ? '#ffffff'
                                          : forcedColor || graph.color,
                                  lineColor: forcedColor || graph.color,
                                  lineWidth: graphName.toUpperCase() === 'Y' ? 2 : 1,
                              },
                          },
                      },
                  } as any)
                : {}),
            color: forcedColor || graph.color,
            opacity: emphasizedLineStyle ? 1 : undefined,
            connectNulls: emphasizedLineStyle ? true : graph.connectNulls,
            zIndex: isTop100ThresholdSeries
                ? 30
                : hasAnyZeroPoint
                  ? 28
                  : isYGuideSeries || isForcedTailSeries
                    ? 20
                    : undefined,
            ...(isForcedTailSeries || hasAnyZeroPoint
                ? ({
                      clip: false,
                      crisp: true,
                      linecap: 'butt',
                      dashStyle: 'Solid',
                      opacity: 1,
                      states: {
                          hover: {enabled: true},
                          inactive: {opacity: 1},
                      },
                  } as any)
                : {}),
            data: graph.data.reduce((acc: ExtendedLineSeriesData[], item: any, index: number) => {
                const rawY = item?.y;
                const numericY = parseFiniteNumber(rawY);
                const dataItem: ExtendedLineSeriesData = {
                    y:
                        isForcedTailSeries && numericY !== null
                            ? (forcedThresholdY ?? numericY) + STRICT_THRESHOLD_Y_VISUAL_SHIFT
                            : numericY,
                    custom: item.custom,
                };

                if (isDataLabelsEnabled) {
                    if (rawY === null || rawY === undefined) {
                        dataItem.label = '';
                    } else if (shouldUseHtmlForLabels) {
                        dataItem.label = item?.label;
                    } else {
                        dataItem.label = getFormattedLabel(item?.label, labelField);
                    }
                }

                // Wizard часто даёт discrete/category при числовом X; strict-ось X — линейная по «дням»,
                // индексы категорий здесь дали бы рассинхрон с xAxis.min/max (линия «сжата» слева).
                if (isCategoriesXAxis && !shouldUseStrictNumericEdgeAxis) {
                    if (numericCategoryIndexByValue) {
                        const catKey =
                            item?.x !== undefined && item?.x !== null
                                ? String(item.x)
                                : xCategories !== undefined && index < xCategories.length
                                  ? String(xCategories[index])
                                  : '';
                        const mapped =
                            catKey !== '' ? numericCategoryIndexByValue.get(catKey) : undefined;
                        if (mapped === undefined) {
                            return acc;
                        }
                        dataItem.x = mapped;
                    } else {
                        dataItem.x = index;
                    }
                } else if (!item && xCategories) {
                    dataItem.x = xCategories[index];
                } else {
                    if (shouldUseStrictNumericEdgeAxis) {
                        const rawX = item?.x;
                        if (rawX === undefined || rawX === null) {
                            const fromCategories =
                                xCategories !== undefined && index < xCategories.length
                                    ? Number(xCategories[index])
                                    : NaN;
                            dataItem.x = Number.isFinite(fromCategories) ? fromCategories : index;
                        } else {
                            const asNumber = Number(rawX);
                            dataItem.x = Number.isFinite(asNumber) ? asNumber : rawX;
                        }
                    } else {
                        dataItem.x = item?.x;
                    }
                }

                acc.push(dataItem);

                return acc;
            }, []),
            dataLabels: {
                enabled: isDataLabelsEnabled,
                html: shouldUseHtmlForLabels,
            },
            legend: {
                symbol: {
                    width: 36,
                },
            },
            dashStyle: graph.dashStyle,
            yAxis: graph.yAxis,
            custom: {
                ...graph.custom,
                exportSettings,
                colorValue: graph.colorValue,
                shapeValue: graph.shapeValue,
            },
        };
    });

    if (enableComparisonLinePreset) {
        assignCompFlightSalesLineColors(seriesData, compFlightOrderMap);
    }

    const categoryCountForTail = numericCategoryOrder?.length ?? xCategories?.length ?? 0;

    const xSortItem = sort?.find((s) => s.guid === xField?.guid);
    const isXSortedDescBySort = xSortItem?.direction === 'DESC';
    const isXReversedBySetting = xPlaceholder?.settings?.axisOrder === 'desc';
    const isXReversed = isXReversedBySetting || isXSortedDescBySort;

    // @gravity-ui/charts: линия в порядке точек. Strict «дни до вылета» / diff: linear + order reverse,
    // без зеркалирования X — сортируем по убыванию X (в т.ч. если Wizard даёт discrete/category флаг,
    // но сюда приходят числовые «дни»).
    const plotXSortDir: 'asc' | 'desc' =
        shouldUseStrictNumericEdgeAxis && isNumberField(xField) ? 'desc' : 'asc';

    sortAllSeriesByX(seriesData, plotXSortDir);

    const contentMaxX = maxNumericXOverSeries(
        seriesData,
        (n) => !(enableFlightDaysLinePreset && isForcedTailSeriesName(n)),
    );
    let pinnedMaxX = contentMaxX;
    if (shouldUseStrictNumericEdgeAxis && pinnedMaxX === 0 && xCategories?.length) {
        for (const c of xCategories) {
            const n = Number(c);
            if (Number.isFinite(n)) {
                pinnedMaxX = Math.max(pinnedMaxX, n);
            }
        }
    }
    if (shouldUseStrictNumericEdgeAxis && pinnedMaxX === 0) {
        pinnedMaxX = maxNumericXOverSeries(seriesData, () => true);
    }

    const tailRightBound = shouldUseStrictNumericEdgeAxis
        ? pinnedMaxX
        : Math.max(0, categoryCountForTail - 1);

    if (shouldUseStrictNumericEdgeAxis) {
        // In strict "days before departure" charts threshold guides must always span whole domain 0..maxX.
        alignForcedTailSeriesToStrictFullDomain({
            seriesList: seriesData,
            maxInclusiveX: pinnedMaxX,
            sortDir: plotXSortDir,
            dataLabelsEnabled: isDataLabelsEnabled,
        });
    } else if (enableFlightDaysLinePreset && categoryCountForTail > 0) {
        extendSelectedSeriesToLeftEdge(seriesData, isDataLabelsEnabled);
        // Горизонтали только до pinnedMaxX (контентные ряды), иначе ПКЗ/% раздувают domain до «хвоста» категорий.
        extendSelectedSeriesToRightEdge(seriesData, tailRightBound, isDataLabelsEnabled);
        sortForcedTailSeriesByX(seriesData, plotXSortDir);
    }

    // Для strict max оси X = по контентным рядам; иначе max по всем точкам после расширений.
    let actualMaxX = 0;
    if (shouldUseStrictNumericEdgeAxis) {
        actualMaxX = pinnedMaxX;
    } else {
        seriesData.forEach((s) => {
            s.data.forEach((p) => {
                if (typeof p.x === 'number' && p.x > actualMaxX) {
                    actualMaxX = p.x;
                }
            });
        });
    }

    const orderedSeriesData = [...seriesData].sort((a, b) => {
        const left = seriesOrderRank(String(a.name), compFlightOrderMap);
        const right = seriesOrderRank(String(b.name), compFlightOrderMap);
        if (left !== right) {
            return left - right;
        }
        return String(a.name).localeCompare(String(b.name), 'ru');
    });

    const isLegendGloballyEnabled = shared.extraSettings?.legendMode !== 'hide';
    const isLegendEnabled = isLegendGloballyEnabled && seriesData.length > 1;
    let legend: ChartData['legend'];
    if (!isLegendEnabled) {
        legend = {enabled: false};
    } else {
        legend = {
            enabled: true,
            position: 'right',
            width: 170,
            margin: 8,
            itemStyle: {fontSize: '12px', fontColor: '#000000'},
        } as ChartData['legend'];
    }

    let xAxisTitleText: string | undefined;
    if (xPlaceholder?.settings) {
        const xTitleFromSettings = getAxisTitle(xPlaceholder.settings, xField);
        if (xTitleFromSettings === null) {
            xAxisTitleText = undefined;
        } else if (typeof xTitleFromSettings === 'string' && xTitleFromSettings.trim()) {
            xAxisTitleText = xTitleFromSettings.trim();
        } else if (xField) {
            xAxisTitleText = getOriginalTitleOrTitle(xField);
        }
    } else if (xField) {
        xAxisTitleText = getOriginalTitleOrTitle(xField);
    }

    let xAxis: ChartData['xAxis'] = {};
    const hasPositiveNumericX = seriesData.some((series) =>
        series.data.some((point) => typeof point.x === 'number' && Number(point.x) > 0),
    );
    if (isCategoriesXAxis && !shouldUseStrictNumericEdgeAxis) {
        const rawCategories = xCategories?.map(String) ?? [];
        const sortedCategories = numericCategoryOrder
            ? numericCategoryOrder.map(String)
            : rawCategories;
        const maxCategoryIndex = Math.max(sortedCategories.length - 1, 0);
        xAxis = {
            type: 'category',
            categories: sortedCategories,
            order: numericCategoryOrder ? undefined : isXReversed ? 'sortDesc' : undefined,
            labels: ({
                rotation: 0,
                margin: 6,
                align: 'right',
                x: 0,
                useHTML: true,
                format: '<span style="position:relative;left:-3px;">{value}</span>',
            } as any),
            min: 0,
            max: maxCategoryIndex,
            maxPadding: 0,
        };
        (xAxis as any).minPadding = 0;
        (xAxis as any).tickmarkPlacement = 'on';
        (xAxis as any).startOnTick = false;
        (xAxis as any).endOnTick = false;
    } else {
        if (isDateField(xField)) {
            xAxis.type = 'datetime';
        }

        if (isNumberField(xField)) {
            xAxis.type = xPlaceholder?.settings?.type === 'logarithmic' ? 'logarithmic' : 'linear';
            if (shouldUseStrictNumericEdgeAxis) {
                // For "days before departure" chart keep strict edge alignment:
                // right edge = 0, left edge = max day.
                xAxis.min = 0;
                xAxis.max = actualMaxX > 0 ? actualMaxX : 0;
                xAxis.order = 'reverse';
                // ChartKit: labels.html / useHTML на linear X запрещены — только SVG-подписи; сдвиг «0» — dy в патче @gravity-ui/charts.
                (xAxis as any).labels = {
                    ...(xAxis as any).labels,
                    align: 'right',
                    margin: 5,
                    x: 0,
                    y: 0,
                    style: {
                        ...STRICT_FLIGHT_AXIS_TICK_LABEL_STYLE,
                        lineHeight: '1',
                    },
                };
                (xAxis as any).tickLength = STRICT_FLIGHT_AXIS_X_TICK_LENGTH;
                (xAxis as any).tickPosition = 'inside';
                // Keep the edge tick exactly at max/min without "nice" extension.
                (xAxis as any).startOnTick = false;
                (xAxis as any).endOnTick = false;
                // In strict mode keep only ticks (no axis continuation line).
                (xAxis as any).lineColor = 'transparent';
                (xAxis as any).lineWidth = 0;
                (xAxis as any).omitCornerVerticalTick = true;
                (xAxis as any).zeroLabelHNudgePx = STRICT_FLIGHT_AXIS_ZERO_LABEL_HORIZONTAL_NUDGE_PX;
                (xAxis as any).zeroLabelVerticalNudgePx = STRICT_FLIGHT_AXIS_ZERO_LABEL_VERTICAL_NUDGE_PX;
                (xAxis as any).xTickLengthAtRightPx = STRICT_FLIGHT_AXIS_X_ZERO_TICK_LENGTH_PX;
                (xAxis as any).xDomainExtendRightPx = STRICT_FLIGHT_AXIS_Y_ZERO_HORIZONTAL_LENGTH_PX;
            } else {
                if (hasPositiveNumericX) {
                    xAxis.min = 0;
                }
                if (actualMaxX > 0) {
                    xAxis.max = actualMaxX;
                }
            }
            xAxis.maxPadding = 0;
            (xAxis as any).minPadding = 0;
            if (!shouldUseStrictNumericEdgeAxis) {
                (xAxis as any).startOnTick = false;
                (xAxis as any).endOnTick = false;
            }
        }

        if (isXReversed && !shouldUseStrictNumericEdgeAxis) {
            xAxis.order = 'reverse';
        }
    }

    if (xAxisTitleText) {
        xAxis = {
            ...xAxis,
            title: {
                text: xAxisTitleText,
                margin: 18,
                align: 'center',
                style: {...LINE_CHART_AXIS_TITLE_STYLE},
            },
        };
    }

    const segmentsMap = getSegmentMap(args);
    const segments = sortBy(Object.values(segmentsMap), (s) => s.index);
    const isSplitEnabled = false;
    const primarySegment = segments[0];

    let actualMaxY = 0;
    seriesData.forEach((s) => {
        const seriesName = String(s.name ?? '').trim();
        // Auto-extend Y scale only by factual series values,
        // not by service threshold lines (60/80/100, ПКЗ).
        if (enableFlightDaysLinePreset && isForcedTailSeriesName(seriesName)) {
            return;
        }
        s.data.forEach((p) => {
            const py = p.y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                actualMaxY = Math.max(actualMaxY, py);
            }
        });
    });
    let yAxisTitleText: string | undefined;
    if (isSplitEnabled) {
        yAxisTitleText = primarySegment?.title;
    } else if (yPlaceholder?.settings) {
        const fromSettings = getAxisTitle(yPlaceholder.settings, yFields[0]);
        if (fromSettings === null) {
            yAxisTitleText = undefined;
        } else if (typeof fromSettings === 'string' && fromSettings.trim()) {
            yAxisTitleText = fromSettings.trim();
        } else if (yFields[0]) {
            yAxisTitleText = getOriginalTitleOrTitle(yFields[0]);
        }
    } else if (yFields[0]) {
        yAxisTitleText = getOriginalTitleOrTitle(yFields[0]);
    }
    
    // В strict-режиме «дней до вылета» размер делений Y = X (12px), чтобы оси читались одинаково.
    const yAxisPrimary = {
        title: yAxisTitleText
            ? {
                  text: yAxisTitleText,
                  margin: 24,
                  style: {
                      ...LINE_CHART_AXIS_TITLE_STYLE,
                  },
              }
            : undefined,
        plotIndex: primarySegment?.index ?? 0,
        position: 'right' as const,
        min: 0,
        maxPadding: 0,
        labels: {
            align: 'left',
            margin: 10,
            // Лейблы Y чуть ниже, чтобы визуально совпадали по центру со своими штрихами.
            y: 1,
            style: shouldUseStrictNumericEdgeAxis
                ? ({...STRICT_FLIGHT_AXIS_TICK_LABEL_STYLE} as any)
                : {
                      fontSize: '11px',
                      fontWeight: '400',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: 1.2,
                  },
        },
    } as ChartYAxis;
    const hasThresholdGuides = seriesData.some((series) =>
        enableFlightDaysLinePreset && isForcedTailSeriesName(String(series.name ?? '').trim()),
    );
    const ySettings = yPlaceholder?.settings as import('./axis-nice-step').AxisGridStepSource;
    const guideCeilingY = enableFlightDaysLinePreset
        ? maxForcedThresholdYFromSeries(seriesData)
        : 0;
    let factualYTop = Math.max(actualMaxY, guideCeilingY);
    if (hasThresholdGuides && factualYTop === 0) {
        factualYTop = 100;
    }
    if (factualYTop > 0 || hasThresholdGuides) {
        if (shouldUseStrictNumericEdgeAxis || hasThresholdGuides) {
            // Верх = nice-шаг по данным/настройкам оси + ровно один такой же шаг (не фиксированные 10).
            const {axisMax, step: yTickStep, tickPositions} = computeYAxisMaxWithOneNiceHeadroomStep({
                factualTop: factualYTop,
                settings: ySettings,
            });
            yAxisPrimary.max = axisMax;
            (yAxisPrimary as any).tickInterval = yTickStep;
            (yAxisPrimary as any).tickAmount = tickPositions.length;
            (yAxisPrimary as any).ceiling = yAxisPrimary.max;
            (yAxisPrimary as any).softMax = yAxisPrimary.max;
            (yAxisPrimary as any).tickPositions = tickPositions;
            // @gravity-ui/charts иначе вызывает scale.nice() и раздувает max (110 → 120); см. createYScale.
            (yAxisPrimary as any).fixedNumericDomain = true;
        } else {
            const step = resolveLinearAxisTickStep({
                spanTop: actualMaxY,
                min: 0,
                settings: ySettings,
            });
            // Always keep axis max above factual data so lines never "overflow" top border.
            yAxisPrimary.max = withTopHeadroomIfEdgeHit({
                actualMax: actualMaxY,
                roundedMax: ceilToTickStep(actualMaxY, step),
            });
        }
    }
    if (shouldUseStrictNumericEdgeAxis) {
        (yAxisPrimary as any).tickLength = STRICT_FLIGHT_AXIS_Y_TICK_LENGTH;
        (yAxisPrimary as any).yTickLengthAtBottomPx = STRICT_FLIGHT_AXIS_Y_ZERO_TICK_LENGTH_PX;
        (yAxisPrimary as any).tickPosition = 'inside';
        (yAxisPrimary as any).startOnTick = false;
        (yAxisPrimary as any).endOnTick = false;
        (yAxisPrimary as any).labels.verticalAlign = 'middle';
        // In strict mode keep only ticks (no axis continuation line).
        (yAxisPrimary as any).lineColor = 'transparent';
        (yAxisPrimary as any).lineWidth = 0;
        // Keep grid below threshold/flight lines so 100% green line is visible.
        (yAxisPrimary as any).gridZIndex = 0;
    }

    // Title: substitute flight from selector only when the title contains № (nothing else triggers it).
    const nrsParam = String((ChartEditor as any)?.getParam?.('nrs') ?? '').trim();
    let t = String(shared.extraSettings?.title ?? '').trim();
    if (nrsParam && t.includes('№')) {
        t = t.replace(/№\s*(?:\{\{nrs\}\}|\S*)/, `№ ${nrsParam}`);
    }
    const resolvedTitle = t || undefined;

    const config: ChartData = {
        title: resolvedTitle ? {text: resolvedTitle} : undefined,
        series: {
            data: orderedSeriesData as ChartSeries[],
            options: {
                line: {
                    lineWidth: shouldUseStrictNumericEdgeAxis ? STRICT_FLIGHT_SERIES_LINE_WIDTH : 1,
                    linecap: 'butt',
                },
            },
        },
        xAxis,
        yAxis: [yAxisPrimary],
        split: {
            enable: isSplitEnabled,
            gap: '40px',
            plots: [0].map(() => {
                return {};
            }),
        },
        legend,
    };

    if (yFields[0]) {
        config.tooltip = {
            valueFormat: getFieldFormatOptions({field: yFields[0]}),
        };
    }
    const merged = merge(
        getBaseChartConfig({
            extraSettings: shared.extraSettings,
            visualization: {placeholders, id: visualizationId},
        }),
        config,
    );

    return merged;
}
