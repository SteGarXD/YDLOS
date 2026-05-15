import {
    normalizeFlatTableTreeStateList,
    resolveIntervalDate,
    type StringParams,
    type TableCommonCell,
    type TableHead,
    type TableRow,
} from 'shared';

function compareFlightTreeKeys(a: string, b: string): number {
    try {
        const pa = JSON.parse(a) as unknown;
        const pb = JSON.parse(b) as unknown;
        const sa = Array.isArray(pa) && pa.length ? String(pa[0]) : a;
        const sb = Array.isArray(pb) && pb.length ? String(pb[0]) : b;
        return sa.localeCompare(sb, undefined, {numeric: true});
    } catch {
        return a.localeCompare(b);
    }
}

export function sortFlightTreeKeys(keys: string[]): string[] {
    return [...keys].sort(compareFlightTreeKeys);
}

function treeStateToList(v: StringParams['treeState'] | undefined): string[] {
    const raw = ([] as string[]).concat(v ?? []).filter(Boolean) as string[];
    return normalizeFlatTableTreeStateList(raw);
}

function pickScalarParam(v: unknown): string {
    if (Array.isArray(v)) {
        return String(v[0] ?? '');
    }
    return String(v ?? '');
}

/** Интервал фильтра дашборда (ds или dta1/dta2) — чтобы отбросить treeState с датами вне периода после смены фильтра. */
function getDashIntervalMsRange(params: StringParams): {from: number; to: number} | null {
    const dsStr = pickScalarParam(params.ds);
    if (dsStr.startsWith('__interval_')) {
        const r = resolveIntervalDate(dsStr);
        if (r?.from && r?.to) {
            const from = Date.parse(r.from);
            const to = Date.parse(r.to);
            if (!Number.isNaN(from) && !Number.isNaN(to)) {
                return {from, to};
            }
        }
    }
    const d1 = pickScalarParam(params.dta1 ?? params.dt1);
    const d2 = pickScalarParam(params.dta2 ?? params.dt2);
    if (d1 && d2) {
        const from = Date.parse(d1);
        const to = Date.parse(d2);
        if (!Number.isNaN(from) && !Number.isNaN(to)) {
            return {from, to};
        }
    }
    /* Селектор даты «один день»: ds = 2024-03-15 без __interval_ и без dta в этом же объекте */
    if (dsStr && /^\d{4}-\d{2}-\d{2}$/.test(dsStr.trim())) {
        const d = dsStr.trim();
        const from = Date.parse(`${d}T00:00:00.000Z`);
        const to = Date.parse(`${d}T23:59:59.999Z`);
        if (!Number.isNaN(from) && !Number.isNaN(to)) {
            return {from, to};
        }
    }
    return null;
}

/** Эффективные параметры для интервала: runtime и props часто дополняют друг друга (ds только снаружи, dta только в рантайме). */
function mergeParamsForDashInterval(
    propsParams: StringParams,
    runtimeParams: StringParams,
): StringParams {
    return {...runtimeParams, ...propsParams};
}

/** Ключ дерева вида JSON.stringify(['2024-09-01']) — дата вне интервала ds/dta1–dta2 (старый hash после смены фильтра). */
function treeStateHasStaleDateKeysForDashInterval(
    p: string[],
    propsParams: StringParams,
    runtimeParams: StringParams,
): boolean {
    const range = getDashIntervalMsRange(mergeParamsForDashInterval(propsParams, runtimeParams));
    if (!range) {
        return false;
    }
    for (const k of p) {
        try {
            const parsed = JSON.parse(k) as unknown;
            if (!Array.isArray(parsed) || parsed.length < 1) {
                continue;
            }
            const t = Date.parse(String(parsed[0]));
            if (Number.isNaN(t)) {
                continue;
            }
            if (t < range.from || t > range.to) {
                return true;
            }
        } catch {
            continue;
        }
    }
    return false;
}

/**
 * ChartKitBase: при isDataProviderPropsNotChanged=false merge идёт как deepAssign(runtime, props),
 * и устаревший treeState из пропсов дашборда затирает только что обновлённый runtimeParams после второго «+».
 */
export function mergeTableTreeStateForDataProvider(
    propsParams: StringParams,
    runtimeParams: StringParams,
): StringParams['treeState'] | undefined {
    const hasP = Object.prototype.hasOwnProperty.call(propsParams, 'treeState');
    const hasR = Object.prototype.hasOwnProperty.call(runtimeParams, 'treeState');

    if (!hasR) {
        return hasP ? propsParams.treeState : undefined;
    }

    const r = treeStateToList(runtimeParams.treeState);
    if (!hasP) {
        return sortFlightTreeKeys(r);
    }

    const p = treeStateToList(propsParams.treeState);
    const pSet = new Set(p);
    const rSet = new Set(r);

    const rCoversP = p.every((k) => rSet.has(k));
    const pCoversR = r.every((k) => pSet.has(k));

    if (rCoversP && r.length >= p.length) {
        return sortFlightTreeKeys(r);
    }
    if (pCoversR && r.length <= p.length) {
        /*
         * defaults/hash: treeState: [] в runtime, в props уже [k1] — старая ветка возвращала [] и
         * сбрасывала раскрытия при merge в ChartKitBase / дашборде.
         * Схлопывание (r=[k2], p=[k1,k2]) — r непустой, оставляем runtime.
         */
        if (r.length === 0 && p.length > 0) {
            /*
             * Пустой runtime + непустой hash: обычно лаг дашборда при «+» (тест ниже).
             * Если в hash остались ключи дат, которые не попадают в текущий ds/dta1–dta2 — после смены
             * фильтра обязаны сбросить treeState, иначе /api/run уезжает с сентябрьским treeState при августе.
             */
            if (treeStateHasStaleDateKeysForDashInterval(p, propsParams, runtimeParams)) {
                return [];
            }
            return sortFlightTreeKeys(p);
        }
        return sortFlightTreeKeys(r);
    }

    /*
     * Дашборд: props (p) отстаёт на кадр от второго «+», а runtime (r) приходит только с новым ключом
     * (toggle считал baseline без первого раскрытия). Старое «return p» отбрасывало второй рейс.
     * Объединяем множества; схлопывание по-прежнему уходит во ветки выше (pCoversR / rCoversP).
     */
    return sortFlightTreeKeys([...new Set([...p, ...r])]);
}

