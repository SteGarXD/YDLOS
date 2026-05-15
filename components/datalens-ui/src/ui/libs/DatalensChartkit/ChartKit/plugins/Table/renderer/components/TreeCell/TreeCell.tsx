import React from 'react';

import block from 'bem-cn-lite';
import type {TableCommonCell} from 'shared';
import {ChartKitTreeNodeStateQa} from 'shared';

import {FlatTableRowTreeToggleContext} from './FlatTableRowTreeToggleContext';

import './TreeCell.scss';

const b = block('tree-cell');

function treeIndentPx(treeOffset?: number): number {
    const d = treeOffset ?? 1;
    if (d <= 1) {
        return 2;
    }
    return 4 + (d - 1) * 10;
}

type TreeCellProps = {
    cell?: TableCommonCell;
};

export const TreeCell = (props: TreeCellProps) => {
    const {cell} = props;
    const onFlatTableTreeToggle = React.useContext(FlatTableRowTreeToggleContext);

    if (!cell?.treeNodeState) {
        return null;
    }

    const isOpened = cell.treeNodeState === 'open';
    const qa = isOpened ? ChartKitTreeNodeStateQa.Opened : ChartKitTreeNodeStateQa.Closed;

    return (
        <span className={b()} style={{paddingLeft: treeIndentPx(cell.treeOffset)}}>
            <button
                type="button"
                className={b('btn')}
                data-qa={qa}
                data-tree-node={cell.treeNode}
                onClick={(e) => {
                    if (!onFlatTableTreeToggle || !cell?.treeNode) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    /* Ключ с DOM: при rowspan + sticky первая колонка клик мог «видеть» чужой cell из React. */
                    const domKey = e.currentTarget.getAttribute('data-tree-node');
                    onFlatTableTreeToggle(
                        domKey && domKey.length > 0 ? {...cell, treeNode: domKey} : cell,
                    );
                }}
            >
                <span className={b('sign', {opened: isOpened})} aria-hidden="true" />
            </button>
            <span className={b('value')}>{cell.formattedValue ?? cell.value}</span>
        </span>
    );
};
