import React from 'react';

import block from 'bem-cn-lite';

import type {FooterRowViewData} from './types';

const b = block('dl-table');

type Props = {
    rows: FooterRowViewData[];
    style?: React.CSSProperties;
};

export const TableFooter = React.memo<Props>((props: Props) => {
    const {rows, style} = props;

    if (!rows.length) {
        return null;
    }

    return (
        <tfoot className={b('footer')} style={style}>
            {rows.map((row) => (
                <tr key={row.id} className={b('tr')}>
                    {row.cells.map((cell, index) => {
                        if (cell.isColSpanCovered || cell.isRowSpanCovered) {
                            return null;
                        }
                        const rowSpanNum =
                            cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined;
                        const colSpanNum =
                            cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined;

                        // CSS Grid with display:contents on <tr>: auto-placement
                        // cannot reliably account for rowSpan reservations from
                        // earlier rows. Pin every cell to its exact grid column
                        // (1-based) so values never shift into adjacent columns.
                        const gridColStart = index + 1;
                        const gridColEnd = gridColStart + (colSpanNum ?? 1);

                        // Column index (0-based) for hidden BackgroundTable measurement:
                        // getTableSizes measures all tfoot rows and uses this to assign widths.
                        const colStart = index;

                        return (
                            <td
                                key={cell.id}
                                data-col-start={colStart}
                                data-ydl-debug="footer-cell"
                                className={b('td', {
                                    pinned: cell.pinned,
                                    measureNames: cell.measureNamesColumn,
                                    type: cell.type,
                                })}
                                style={{
                                    ...cell.style,
                                    gridColumn: `${gridColStart} / ${gridColEnd}`,
                                    ...(rowSpanNum ? {gridRow: `span ${rowSpanNum}`} : {}),
                                }}
                                colSpan={colSpanNum}
                                rowSpan={rowSpanNum}
                            >
                                <div style={cell.contentStyle} className={b('footer-cell-content')}>
                                    {cell.content}
                                </div>
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tfoot>
    );
});

TableFooter.displayName = 'TableFooter';
