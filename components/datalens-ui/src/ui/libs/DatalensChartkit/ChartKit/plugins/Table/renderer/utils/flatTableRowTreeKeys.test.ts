import type {TableCellsRow} from 'shared';

import {
    collectFlatTableRowTreeFlightKeys,
    flatTableRowTreeClickBaseline,
    mergeFlatTableRowTreeBaselineOnSigChange,
    mergeTableTreeStateForDataProvider,
} from './flatTableRowTreeKeys';

function flightRow(flight: string): TableCellsRow {
    const treeNode = JSON.stringify([flight]);
    return {
        cells: [
            {treeNode, treeOffset: 1, value: flight} as TableCellsRow['cells'][number],
            {value: 'Всего'} as TableCellsRow['cells'][number],
        ],
    };
}

describe('flatTableRowTreeClickBaseline', () => {
    it('merges ref and params without dropping keys', () => {
        const k1 = JSON.stringify(['B2745']);
        const k2 = JSON.stringify(['B2746']);
        expect(flatTableRowTreeClickBaseline([k1], [k2])).toEqual(
            expect.arrayContaining([k1, k2]),
        );
        expect(flatTableRowTreeClickBaseline([k1], [k2])).toHaveLength(2);
    });

    it('dedupes identical keys', () => {
        const k = JSON.stringify(['B2745']);
        expect(flatTableRowTreeClickBaseline([k], [k])).toEqual([k]);
    });
});

describe('mergeTableTreeStateForDataProvider', () => {
    it('keeps runtime when it is a strict superset of stale dash props (multi-expand)', () => {
        const k1 = JSON.stringify(['B2745']);
        const k2 = JSON.stringify(['B2746']);
        const out = mergeTableTreeStateForDataProvider({treeState: [k1]}, {treeState: [k1, k2]});
        expect(out).toEqual(expect.arrayContaining([k1, k2]));
        expect(out).toHaveLength(2);
    });

    it('uses runtime after partial collapse', () => {
        const k1 = JSON.stringify(['B2745']);
        const k2 = JSON.stringify(['B2746']);
        const out = mergeTableTreeStateForDataProvider({treeState: [k1, k2]}, {treeState: [k2]});
        expect(out).toEqual([k2]);
    });

    it('uses props when runtime has no treeState key', () => {
        const k1 = JSON.stringify(['B2745']);
        expect(mergeTableTreeStateForDataProvider({treeState: [k1]}, {})).toEqual([k1]);
    });

    it('does not wipe dash treeState when runtime is explicit empty array', () => {
        const k1 = JSON.stringify(['B2745']);
        const out = mergeTableTreeStateForDataProvider({treeState: [k1]}, {treeState: []});
        expect(out).toEqual([k1]);
    });

    it('clears date treeState keys outside current dash interval when runtime sends empty treeState', () => {
        const sept = JSON.stringify(['2024-09-01']);
        const props = {
            ds: '__interval_2024-08-17T00:00:00.000Z_2024-08-29T23:59:59.999Z',
            treeState: [sept],
        };
        const out = mergeTableTreeStateForDataProvider(props, {treeState: []});
        expect(out).toEqual([]);
    });

    it('clears stale date keys when ds/dta live on runtime only (props = hash treeState)', () => {
        const sept = JSON.stringify(['2024-09-01']);
        const props = {treeState: [sept]};
        const runtime = {
            treeState: [] as string[],
            ds: '__interval_2024-03-15T00:00:00.000Z_2024-03-17T23:59:59.999Z',
            dta1: '2024-03-15T00:00:00.000Z',
            dta2: '2024-03-17T23:59:59.999Z',
        };
        expect(mergeTableTreeStateForDataProvider(props, runtime)).toEqual([]);
    });

    it('unions disjoint props and runtime when dash lags second expand', () => {
        const k1 = JSON.stringify(['B2745']);
        const k2 = JSON.stringify(['B2746']);
        const out = mergeTableTreeStateForDataProvider({treeState: [k1]}, {treeState: [k2]});
        expect(out).toEqual(expect.arrayContaining([k1, k2]));
        expect(out).toHaveLength(2);
    });
});

describe('mergeFlatTableRowTreeBaselineOnSigChange', () => {
    it('keeps previous ref keys when server echoes only the last expansion', () => {
        const k1 = JSON.stringify(['B2745']);
        const k2 = JSON.stringify(['B2746']);
        const rows = [flightRow('B2745'), flightRow('B2746')];
        const merged = mergeFlatTableRowTreeBaselineOnSigChange([k1, k2], [k2], rows);
        expect(merged).toEqual(expect.arrayContaining([k1, k2]));
        expect(merged).toHaveLength(2);
    });

    it('drops keys not present in current rows', () => {
        const oldK = JSON.stringify(['B9999']);
        const k1 = JSON.stringify(['B2745']);
        const rows = [flightRow('B2745')];
        const merged = mergeFlatTableRowTreeBaselineOnSigChange([oldK], [k1], rows);
        expect(merged).toEqual([k1]);
    });

    it('collectFlatTableRowTreeFlightKeys matches merge filter', () => {
        const rows = [flightRow('B2735'), flightRow('B2745')];
        const keys = collectFlatTableRowTreeFlightKeys(rows);
        expect(keys.length).toBe(2);
    });
});