/**
 * Baseline для клика по +/-: объединяем ref (последний клик) и params.treeState (проп),
 * чтобы ни один источник не «съедал» ключи при рассинхроне рендера/ответа.
 */
export function flatTableRowTreeClickBaseline(refKeys: string[], fromParams: string[]): string[] {
    return sortFlightTreeKeys([...new Set([...refKeys, ...fromParams])]);
}

/**
 * При смене сигнатуры тела таблицы: не затирать baseline урезанным serverTree — мержим с предыдущим ref
 * и отбрасываем ключи, которых нет в текущих строках.
 */
export function mergeFlatTableRowTreeBaselineOnSigChange(
    prevRef: string[],
    serverTree: string[],
    rows: TableRow[] | undefined,
): string[] {
    const merged = sortFlightTreeKeys([...new Set([...prevRef, ...serverTree])]);
    const validKeys = new Set(collectFlatTableRowTreeFlightKeys(rows));
    if (validKeys.size === 0) {
        return merged;
    }
    return merged.filter((k) => validKeys.has(k));
}

/** Parent row keys for flat row tree (JSON.stringify([flightKey]), see flat-table-row-tree). */
export function collectFlatTableRowTreeFlightKeys(rows: TableRow[] | undefined): string[] {
    if (!rows?.length) {
        return [];
    }
    const keys = new Set<string>();
    for (const row of rows) {
        if (!('cells' in row) || !row.cells) {
            continue;
        }
        for (const cell of row.cells) {
            if (typeof cell !== 'object' || cell === null || !('treeNode' in cell)) {
                continue;
            }
            const c = cell as TableCommonCell;
            /* Signature: treeNodeState not required; avoid dropping keys if state is missing. */
            if (c.treeOffset !== 1 || !c.treeNode) {
                continue;
            }
            try {
                const parsed = JSON.parse(c.treeNode) as unknown;
                if (Array.isArray(parsed) && parsed.length === 1) {
                    keys.add(c.treeNode);
                }
            } catch {
                continue;
            }
        }
    }
    return sortFlightTreeKeys([...keys]);
}

/**
 * Stable signature of flight set: unchanged on expand/collapse (unlike row count).
 */
export function getFlatTableRowTreeStableBodySignature(rows: TableRow[] | undefined): string | null {
    const keys = collectFlatTableRowTreeFlightKeys(rows);
    if (keys.length === 0) {
        return null;
    }
    return keys.join('\u0001');
}

export type FlatTableRowTreeTableDataFlags = {
    flatTableRowTreeHasNestedSegments?: boolean;
};

/** True only for flat-table-row-tree API response (has server marker). */
export function tableDataIsFlatTableRowTreeResponse(
    data: FlatTableRowTreeTableDataFlags | undefined,
): boolean {
    return data?.flatTableRowTreeHasNestedSegments !== undefined;
}

function rowsHaveVisibleSegmentDepth(rows: TableRow[] | undefined): boolean {
    for (const row of rows || []) {
        if (!('cells' in row)) {
            continue;
        }
        for (const cell of row.cells || []) {
            if (typeof cell !== 'object' || !cell) {
                continue;
            }
            const c = cell as TableCommonCell;
            if (c.treeOffset === 2 && c.treeNode) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Whether expand/collapse-all menu applies: server flag or legacy heuristics.
 */
export function flatTableRowTreeHasExpandableNesting(
    data: FlatTableRowTreeTableDataFlags | undefined,
    rows: TableRow[] | undefined,
): boolean {
    const keys = collectFlatTableRowTreeFlightKeys(rows);
    if (keys.length === 0) {
        return false;
    }
    if (data?.flatTableRowTreeHasNestedSegments === true) {
        return true;
    }
    /*
     * Server may set false when each flight group has one raw segment row, but UI still shows +/-.
     */
    if (data?.flatTableRowTreeHasNestedSegments === false) {
        return true;
    }
    if (keys.length > 1) {
        return true;
    }
    return rowsHaveVisibleSegmentDepth(rows);
}

/** Top-level head row: `TableHead` is TableColumn | TableSubColumn — fields differ; this is layout-only. */
type TableHeadTopLevelCue = {pinned?: boolean; sub?: readonly unknown[]};

/**
 * Backend pivot: several pinned row dimensions + nested column headers (e.g. calendar).
 * Each chart is its own widget: flat-table row-tree `treeState` must never drive pivot (or vice versa).
 */
export function tableDataLooksLikeBackendPivot(args: {
    head?: TableHead[];
    flatTableRowTreeHasNestedSegments?: boolean;
}): boolean {
    if (typeof args.flatTableRowTreeHasNestedSegments !== 'undefined') {
        return false;
    }
    const head = (args.head ?? []) as TableHeadTopLevelCue[];
    const pinnedCount = head.filter((h) => Boolean(h.pinned)).length;
    const hasNested = head.some((h) => Array.isArray(h.sub) && h.sub.length > 0);
    return pinnedCount >= 2 && hasNested;
}
