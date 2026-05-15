export type ColWidthInput = {
    min: number;
    /** Заданная ширина — колонка не участвует в распределении k */
    fixed?: number;
    /** Верхняя граница для гибкой колонки (напр. Measure names) */
    max?: number;
};

export type GetCellsWidthOptions = {
    cols: ColWidthInput[];
    tableMinWidth: number;
    /**
     * Индексы колонок (напр. дни 1–31), между которыми делить остаток ширины после k и max.
     * Если не задано — по-прежнему на последнюю гибкую без max (часто ИТОГО).
     */
    remainderSplitIndices?: number[];
};

/**
 * Распределяет ширину таблицы по колонкам: fixed остаются как есть, гибкие масштабируются с k,
 * с учётом max. Остаток после clamp по max — на последнюю гибкую без max или поровну на remainderSplitIndices.
 */
export function getCellsWidth(args: GetCellsWidthOptions): number[] {
    const {tableMinWidth, cols, remainderSplitIndices} = args;

    const isFixed = (col: ColWidthInput) => col.fixed !== undefined && col.fixed !== null;

    const fixedColsWidth = cols.reduce((sum, col) => {
        if (isFixed(col)) {
            return sum + Math.max(col.min, col.fixed ?? 0);
        }
        return sum;
    }, 0);

    const flexIndices = cols
        .map((c, i) => (!isFixed(c) ? i : -1))
        .filter((i): i is number => i >= 0);

    if (flexIndices.length === 0) {
        return cols.map((col) => (isFixed(col) ? Math.max(col.min, col.fixed ?? 0) : col.min));
    }

    const targetInner = Math.max(0, tableMinWidth - 2);
    const remaining = Math.max(0, targetInner - fixedColsWidth);

    const flexMinSum = flexIndices.reduce((s, i) => s + cols[i].min, 0);
    if (flexMinSum <= 0) {
        return cols.map((col) => (isFixed(col) ? Math.max(col.min, col.fixed ?? 0) : col.min));
    }

    const k = Math.max(1, remaining / flexMinSum);

    const widths = cols.map((col) => {
        if (isFixed(col)) {
            return Math.max(col.min, col.fixed ?? 0);
        }
        const raw = col.min * k;
        const cap = col.max ?? Number.POSITIVE_INFINITY;
        return Math.min(raw, cap);
    });

    const flexTotal = flexIndices.reduce((s, i) => s + widths[i], 0);
    const extra = remaining - flexTotal;

    if (extra > 0.5) {
        const splitIdx = remainderSplitIndices?.filter((i) => flexIndices.includes(i)) ?? [];
        if (splitIdx.length > 0) {
            const rest = Math.floor(extra);
            const base = Math.floor(rest / splitIdx.length);
            let r = rest - base * splitIdx.length;
            for (const i of splitIdx) {
                widths[i] += base + (r > 0 ? 1 : 0);
                if (r > 0) {
                    r -= 1;
                }
            }
        } else {
            const lastFlexWithoutHardMax = [...flexIndices]
                .reverse()
                .find((i) => cols[i].max === null || cols[i].max === undefined);
            if (lastFlexWithoutHardMax !== undefined) {
                widths[lastFlexWithoutHardMax] += extra;
            } else {
                const lastFlex = flexIndices[flexIndices.length - 1];
                widths[lastFlex] += extra;
            }
        }
    }

    return widths;
}

/**
 * Подгоняет сумму ширин колонок под доступный budget (px), чтобы таблица не шире контейнера
 * и не появлялся горизонтальный скролл при большом числе колонок (сводная по дням).
 */
