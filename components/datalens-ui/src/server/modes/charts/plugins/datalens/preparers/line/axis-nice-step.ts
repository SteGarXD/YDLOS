/**
 * Единая логика шага делений линейной оси Y для line preparers (Highcharts + Gravity):
 * — ручной шаг из Wizard (`gridStep` + `gridStepValue`);
 * — иначе «nice» шаг по диапазону [0 .. factualTop], как типичные авто-сетки (1/2/5 × 10ⁿ).
 */

export type AxisGridStepSource = {
    gridStep?: string;
    gridStepValue?: number;
} | null;

const DEFAULT_TARGET_TICKS = 8;

/** Как `niceStepInt` в @gravity-ui/charts (axis.js): шаг по грубой оценке span/targetTicks. */
export function niceStepFromRoughSpan(rough: number): number {
    if (!Number.isFinite(rough) || rough <= 0) {
        return 1;
    }
    const exp = Math.floor(Math.log10(rough));
    const pow = 10 ** exp;
    const frac = rough / pow;
    let nf = 1;
    if (frac <= 1) {
        nf = 1;
    } else if (frac <= 2) {
        nf = 2;
    } else if (frac <= 5) {
        nf = 5;
    } else {
        nf = 10;
    }
    const step = nf * pow;
    return Math.max(step, Number.EPSILON * 1e10);
}

export function resolveLinearAxisTickStep(args: {
    spanTop: number;
    min?: number;
    settings?: AxisGridStepSource;
    targetTickCount?: number;
}): number {
    const s = args.settings;
    if (
        s &&
        s.gridStep === 'manual' &&
        typeof s.gridStepValue === 'number' &&
        Number.isFinite(s.gridStepValue) &&
        s.gridStepValue > 0
    ) {
        return s.gridStepValue;
    }
    const min = args.min ?? 0;
    const span = Math.max(args.spanTop - min, 0) || Math.max(args.spanTop, 0);
    const target = args.targetTickCount ?? DEFAULT_TARGET_TICKS;
    const rough = Math.max(span / Math.max(target, 2), Number.EPSILON);
    return niceStepFromRoughSpan(rough);
}

export function ceilToTickStep(value: number, step: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
        return 0;
    }
    return Math.ceil(value / step) * step;
}

export function buildLinearTickPositionsFromZero(axisMax: number, step: number): number[] {
    if (!Number.isFinite(axisMax) || axisMax < 0 || !Number.isFinite(step) || step <= 0) {
        return [0];
    }
    const out: number[] = [];
    for (let i = 0; ; i++) {
        const v = i * step;
        if (v > axisMax + step * 1e-9) {
            break;
        }
        out.push(v);
    }
    return out;
}

/**
 * Верх оси:
 * - если factualTop попал ровно в штрих (roundedTop === factualTop), добавляем +1 шаг;
 * - если до верхнего штриха уже есть запас (roundedTop > factualTop), дополнительный шаг не добавляем.
 * Деления: 0, step, 2*step, … до axisMax включительно.
 */
export function computeYAxisMaxWithOneNiceHeadroomStep(args: {
    factualTop: number;
    settings?: AxisGridStepSource;
    targetTickCount?: number;
}): {axisMax: number; step: number; tickPositions: number[]} {
    let top = args.factualTop;
    if (!Number.isFinite(top) || top <= 0) {
        top = 1;
    }
    const step = resolveLinearAxisTickStep({
        spanTop: top,
        min: 0,
        settings: args.settings,
        targetTickCount: args.targetTickCount,
    });
    const roundedTop = ceilToTickStep(top, step);
    const isTopOnTick = Math.abs(roundedTop - top) <= Math.max(1e-9, step * 1e-9);
    const axisMax = isTopOnTick ? roundedTop + step : roundedTop;
    return {
        axisMax,
        step,
        tickPositions: buildLinearTickPositionsFromZero(axisMax, step),
    };
}
