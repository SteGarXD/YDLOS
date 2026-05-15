import type {TableCommonCell} from 'shared';

import {getUpdatesTreeState} from './tree';

function cellWithTreeNode(flight: string): TableCommonCell {
    return {
        treeNode: JSON.stringify([flight]),
    } as TableCommonCell;
}

describe('getUpdatesTreeState (flat row tree keys)', () => {
    const k2745 = JSON.stringify(['B2745']);
    const k2746 = JSON.stringify(['B2746']);

    it('adds second flight without removing the first', () => {
        const next = getUpdatesTreeState({
            cell: cellWithTreeNode('B2746'),
            params: {treeState: [k2745]},
        });
        expect(next).toEqual(expect.arrayContaining([k2745, k2746]));
        expect(next).toHaveLength(2);
    });

    it('toggles off only the clicked flight', () => {
        const next = getUpdatesTreeState({
            cell: cellWithTreeNode('B2745'),
            params: {treeState: [k2745, k2746]},
        });
        expect(next).toEqual([k2746]);
    });

    it('adds first flight when expanding second first (order-independent keys)', () => {
        const next = getUpdatesTreeState({
            cell: cellWithTreeNode('B2745'),
            params: {treeState: [k2746]},
        });
        expect(next).toEqual(expect.arrayContaining([k2745, k2746]));
        expect(next).toHaveLength(2);
    });
});
