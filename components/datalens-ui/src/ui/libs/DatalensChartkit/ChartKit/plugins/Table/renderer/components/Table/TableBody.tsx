import React from 'react';

import block from 'bem-cn-lite';
import {ChartKitTableQa} from 'shared';

import type {BodyCellViewData, BodyRowViewData, RowRef} from './types';
import {getCellVeticalAlignmentStyle} from './utils';

const b = block('dl-table');

type Props = {
    rows: BodyRowViewData[];
    style?: React.CSSProperties;
    onCellClick?: (event: React.MouseEvent, cell: unknown, rowId: string) => void;
    rowRef?: RowRef;
    hasFooter?: boolean;
};

const TableBodyCell = (props: {
    cell: BodyCellViewData;
    bodyRowIndex: number;
    totalRows: number;
    hasFooter?: boolean;
    onClick?: (event: React.MouseEvent) => void;
}) => {
    const {cell, bodyRowIndex, totalRows, hasFooter, onClick} = props;
    const contentStyle = {
        ...cell.contentStyle,
        ...getCellVeticalAlignmentStyle(cell),
    };
    const rowSpan = cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : 1;
    const endsAtFooter = Boolean(hasFooter) && bodyRowIndex + rowSpan >= totalRows;

    const colStart =
        (typeof cell.columnStartIndex === 'number' ? cell.columnStartIndex : cell.index) + 1;
    const gridColumn =
        cell.colSpan && cell.colSpan > 1
            ? `${colStart} / span ${cell.colSpan}`
            : String(colStart);
    const gridRowLine = bodyRowIndex + 1;
    const gridRow =
        cell.rowSpan && cell.rowSpan > 1
            ? `${gridRowLine} / span ${cell.rowSpan}`
            : String(gridRowLine);

    return (
        <td
            data-col-start={
                typeof cell.columnStartIndex === 'number' ? cell.columnStartIndex : cell.index
            }
            className={b(
                'td',
                {
                    type: cell.type,
                    pinned: cell.pinned,
                    measureNames: cell.measureNamesColumn,
                    'last-before-footer': endsAtFooter,
                },
                cell.className,
            )}
            style={{
                ...cell.style,
                /*
                 * tbody — display:grid, tr — display:contents: при пропуске td (rowspan covered) авторазмещение
                 * сдвигает колонки — клик по «+» попадает в данные другой строки. Явные grid-column/grid-row
                 * по индексу строки данных и meta.head.index.
                 */
                gridColumn,
                gridRow,
                maxHeight: cell.maxHeight,
                /*
                 * Закреплённые ячейки (рейс): одинаковый z-index + rowspan + sticky — нижняя строка может
                 * оказаться под «прозрачным» хитбоксом верхней; клик по + второго рейса обрабатывался как первый.
                 */
                ...(cell.pinned ? {zIndex: 10 + bodyRowIndex} : {}),
            }}
            onClick={onClick}
            rowSpan={cell.rowSpan}
            colSpan={cell.colSpan}
        >
            <div
                className={b('cell-content', {type: cell.contentType})}
                data-qa={ChartKitTableQa.CellContent}
                style={contentStyle}
            >
                {cell.content}
            </div>
        </td>
    );
};

export const TableBody = React.memo<Props>((props: Props) => {
    const {rows, style, rowRef, onCellClick, hasFooter} = props;
    const totalRows = React.useMemo(() => {
        if (!rows.length) {
            return 0;
        }
        return rows.reduce((maxIndex, row) => Math.max(maxIndex, row.index), -1) + 1;
    }, [rows]);

    return (
        <tbody className={b('body')} style={style}>
            {rows.map((row) => {
                return (
                    <tr
                        data-index={row.index}
                        key={row.id}
                        className={b('tr', {
                            'last-before-footer': row.isLastBeforeFooter,
                            segmentRow: row.isSegmentRow,
                        })}
                        ref={rowRef}
                    >
                        {row.cells.map((cell) => {
                            return (
                                <TableBodyCell
                                    key={cell.id}
                                    cell={cell}
                                    bodyRowIndex={row.index}
                                    totalRows={totalRows}
                                    hasFooter={hasFooter}
                                    onClick={(event) => {
                                        if (onCellClick) {
                                            onCellClick(event, cell.data, row.id);
                                        }
                                    }}
                                />
                            );
                        })}
                    </tr>
                );
            })}
        </tbody>
    );
});

TableBody.displayName = 'TableBody';
