"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrandTotalsRowIndex = exports.setTotalsHeaders = exports.setTotalsHeadersToHead = exports.setTotalsHeadersToRows = exports.isRowWithTotals = void 0;
const shared_1 = require("../../../../../../../../shared");
const isRowWithTotals = (headers, fieldsItemIdMap) => {
    return headers.some((header) => {
        var _a;
        if (!header) {
            return false;
        }
        const [_value, legendItemId] = header[0];
        return ((_a = fieldsItemIdMap[legendItemId]) === null || _a === void 0 ? void 0 : _a.item_type) === 'placeholder';
    });
};
exports.isRowWithTotals = isRowWithTotals;
const setTotalsHeadersToRows = (rows, i18n, options = {}) => {
    const { rowHeaderLength = 0, usePivotTotalLabel = false } = options;
    const totalLabelKey = usePivotTotalLabel ? 'label_total_pivot' : 'label_total';
    // YDL OS: в сводной всегда показываем «ИТОГО» (эталон), не ключ и не TOTAL
    const totalTitle = totalLabelKey === 'label_total_pivot' ? 'ИТОГО' : i18n(totalLabelKey);
    rows.forEach((row) => {
        let isTotalHeaderSet = false;
        let totalLabelCellIndex = -1;
        row.cells.forEach((cell, index) => {
            if (cell.isTotalCell && cell.value === '' && !isTotalHeaderSet) {
                isTotalHeaderSet = true;
                totalLabelCellIndex = index;
                if (usePivotTotalLabel && rowHeaderLength > 0) {
                    cell.value = totalTitle;
                    cell.type = 'text';
                    if (rowHeaderLength > 1) {
                        cell.colSpan = rowHeaderLength;
                    }
                }
                else {
                    const prevCell = row.cells[index - 1];
                    if (prevCell) {
                        if ((0, shared_1.isMarkupItem)(prevCell.value)) {
                            const markupValue = {
                                type: 'concat',
                                children: [{ type: 'text', content: `${totalTitle} ` }, prevCell.value],
                            };
                            cell.value = markupValue;
                        }
                        else {
                            cell.value = `${totalTitle} ${prevCell.value}`;
                            cell.type = 'text';
                        }
                    }
                    else {
                        cell.value = totalTitle;
                        cell.type = 'text';
                    }
                }
            }
            else if (usePivotTotalLabel &&
                rowHeaderLength > 1 &&
                totalLabelCellIndex >= 0 &&
                index > totalLabelCellIndex &&
                index < totalLabelCellIndex + rowHeaderLength &&
                cell.isTotalCell) {
                cell.isColSpanCovered = true;
            }
        });
    });
};
exports.setTotalsHeadersToRows = setTotalsHeadersToRows;
const setTotalsHeadersToHead = (head, i18n, parentName, usePivotTotalLabel = false) => {
    const totalLabelKey = usePivotTotalLabel ? 'label_total_pivot' : 'label_total';
    // YDL OS: в сводной всегда «ИТОГО» (эталон)
    const totalTitle = usePivotTotalLabel ? 'ИТОГО' : i18n(totalLabelKey);
    for (let i = 0; i < head.length; i++) {
        const headItem = head[i];
        if (headItem.isTotalCell) {
            if (usePivotTotalLabel) {
                headItem.name = totalTitle;
            }
            else if (parentName) {
                const isParentMarkup = typeof parentName === 'object' && 'content' in parentName;
                const parentCellValue = isParentMarkup ? (0, shared_1.markupToRawString)(parentName) : parentName;
                headItem.name = `${totalTitle} ${parentCellValue}`;
            }
            else {
                headItem.name = totalTitle;
            }
            break;
        }
        const children = headItem.sub;
        if (children && children.length) {
            (0, exports.setTotalsHeadersToHead)(children, i18n, headItem.name, usePivotTotalLabel);
        }
    }
};
exports.setTotalsHeadersToHead = setTotalsHeadersToHead;
const setTotalsHeaders = ({ rows, head }, ChartEditor, options = {}) => {
    var _a;
    const i18n = (key) => ChartEditor.getTranslation('wizard.prepares', key);
    // Default false: only pivot passes usePivotTotalLabel: true; other callers get old behavior (backward compat)
    const usePivotTotalLabel = (_a = options.usePivotTotalLabel) !== null && _a !== void 0 ? _a : false;
    (0, exports.setTotalsHeadersToHead)(head, i18n, undefined, usePivotTotalLabel);
    (0, exports.setTotalsHeadersToRows)(rows, i18n, options);
};
exports.setTotalsHeaders = setTotalsHeaders;
const getGrandTotalsRowIndex = (rows) => {
    // Totals are always at the end. Find the first row that has any total cell (row may have
    // placeholder in any column, not only cells[0]), so we treat all following rows as footer.
    const totalRowIndex = rows.findIndex((row) => { var _a; return (_a = row.cells) === null || _a === void 0 ? void 0 : _a.some((c) => c.isTotalCell); });
    return totalRowIndex === -1 ? -1 : totalRowIndex;
};
exports.getGrandTotalsRowIndex = getGrandTotalsRowIndex;
