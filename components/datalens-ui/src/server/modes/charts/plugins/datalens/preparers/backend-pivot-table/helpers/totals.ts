import type {IChartEditor, MarkupItem} from '../../../../../../../../shared';
import {isMarkupItem, markupToRawString} from '../../../../../../../../shared';
import type {CharkitTableHead, ChartkitTableRows, PivotDataRowsHeader, PivotField} from '../types';

export const isRowWithTotals = (
    headers: PivotDataRowsHeader[],
    fieldsItemIdMap: Record<string, PivotField>,
) => {
    return headers.some((header) => {
        if (!header) {
            return false;
        }
        const [_value, legendItemId] = header[0];

        return fieldsItemIdMap[legendItemId]?.item_type === 'placeholder';
    });
};

export type SetTotalsHeadersOptions = {
    rowHeaderLength?: number;
    usePivotTotalLabel?: boolean;
};

export const setTotalsHeadersToRows = (
    rows: ChartkitTableRows,
    i18n: (key: string) => string,
    options: SetTotalsHeadersOptions = {},
) => {
    const {rowHeaderLength = 0, usePivotTotalLabel = false} = options;
    const totalLabelKey = usePivotTotalLabel ? 'label_total_pivot' : 'label_total';
    // YDL OS: в сводной всегда показываем «ИТОГО» (эталон), не ключ и не TOTAL
    const totalTitle = totalLabelKey === 'label_total_pivot' ? 'ИТОГО' : i18n(totalLabelKey);

    rows.forEach((row: {cells: any[]}) => {
        let isTotalHeaderSet = false;
        let totalLabelCellIndex = -1;

        row.cells.forEach((cell, index) => {
            if (cell.isTotalCell && cell.value === '' && !isTotalHeaderSet) {
                isTotalHeaderSet = true;
                totalLabelCellIndex = index;

                if (usePivotTotalLabel && rowHeaderLength > 0) {
                    cell.value = totalTitle;
                    cell.type = 'text';
                    // YDL OS: визуально объединяем только первые два столбца (Рейс + Напр-е), не всю строку заголовков
                    if (rowHeaderLength > 1) {
                        (cell as any).colSpan = 2;
                    }
                } else {
                    const prevCell = row.cells[index - 1];

                    if (prevCell) {
                        if (isMarkupItem(prevCell.value)) {
                            const markupValue: MarkupItem = {
                                type: 'concat',
                                children: [
                                    {type: 'text', content: `${totalTitle} `},
                                    prevCell.value,
                                ],
                            };
                            cell.value = markupValue;
                        } else {
                            cell.value = `${totalTitle} ${prevCell.value}`;
                            cell.type = 'text';
                        }
                    } else {
                        cell.value = totalTitle;
                        cell.type = 'text';
                    }
                }
            } else if (
                usePivotTotalLabel &&
                rowHeaderLength > 1 &&
                totalLabelCellIndex >= 0 &&
                index === totalLabelCellIndex + 1 &&
                cell.isTotalCell
            ) {
                (cell as any).isColSpanCovered = true;
            }
        });
    });
};

export const setTotalsHeadersToHead = (
    head: CharkitTableHead,
    i18n: (key: string) => string,
    parentName?: string | null | MarkupItem,
    usePivotTotalLabel = false,
) => {
    const totalLabelKey = usePivotTotalLabel ? 'label_total_pivot' : 'label_total';
    // YDL OS: в сводной всегда «ИТОГО» (эталон)
    const totalTitle = usePivotTotalLabel ? 'ИТОГО' : i18n(totalLabelKey);

    for (let i = 0; i < head.length; i++) {
        const headItem = head[i];
        if (headItem.isTotalCell) {
            if (usePivotTotalLabel) {
                headItem.name = totalTitle;
            } else if (parentName) {
                const isParentMarkup = typeof parentName === 'object' && 'content' in parentName;

                const parentCellValue = isParentMarkup ? markupToRawString(parentName) : parentName;

                headItem.name = `${totalTitle} ${parentCellValue}`;
            } else {
                headItem.name = totalTitle;
            }
            break;
        }

        const children = headItem.sub;

        if (children && children.length) {
            setTotalsHeadersToHead(children, i18n, headItem.name, usePivotTotalLabel);
        }
    }
};

export const setTotalsHeaders = (
    {rows, head}: {rows: ChartkitTableRows; head: CharkitTableHead},
    ChartEditor: IChartEditor,
    options: SetTotalsHeadersOptions = {},
) => {
    const i18n = (key: string) => ChartEditor.getTranslation('wizard.prepares', key);
    // Default false: only pivot passes usePivotTotalLabel: true; other callers get old behavior (backward compat)
    const usePivotTotalLabel = options.usePivotTotalLabel ?? false;

    setTotalsHeadersToHead(head, i18n, undefined, usePivotTotalLabel);
    setTotalsHeadersToRows(rows, i18n, options);
};

export const getGrandTotalsRowIndex = (rows: ChartkitTableRows) => {
    // YDL OS: проверяем только первую ячейку (row header). Column-total ячейки тоже имеют
    // isTotalCell=true, но это НЕ строка итогов — это просто сумма по колонке.
    // Если проверять `.some()`, то getGrandTotalsRowIndex возвращает 0 (первая строка уже
    // содержит column-total), и условие `totalRowIndex > 0` не срабатывает → footer пуст.
    const totalRowIndex = rows.findIndex(
        (row: {cells: any[]}) => row.cells?.[0]?.isTotalCell === true,
    );
    return totalRowIndex === -1 ? -1 : totalRowIndex;
};
