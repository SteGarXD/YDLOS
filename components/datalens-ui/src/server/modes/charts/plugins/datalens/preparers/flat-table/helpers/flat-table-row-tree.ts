import type {TableCellsRow, TableCommonCell} from '../../../../../../../../shared';

export type FlatTableRowTreeSettings = {
    enabled: true;
    flightFieldGuid: string;
    segmentFieldGuid: string;
    totalLabel?: string;
    autoClassTotal?: {
        fieldFGuid: string;
        fieldCGuid: string;
        fieldYGuid: string;
        targetMeasureGuid: string;
    };
};

export type PreparedFlatColumn = {
    guid: string;
    indexInOrder: number;
    isNumericalDataType: boolean;
    isTreeDataType: boolean;
};

export type PreparedFlatColumnWithTitle = PreparedFlatColumn & {actualTitle: string};

type ColumnForFcyInfer = Pick<
    PreparedFlatColumnWithTitle,
    'guid' | 'indexInOrder' | 'isNumericalDataType' | 'actualTitle'
>;

export type FlatTableRowTreeRowMeta =
    | {
          kind: 'parent';
          flightTreeKey: string;
          flightDisplay: string;
      }
    | {
          kind: 'child';
          flightTreeKey: string;
          flightDisplay: string;
          rowTreeKey: string;
          expandAnchor?: boolean;
      }
    | {
          kind: 'groupFooter';
          flightTreeKey: string;
          flightDisplay: string;
          rowTreeKey: string;
      };

function flightSpanTargetCell(cell: TableCellsRow['cells'][number]): TableCommonCell | undefined {
    if (cell === null || cell === undefined || typeof cell === 'string') {
        return undefined;
    }
    return cell as TableCommonCell;
}

/**
 * One merged flight column cell (rowspan) for expanded groups: segment rows + total row.
 */
export function applyFlatTreeFlightColumnRowSpan(args: {
    rows: TableCellsRow[];
    meta: FlatTableRowTreeRowMeta[];
    flightFieldGuid: string;
    preparedColumns: {guid: string}[];
}): void {
    const {rows, meta, flightFieldGuid, preparedColumns} = args;
    const flightColIdx = preparedColumns.findIndex((c) => c.guid === flightFieldGuid);
    if (flightColIdx < 0 || rows.length !== meta.length) {
        return;
    }

    let i = 0;
    while (i < rows.length) {
        const m = meta[i];
        if (m?.kind === 'child' && m.expandAnchor) {
            let j = i + 1;
            while (
                j < rows.length &&
                meta[j]?.kind === 'child' &&
                meta[j].flightTreeKey === m.flightTreeKey
            ) {
                j++;
            }
            const footer = meta[j];
            if (
                footer?.kind === 'groupFooter' &&
                footer.flightTreeKey === m.flightTreeKey &&
                j < rows.length
            ) {
                const span = j - i + 1;
                const first = flightSpanTargetCell(rows[i].cells[flightColIdx]);
                if (first) {
                    first.rowSpan = span;
                }
                for (let r = i + 1; r <= j; r++) {
                    const c = flightSpanTargetCell(rows[r].cells[flightColIdx]);
                    if (c) {
                        c.isRowSpanCovered = true;
                    }
                }
                i = j + 1;
                continue;
            }
        }
        i++;
    }
}

function cellKey(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value);
}

