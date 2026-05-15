"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getControlDisticntsFromRows = void 0;
const CONTROL_DISTINCT_ROW_INDEX = 0;
const getControlDisticntsFromRows = (rows) => {
    return rows.reduce((acc, row) => {
        const data = String(row[CONTROL_DISTINCT_ROW_INDEX]);
        acc.push(data);
        return acc;
    }, []);
};
exports.getControlDisticntsFromRows = getControlDisticntsFromRows;
