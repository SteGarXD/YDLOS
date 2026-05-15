"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColumnValuesByColumnWithBarSettings = void 0;
const misc_helpers_1 = require("../../../utils/misc-helpers");
const getColumnValuesByColumnWithBarSettings = ({ idToTitle, order, columns, values, totals, }) => {
    const columnsWithBarSettings = columns.filter((column) => (0, misc_helpers_1.isTableBarsSettingsEnabled)(column));
    return columnsWithBarSettings.reduce((acc, column) => {
        var _a;
        const columnDataTitle = idToTitle[column.guid] || column.title;
        const indexInOrder = (0, misc_helpers_1.findIndexInOrder)(order, column, columnDataTitle);
        const data = values.reduce((acc, row) => {
            const value = row[indexInOrder];
            acc.push(value);
            return acc;
        }, []);
        if (totals && totals.length && ((_a = column.barsSettings) === null || _a === void 0 ? void 0 : _a.showBarsInTotals)) {
            const totalValue = totals[indexInOrder];
            data.push(totalValue);
        }
        acc[column.guid] = data;
        return acc;
    }, {});
};
exports.getColumnValuesByColumnWithBarSettings = getColumnValuesByColumnWithBarSettings;
