import React from 'react';

import block from 'bem-cn-lite';

import {SortIcon} from '../SortIcon/SortIcon';

import type {HeadRowViewData} from './types';
import {getCellVeticalAlignmentStyle} from './utils';

const b = block('dl-table');

type Props = {
    sticky?: boolean;
    rows: HeadRowViewData[];
    style?: React.CSSProperties;
};

export const TableHead = React.memo<Props>((props: Props) => {
    const {sticky, rows, style} = props;

    return (
        <thead className={b('header', {sticky})} style={style}>
            {rows.map((row, rowIdx) => {
                return (
                    <tr key={row.id} className={b('tr')}>
                        {row.cells.map((th) => {
                            /*
                             * Как у td в TableBody: явные grid-line, иначе только `span N` даёт авторазмещение
                             * и несовпадение треков с телом — «ломается» последняя колонка (Итого) у многоуровневой шапки.
                             */
                            const colStart =
                                (typeof th.columnStartIndex === 'number'
                                    ? th.columnStartIndex
                                    : th.index) + 1;
                            const gridColumn =
                                th.colSpan && th.colSpan > 1
                                    ? `${colStart} / span ${th.colSpan}`
                                    : String(colStart);
                            const rowLine = rowIdx + 1;
                            const gridRow =
                                th.rowSpan && th.rowSpan > 1
                                    ? `${rowLine} / span ${th.rowSpan}`
                                    : String(rowLine);
                            const cellStyle: React.CSSProperties = {
                                ...th.style,
                                gridColumn,
                                gridRow,
                            };
                            const alignLeft = th.headerTextAlign === 'left';
                            const alignCenter = !alignLeft;
                            cellStyle.textAlign = alignLeft ? 'left' : 'center';
                            cellStyle.justifyContent = alignLeft ? 'flex-start' : 'center';
                            /* слева по горизонтали и по вертикали по центру ячейки */
                            cellStyle.alignItems = alignLeft ? 'center' : 'stretch';
                            const verticalAlignmentStyle = getCellVeticalAlignmentStyle(th);
                            const contentStyle = verticalAlignmentStyle
                                ? {style: verticalAlignmentStyle}
                                : null;

                            return (
                                <th
                                    key={th.id}
                                    data-col-start={
                                        typeof th.columnStartIndex === 'number'
                                            ? th.columnStartIndex
                                            : undefined
                                    }
                                    className={b('th', {
                                        clickable: th.sortable,
                                        pinned: th.pinned,
                                        measureNames: th.measureNamesColumn,
                                        align: alignLeft ? 'left' : 'center',
                                    })}
                                    style={cellStyle}
                                    colSpan={th.colSpan}
                                    rowSpan={th.rowSpan}
                                    onClick={th.onClick}
                                >
                                    <div
                                        {...contentStyle}
                                        className={b('th-content', {
                                            sortable: th.sortable,
                                            alignCenter,
                                            alignLeft,
                                        })}
                                    >
                                        {th.content}
                                        <SortIcon className={b('sort-icon')} sorting={th.sorting} />
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                );
            })}
        </thead>
    );
});

TableHead.displayName = 'TableHead';
