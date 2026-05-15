import get from 'lodash/get';
import { getDomainDataYBySeries, getMinSpaceBetween, getTicksCount, isBandScale } from '../../utils';
function thinOut(items, delta) {
    const arr = [];
    for (let i = 0; i < items.length; i = i + delta) {
        arr.push(items[i]);
    }
    return arr;
}
export function getTickValues({ scale, axis, labelLineHeight, series, }) {
    const ensureZeroTick = (items) => {
        if (!items.length || axis.min !== 0) {
            return items;
        }
        const hasZero = items.some((i) => Number(i.value) === 0);
        if (hasZero) {
            return items;
        }
        const zeroY = scale(0);
        if (!Number.isFinite(zeroY)) {
            return items;
        }
        const next = [...items, { y: zeroY, value: 0 }];
        next.sort((a, b) => Number(a.value) - Number(b.value));
        return next;
    };
    const fixedTicks = get(axis, 'tickPositions');
    if (Array.isArray(fixedTicks) && fixedTicks.length && scale && typeof scale === 'function') {
        const items = fixedTicks.map((t) => ({
            y: scale(Number(t)),
            value: Number(t),
        }));
        return ensureZeroTick(items);
    }
    if ('ticks' in scale && typeof scale.ticks === 'function') {
        const range = scale.range();
        const height = Math.abs(range[0] - range[1]);
        if (!height) {
            return [];
        }
        const getScaleTicks = () => {
            var _a;
            const domainData = getDomainDataYBySeries(series);
            if (series.some((s) => s.type === 'bar-y')) {
                if (domainData.length < 3) {
                    return domainData;
                }
                const ticksCount = (_a = getTicksCount({ axis, range: height })) !== null && _a !== void 0 ? _a : domainData.length;
                return scale.ticks(Math.min(ticksCount, domainData.length));
            }
            const ticksCount = getTicksCount({ axis, range: height });
            return scale.ticks(ticksCount);
        };
        const scaleTicks = getScaleTicks();
        const originalTickValues = scaleTicks.map((t) => ({
            y: scale(t),
            value: t,
        }));
        if (originalTickValues.length <= 1) {
            return originalTickValues;
        }
        // first, we try to draw "beautiful" tick values
        let result = originalTickValues;
        let availableSpaceForLabel = getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
        let ticksCount = result.length - 1;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            ticksCount = ticksCount ? ticksCount - 1 : result.length - 1;
            const newScaleTicks = scale.ticks(ticksCount);
            result = newScaleTicks.map((t) => ({
                y: scale(t),
                value: t,
            }));
            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
        }
        // when this is not possible (for example, such values cannot be selected for the logarithmic axis with a small range)
        // just thin out the originally proposed result
        if (!result.length) {
            result = originalTickValues;
            availableSpaceForLabel =
                getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
            let delta = 2;
            while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
                result = thinOut(result, delta);
                if (result.length > 1) {
                    delta += 1;
                    availableSpaceForLabel =
                        getMinSpaceBetween(result, (d) => d.y) - axis.labels.padding * 2;
                }
            }
        }
        return ensureZeroTick(result);
    }
    if (isBandScale(scale)) {
        const domain = scale.domain();
        const bandWidth = scale.bandwidth();
        const items = domain.map((d) => {
            var _a;
            return ({
                y: ((_a = scale(d)) !== null && _a !== void 0 ? _a : 0) + bandWidth / 2,
                value: d,
            });
        });
        if (items.length <= 1) {
            return items;
        }
        let result = [...items];
        let availableSpaceForLabel = Math.abs(result[0].y - result[1].y) - axis.labels.padding * 2;
        let delta = 2;
        while (availableSpaceForLabel < labelLineHeight && result.length > 1) {
            result = thinOut(items, delta);
            if (result.length > 1) {
                delta += 1;
                availableSpaceForLabel = result[0].y - result[1].y - axis.labels.padding * 2;
            }
        }
        return ensureZeroTick(result);
    }
    return [];
}
