"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortMeta = exports.isSortByRoleAllowed = exports.getSortDirection = void 0;
const shared_1 = require("../../../../../../../../shared");
const getSortDirection = (currentDirection) => {
    switch (currentDirection) {
        case 'desc': {
            return 'asc';
        }
        case 'asc': {
            return undefined;
        }
        case null: {
            return 'desc';
        }
        default: {
            return undefined;
        }
    }
};
exports.getSortDirection = getSortDirection;
const isSortByRoleAllowed = (pivotStructure, pivotTotals, role) => {
    const hasRowSubtotals = pivotTotals === null || pivotTotals === void 0 ? void 0 : pivotTotals.rows.some((item) => item.level > 0);
    const hasColumnSubtotals = pivotTotals === null || pivotTotals === void 0 ? void 0 : pivotTotals.columns.some((item) => item.level > 0);
    if ((hasRowSubtotals && role === 'pivot_column') ||
        (hasColumnSubtotals && role === 'pivot_row')) {
        return false;
    }
    const measures = pivotStructure.filter((item) => item.role_spec.role === 'pivot_measure');
    if (measures.length > 1) {
        const measureName = pivotStructure.find((s) => s.title === shared_1.PseudoFieldTitle.MeasureNames);
        return (measureName === null || measureName === void 0 ? void 0 : measureName.role_spec.role) === role;
    }
    return true;
};
exports.isSortByRoleAllowed = isSortByRoleAllowed;
const getSortMeta = ({ meta, path, measureGuid, fieldOrder, }) => {
    const prevDirection = meta.sorting_direction;
    return {
        role: meta.role_spec.role,
        currentSortDirection: prevDirection,
        nextSortDirection: (0, exports.getSortDirection)(prevDirection),
        path,
        measureGuid,
        fieldOrder,
    };
};
exports.getSortMeta = getSortMeta;
