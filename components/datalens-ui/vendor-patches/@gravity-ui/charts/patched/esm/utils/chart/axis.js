import clamp from 'lodash/clamp';
import { formatAxisTickLabel } from './format';
import { wrapText } from './text';
export function getTicksCount({ axis, range }) {
    let ticksCount;
    if (axis.ticks.pixelInterval) {
        ticksCount = Math.ceil(range / axis.ticks.pixelInterval);
    }
    return ticksCount;
}
export function isBandScale(scale) {
    return 'bandwidth' in scale && typeof scale.bandwidth === 'function';
}
/** D3 scalePoint (e.g. category X for line charts): uniform spacing, domain endpoints at range ends. */
export function isPointScale(scale) {
    return Boolean(scale && typeof scale.step === 'function' && !isBandScale(scale));
}
export function getScaleTicks(scale, ticksCount) {
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        return scale.ticks(ticksCount);
    }
    if (isBandScale(scale) || isPointScale(scale)) {
        return scale.domain();
    }
    return [];
}
export function getXAxisOffset() {
    // Fixed offset for consistent X geometry across monitor/laptop.
    return 0;
}
function number(scale) {
    return (d) => Number(scale(d));
}
function center(scale, offset) {
    offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
    if (scale.round()) {
        offset = Math.round(offset);
    }
    return (d) => Number(scale(String(d))) + offset;
}
export function getXTickPosition({ scale, offset }) {
    return isBandScale(scale) ? center(scale, offset) : number(scale);
}
function isDenseConsecutiveIntegerDomain(domain) {
    if (!domain || domain.length < 2) {
        return false;
    }
    const nums = domain.map((d) => Number(d));
    if (!nums.every((n) => Number.isFinite(n) && n === Math.trunc(n))) {
        return false;
    }
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (max - min + 1 !== nums.length) {
        return false;
    }
    return new Set(nums).size === nums.length;
}
function niceStepInt(rough) {
    if (!Number.isFinite(rough) || rough <= 0) {
        return 1;
    }
    const exp = Math.floor(Math.log10(rough));
    const pow = Math.pow(10, exp);
    const frac = rough / pow;
    let nf = 1;
    if (frac <= 1)
        nf = 1;
    else if (frac <= 2)
        nf = 2;
    else if (frac <= 5)
        nf = 5;
    else
        nf = 10;
    return Math.max(1, Math.round(nf * pow));
}
export function getAxisItems({ scale, count, maxCount, }) {
    let values = getScaleTicks(scale, count);
    if (isBandScale(scale) || isPointScale(scale)) {
        const range = scale.range();
        const span = Math.abs(Number(range[1]) - Number(range[0]));
        const domain = scale.domain();
        if (isDenseConsecutiveIntegerDomain(domain)) {
            const nums = domain.map(Number);
            const minV = Math.min(...nums);
            const maxV = Math.max(...nums);
            const spanV = maxV - minV;
            const minPxPerTick = 32;
            const maxLabelsByWidth = Math.max(4, Math.floor(span / minPxPerTick));
            const hardCap = 50;
            const bandLabelLimit = Math.min(maxLabelsByWidth, hardCap);
            const targetTicks = Math.max(2, Math.min(bandLabelLimit, domain.length));
            const rawStep = spanV / Math.max(1, targetTicks - 1);
            const stepV = niceStepInt(rawStep);
            const tickStrs = new Set();
            tickStrs.add(String(maxV));
            tickStrs.add(String(minV));
            const start = Math.ceil(minV / stepV) * stepV;
            for (let v = start; v <= maxV; v += stepV) {
                tickStrs.add(String(v));
            }
            const domainIndex = new Map(domain.map((d, i) => [String(d), i]));
            return Array.from(tickStrs)
                .filter((s) => domainIndex.has(s))
                .sort((a, b) => (domainIndex.get(a) ?? 0) - (domainIndex.get(b) ?? 0));
        }
        const minPxPerTick = 32;
        const maxLabelsByWidth = Math.max(4, Math.floor(span / minPxPerTick));
        const hardCap = 50;
        const bandLabelLimit = Math.min(maxLabelsByWidth, hardCap);
        if (values.length > bandLabelLimit) {
            const step = Math.ceil(values.length / bandLabelLimit);
            values = values.filter((_, i) => i % step === 0 || i === values.length - 1);
        }
        return values;
    }
    if (maxCount && values.length > maxCount) {
        const step = Math.ceil(values.length / maxCount);
        values = values.filter((_, i) => i % step === 0);
    }
    return values;
}
export function getMaxTickCount({ axis, width }) {
    const minTickWidth = parseInt(axis.labels.style.fontSize, 10) + axis.labels.padding;
    return Math.floor(width / minTickWidth);
}
export function getAxisHeight(args) {
    const { split, boundsHeight } = args;
    if (split.plots.length > 1) {
        return split.plots[0].height;
    }
    return boundsHeight;
}
export async function getAxisTitleRows(args) {
    const { axis, textMaxWidth } = args;
    if (axis.title.maxRowCount < 1) {
        return [];
    }
    const textRows = await wrapText({
        text: axis.title.text,
        style: axis.title.style,
        width: textMaxWidth,
    });
    return textRows.reduce((acc, row, index) => {
        if (index < axis.title.maxRowCount) {
            acc.push(row);
        }
        else {
            acc[axis.title.maxRowCount - 1].text += row.text;
        }
        return acc;
    }, []);
}
export const getAxisPlotsPosition = (axis, split, width = 0) => {
    var _a;
    const top = ((_a = split.plots[axis.plotIndex]) === null || _a === void 0 ? void 0 : _a.top) || 0;
    if (axis.position === 'left') {
        return [0, top];
    }
    return [width, top];
};
export function getBandsPosition(args) {
    var _a, _b, _c;
    const { band, axisScale } = args;
    const scalePosTo = axisScale(band.to);
    const scalePosFrom = axisScale(band.from);
    const isX = args.axis === 'x';
    if (scalePosTo !== undefined && scalePosFrom !== undefined) {
        return {
            from: Math.max(scalePosFrom, 0),
            to: Math.max(scalePosTo, 0),
        };
    }
    if (typeof band.from !== 'number' || typeof band.to !== 'number') {
        throw new Error('Filed to create plot band');
    }
    const category = axisScale.domain();
    const bandwidth = (_b = (_a = axisScale.bandwidth) === null || _a === void 0 ? void 0 : _a.call(axisScale)) !== null && _b !== void 0 ? _b : 1;
    const halfBandwidth = bandwidth / 2;
    const calcPosition = (value) => {
        var _a, _b;
        if (value >= category.length) {
            return ((_a = axisScale(category[category.length - 1])) !== null && _a !== void 0 ? _a : 0) + halfBandwidth * (isX ? 1 : -1);
        }
        return (((_b = axisScale(category[clamp(Math.floor(value), 0, category.length - 1)])) !== null && _b !== void 0 ? _b : 0) +
            bandwidth * (value - Math.floor(Math.abs(value))) * (isX ? 1 : -1));
    };
    const to = calcPosition(band.to);
    const from = calcPosition(band.from);
    const maxPos = ((_c = axisScale(category[isX ? category.length - 1 : 0])) !== null && _c !== void 0 ? _c : 0) + halfBandwidth;
    return {
        from: clamp(from, -halfBandwidth, maxPos),
        to: clamp(to, -halfBandwidth, maxPos),
    };
}
export function getClosestPointsRange(axis, points) {
    if (axis.type === 'category') {
        return undefined;
    }
    return Math.abs(points[1] - points[0]);
}
export function getLabelFormatter({ axis, scale }) {
    const ticks = getScaleTicks(scale);
    const tickStep = getClosestPointsRange(axis, ticks);
    return (value) => {
        if (!axis.labels.enabled) {
            return '';
        }
        return formatAxisTickLabel({
            axis,
            value,
            step: tickStep,
        });
    };
}

