"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalsForPivot = void 0;
const totals_1 = require("../../../../utils/pivot-table/totals");
const getTotalsForPivot = ({ rowsFields, columnsFields, }) => {
    return {
        settings: {
            totals: (0, totals_1.getPivotTableSubTotals)({ rowsFields, columnsFields }),
        },
    };
};
exports.getTotalsForPivot = getTotalsForPivot;
