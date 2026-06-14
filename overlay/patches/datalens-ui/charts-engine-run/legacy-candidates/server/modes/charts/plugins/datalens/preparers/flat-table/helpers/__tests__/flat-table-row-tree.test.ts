import {
    applyFlatTreeFlightColumnRowSpan,
    inferAutoClassTotalFromFcySequence,
    type FlatTableRowTreeRowMeta,
} from '../flat-table-row-tree';

/** Minimal cell shape for rowspan tests (matches TableCommonCell fields we mutate). */
type SpanTestCell = {value: string; rowSpan?: number; isRowSpanCovered?: boolean};

describe('inferAutoClassTotalFromFcySequence', () => {
    const flight = 'flight-guid';
    const segment = 'segment-guid';

    test('detects F,C,Y + next numeric as target', () => {
        const cols = [
            {guid: flight, indexInOrder: 0, isNumericalDataType: false, actualTitle: 'Рейс'},
            {guid: segment, indexInOrder: 1, isNumericalDataType: false, actualTitle: 'Сегмент'},
            {guid: 'f1', indexInOrder: 2, isNumericalDataType: true, actualTitle: 'F'},
            {guid: 'c1', indexInOrder: 3, isNumericalDataType: true, actualTitle: 'C'},
            {guid: 'y1', indexInOrder: 4, isNumericalDataType: true, actualTitle: 'Y'},
            {guid: 'tot', indexInOrder: 5, isNumericalDataType: true, actualTitle: 'Всего'},
        ];
        expect(inferAutoClassTotalFromFcySequence(cols, flight, segment)).toEqual({
            fieldFGuid: 'f1',
            fieldCGuid: 'c1',
            fieldYGuid: 'y1',
            targetMeasureGuid: 'tot',
        });
    });

    test('is case-insensitive on titles', () => {
        const cols = [
            {guid: 'a', indexInOrder: 0, isNumericalDataType: true, actualTitle: 'f'},
            {guid: 'b', indexInOrder: 1, isNumericalDataType: true, actualTitle: ' C '},
            {guid: 'c', indexInOrder: 2, isNumericalDataType: true, actualTitle: 'Y'},
            {guid: 'd', indexInOrder: 3, isNumericalDataType: true, actualTitle: 'x'},
        ];
        expect(inferAutoClassTotalFromFcySequence(cols, 'nf', 'ns')).toEqual({
            fieldFGuid: 'a',
            fieldCGuid: 'b',
            fieldYGuid: 'c',
            targetMeasureGuid: 'd',
        });
    });

    test('returns undefined if no fourth numeric column', () => {
        const cols = [
            {guid: 'f1', indexInOrder: 0, isNumericalDataType: true, actualTitle: 'F'},
            {guid: 'c1', indexInOrder: 1, isNumericalDataType: true, actualTitle: 'C'},
            {guid: 'y1', indexInOrder: 2, isNumericalDataType: true, actualTitle: 'Y'},
        ];
        expect(inferAutoClassTotalFromFcySequence(cols, 'x', 'y')).toBeUndefined();
    });

    test('returns undefined if Y not followed by numeric', () => {
        const cols = [
            {guid: 'f1', indexInOrder: 0, isNumericalDataType: true, actualTitle: 'F'},
            {guid: 'c1', indexInOrder: 1, isNumericalDataType: true, actualTitle: 'C'},
            {guid: 'y1', indexInOrder: 2, isNumericalDataType: true, actualTitle: 'Y'},
            {guid: 't', indexInOrder: 3, isNumericalDataType: false, actualTitle: 'Text'},
        ];
        expect(inferAutoClassTotalFromFcySequence(cols, 'x', 'y')).toBeUndefined();
    });

    test('skips flight/segment as F even if title matches', () => {
        const cols = [
            {guid: flight, indexInOrder: 0, isNumericalDataType: true, actualTitle: 'F'},
            {guid: 'c1', indexInOrder: 1, isNumericalDataType: true, actualTitle: 'C'},
            {guid: 'y1', indexInOrder: 2, isNumericalDataType: true, actualTitle: 'Y'},
            {guid: 'tot', indexInOrder: 3, isNumericalDataType: true, actualTitle: 'T'},
        ];
        expect(inferAutoClassTotalFromFcySequence(cols, flight, segment)).toBeUndefined();
    });
});

describe('applyFlatTreeFlightColumnRowSpan', () => {
    const flightGuid = 'g-flight';
    const preparedColumns = [{guid: flightGuid}, {guid: 'g-seg'}, {guid: 'm1'}];

    const mkRow = () => ({
        cells: [{value: ''}, {value: ''}, {value: ''}] as SpanTestCell[],
    });

    test('sets rowspan on first segment row and covers flight cell on following rows', () => {
        const fk = JSON.stringify(['B1']);
        const meta: FlatTableRowTreeRowMeta[] = [
            {
                kind: 'child',
                flightTreeKey: fk,
                flightDisplay: 'B1',
                rowTreeKey: JSON.stringify(['B1', 'A-B']),
                expandAnchor: true,
            },
            {
                kind: 'child',
                flightTreeKey: fk,
                flightDisplay: 'B1',
                rowTreeKey: JSON.stringify(['B1', 'B-C']),
            },
            {
                kind: 'groupFooter',
                flightTreeKey: fk,
                flightDisplay: 'B1',
                rowTreeKey: JSON.stringify(['B1', '__flatTreeTotal__']),
            },
        ];
        const rows = [mkRow(), mkRow(), mkRow()];
        applyFlatTreeFlightColumnRowSpan({
            rows: rows as Parameters<typeof applyFlatTreeFlightColumnRowSpan>[0]['rows'],
            meta,
            flightFieldGuid: flightGuid,
            preparedColumns,
        });
        expect(rows[0].cells[0].rowSpan).toBe(3);
        expect(rows[1].cells[0].isRowSpanCovered).toBe(true);
        expect(rows[2].cells[0].isRowSpanCovered).toBe(true);
    });

    test('single segment + footer: rowspan 2', () => {
        const fk = JSON.stringify(['X']);
        const meta: FlatTableRowTreeRowMeta[] = [
            {
                kind: 'child',
                flightTreeKey: fk,
                flightDisplay: 'X',
                rowTreeKey: JSON.stringify(['X', 'seg']),
                expandAnchor: true,
            },
            {
                kind: 'groupFooter',
                flightTreeKey: fk,
                flightDisplay: 'X',
                rowTreeKey: JSON.stringify(['X', '__flatTreeTotal__']),
            },
        ];
        const rows = [mkRow(), mkRow()];
        applyFlatTreeFlightColumnRowSpan({
            rows: rows as Parameters<typeof applyFlatTreeFlightColumnRowSpan>[0]['rows'],
            meta,
            flightFieldGuid: flightGuid,
            preparedColumns,
        });
        expect(rows[0].cells[0].rowSpan).toBe(2);
        expect(rows[1].cells[0].isRowSpanCovered).toBe(true);
    });
});