export function fitColumnWidthsToBudget(
    widths: number[],
    budget: number,
    remainderSplitIndices?: number[],
): number[] {
    if (!widths.length || budget <= 0) {
        return widths;
    }
    const sum = widths.reduce((a, b) => a + b, 0);
    if (sum === 0) {
        return widths;
    }
    if (sum <= budget) {
        const remainder = budget - sum;
        if (remainder > 0.5) {
            const out = [...widths];
            const splitIdx = remainderSplitIndices?.filter((i) => i >= 0 && i < out.length) ?? [];
            if (splitIdx.length > 0) {
                const rest = Math.floor(remainder);
                const base = Math.floor(rest / splitIdx.length);
                let r = rest - base * splitIdx.length;
                for (const i of splitIdx) {
                    out[i] = (out[i] ?? 0) + base + (r > 0 ? 1 : 0);
                    if (r > 0) {
                        r -= 1;
                    }
                }
                return out;
            }
            const last = out.length - 1;
            out[last] = (out[last] ?? 0) + remainder;
            return out;
        }
        return widths;
    }
    const factor = budget / sum;
    const scaled = widths.map((w) => Math.max(1, Math.floor(w * factor)));
    const newSum = scaled.reduce((a, b) => a + b, 0);
    if (newSum < budget) {
        scaled[scaled.length - 1] += budget - newSum;
    } else if (newSum > budget) {
        scaled[scaled.length - 1] = Math.max(1, scaled[scaled.length - 1] - (newSum - budget));
    }
    return scaled;
}

/**
 * После fitColumnWidthsToBudget поднимаем ширины до измеренных min (контент).
 * Если сумма > budget — снимаем переполнение слева направо по колонкам дней (2 … last-1),
 * чтобы крайние дни (30, 31) и ИТОГО не «съедались» первыми (раньше цикл шёл справа налево).
 */
export function enforceMinsWithinBudget(
    widths: number[],
    budget: number,
    mins: number[],
    remainderSplitIndices?: number[],
): number[] {
    if (!widths.length || budget <= 0 || widths.length !== mins.length) {
        return widths;
    }
    const n = widths.length;
    const out = widths.map((w, i) => Math.max(w ?? 0, Math.max(1, Math.floor(mins[i] ?? 1))));
    const sum = out.reduce((a, b) => a + b, 0);
    let over = sum - budget;
    if (over <= 0) {
        const remainder = budget - sum;
        if (remainder > 0.5) {
            const splitIdx = remainderSplitIndices?.filter((i) => i >= 0 && i < n) ?? [];
            if (splitIdx.length > 0) {
                const rest = Math.floor(remainder);
                const base = Math.floor(rest / splitIdx.length);
                let r = rest - base * splitIdx.length;
                for (const i of splitIdx) {
                    out[i] = (out[i] ?? 0) + base + (r > 0 ? 1 : 0);
                    if (r > 0) {
                        r -= 1;
                    }
                }
            } else {
                out[n - 1] = (out[n - 1] ?? 0) + remainder;
            }
        }
        return out;
    }
    const last = n - 1;
    const floorAt = (i: number) => Math.max(1, Math.floor(mins[i] ?? 1));

    /* 1) Дни и прочие между Напр-е и ИТОГО: слева направо — 30/31 сжимаются последними */
    for (let i = 2; i <= last - 1 && over > 0; i++) {
        const floor = floorAt(i);
        const can = Math.max(0, (out[i] ?? 0) - floor);
        const take = Math.min(over, can);
        out[i] = (out[i] ?? 0) - take;
        over -= take;
    }
    /* 2) ИТОГО */
    if (over > 0 && last >= 2) {
        const floor = floorAt(last);
        const can = Math.max(0, (out[last] ?? 0) - floor);
        const take = Math.min(over, can);
        out[last] = (out[last] ?? 0) - take;
        over -= take;
    }
    /* 3) Напр-е, Рейс */
    for (let i = 1; i >= 0 && over > 0; i--) {
        const floor = floorAt(i);
        const can = Math.max(0, (out[i] ?? 0) - floor);
        const take = Math.min(over, can);
        out[i] = (out[i] ?? 0) - take;
        over -= take;
    }
    return out;
}
