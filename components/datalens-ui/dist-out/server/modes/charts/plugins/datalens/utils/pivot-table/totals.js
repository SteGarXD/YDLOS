"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPivotTableSubTotals = void 0;
const getSubTotalsFromFields = (fields) => {
    return fields
        .map((field, index) => {
        var _a;
        const isSubTotalsEnabled = (_a = field.subTotalsSettings) === null || _a === void 0 ? void 0 : _a.enabled;
        if (isSubTotalsEnabled) {
            return {
                level: index,
            };
        }
        return undefined;
    })
        .filter((setting) => Boolean(setting));
};
const getPivotTableSubTotals = ({ rowsFields, columnsFields }) => {
    return {
        rows: getSubTotalsFromFields(rowsFields),
        columns: getSubTotalsFromFields(columnsFields),
    };
};
exports.getPivotTableSubTotals = getPivotTableSubTotals;