function num(v: unknown): number {
    if (v === null || v === undefined || v === '') {
        return 0;
    }
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

/**
 * Если в порядке столбцов подряд идут три числовые колонки с заголовками F, C, Y (без учёта регистра),
 * следующая числовая колонка считается «Всего» и заполняется суммой F+C+Y на каждой строке (см. applyAutoClassTotal).
 * Явный autoClassTotal в настройках чарта имеет приоритет.
 */
export function inferAutoClassTotalFromFcySequence(
    preparedColumns: ColumnForFcyInfer[],
    flightFieldGuid: string,
    segmentFieldGuid: string,
): FlatTableRowTreeSettings['autoClassTotal'] | undefined {
    const titleKey = (t: string) => t.trim().toLowerCase();
    const isEligibleMeasure = (c: ColumnForFcyInfer) =>
        c.isNumericalDataType &&
        c.guid !== flightFieldGuid &&
        c.guid !== segmentFieldGuid &&
        c.indexInOrder >= 0;

    const ordered = [...preparedColumns]
        .filter((c) => c.indexInOrder >= 0)
        .sort((a, b) => a.indexInOrder - b.indexInOrder);

    for (let i = 0; i + 4 <= ordered.length; i++) {
        const windowCols = ordered.slice(i, i + 4);
        if (!windowCols.every(isEligibleMeasure)) {
            continue;
        }
        const keys = windowCols.map((c) => titleKey(c.actualTitle));
        if (keys[0] === 'f' && keys[1] === 'c' && keys[2] === 'y') {
            return {
                fieldFGuid: windowCols[0].guid,
                fieldCGuid: windowCols[1].guid,
                fieldYGuid: windowCols[2].guid,
                targetMeasureGuid: windowCols[3].guid,
            };
        }
    }

    return undefined;
}

function applyAutoClassTotal(
    row: unknown[],
    columns: PreparedFlatColumnWithTitle[],
    auto: FlatTableRowTreeSettings['autoClassTotal'],
) {
    if (!auto) {
        return;
    }
    const fi = columns.find((c) => c.guid === auto.fieldFGuid)?.indexInOrder ?? -1;
    const ci = columns.find((c) => c.guid === auto.fieldCGuid)?.indexInOrder ?? -1;
    const yi = columns.find((c) => c.guid === auto.fieldYGuid)?.indexInOrder ?? -1;
    const ti = columns.find((c) => c.guid === auto.targetMeasureGuid)?.indexInOrder ?? -1;
    if (fi < 0 || ci < 0 || yi < 0 || ti < 0) {
        return;
    }
    const sum = num(row[fi]) + num(row[ci]) + num(row[yi]);
    row[ti] = sum;
}

export function expandFlatTableRowsForRowTree(args: {
    data: unknown[][];
    preparedColumns: PreparedFlatColumnWithTitle[];
    settings: FlatTableRowTreeSettings;
    treeExpandedKeys: Set<string>;
    /** Игнорировать treeExpandedKeys: всегда отдавать развёрнутые группы (режим client UI). */
    forceExpandAll?: boolean;
}):
    | {ok: true; data: unknown[][]; meta: FlatTableRowTreeRowMeta[]; hasNestedSegments: boolean}
    | {ok: false; reason: string} {
    const {data, preparedColumns, settings, treeExpandedKeys} = args;

    if (preparedColumns.some((c) => c.isTreeDataType)) {
        return {
            ok: false,
            reason: 'flatTableRowTree cannot be used with a TREE field in columns',
        };
    }

    const flightCol = preparedColumns.find((c) => c.guid === settings.flightFieldGuid);
    const segmentCol = preparedColumns.find((c) => c.guid === settings.segmentFieldGuid);

    if (!flightCol || !segmentCol) {
        return {
            ok: false,
            reason: 'flatTableRowTree: flight or segment field not found in table columns',
        };
    }

    if (flightCol.guid === segmentCol.guid) {
        return {ok: false, reason: 'flatTableRowTree: flight and segment must differ'};
    }

    const flightIdx = flightCol.indexInOrder;
    const segmentIdx = segmentCol.indexInOrder;

    if (flightIdx < 0 || segmentIdx < 0) {
        return {ok: false, reason: 'flatTableRowTree: flight or segment not in result order'};
    }

    const measureIndices = preparedColumns
        .filter(
            (c) =>
                c.isNumericalDataType &&
                c.guid !== settings.flightFieldGuid &&
                c.guid !== settings.segmentFieldGuid,
        )
        .map((c) => c.indexInOrder)
        .filter((idx) => idx >= 0);

    const sortedRows = [...data].sort((a, b) => {
        const fa = cellKey(a[flightIdx]);
        const fb = cellKey(b[flightIdx]);
        const c1 = fa.localeCompare(fb, undefined, {numeric: true});
        if (c1 !== 0) {
            return c1;
        }
        return cellKey(a[segmentIdx]).localeCompare(cellKey(b[segmentIdx]), undefined, {
            numeric: true,
        });
    });

    const groups = new Map<string, unknown[][]>();
    for (const row of sortedRows) {
        const fk = cellKey(row[flightIdx]);
        const list = groups.get(fk);
        if (list) {
            list.push(row);
        } else {
            groups.set(fk, [row]);
        }
    }

    const totalLabel = settings.totalLabel ?? 'Всего';
    const outData: unknown[][] = [];
    const meta: FlatTableRowTreeRowMeta[] = [];

    const sortedFlightKeys = [...groups.keys()].sort((a, b) =>
        a.localeCompare(b, undefined, {numeric: true}),
    );

    const hasNestedSegments = [...groups.values()].some((groupRows) => groupRows.length > 1);

    const buildAggregatedRow = (groupRows: unknown[][]) => {
        const parentValues = [...groupRows[0]];

        for (const idx of measureIndices) {
            let sum = 0;
            let any = false;
            for (const r of groupRows) {
                const v = r[idx];
                if (v !== null && v !== undefined && v !== '') {
                    const n = Number(v);
                    if (!Number.isNaN(n)) {
                        sum += n;
                        any = true;
                    }
                }
            }
            parentValues[idx] = any ? sum : null;
        }

        parentValues[flightIdx] = groupRows[0][flightIdx];
        parentValues[segmentIdx] = totalLabel;
        applyAutoClassTotal(parentValues, preparedColumns, settings.autoClassTotal);
        return parentValues;
    };

    for (const flightKey of sortedFlightKeys) {
        const groupRows = groups.get(flightKey)!;
        const flightTreeKey = JSON.stringify([flightKey]);
        const flightDisplay = cellKey(groupRows[0][flightIdx]);

        if (!treeExpandedKeys.has(flightTreeKey)) {
            outData.push(buildAggregatedRow(groupRows));
            meta.push({
                kind: 'parent',
                flightTreeKey,
                flightDisplay,
            });
        } else {
            groupRows.forEach((r, segIndex) => {
                const rowCopy = [...r];
                applyAutoClassTotal(rowCopy, preparedColumns, settings.autoClassTotal);
                outData.push(rowCopy);
                meta.push({
                    kind: 'child',
                    flightTreeKey,
                    flightDisplay: cellKey(r[flightIdx]),
                    rowTreeKey: JSON.stringify([flightKey, cellKey(r[segmentIdx])]),
                    expandAnchor: segIndex === 0,
                });
            });

            const footerRow = buildAggregatedRow(groupRows);
            outData.push(footerRow);
            meta.push({
                kind: 'groupFooter',
                flightTreeKey,
                flightDisplay,
                rowTreeKey: JSON.stringify([flightKey, '__flatTreeTotal__']),
            });
        }
    }

    return {ok: true, data: outData, meta, hasNestedSegments};
}
