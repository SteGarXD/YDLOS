"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const constants_1 = require("../utils/constants");
const misc_helpers_1 = require("../utils/misc-helpers");
exports.default = ({ shared: _shared, columns, rows, ChartEditor: _ChartEditor, }) => {
    if (columns === null) {
        return {};
    }
    const columnTypes = columns.map((column) => column.typeName);
    const knownColumnNames = new Set();
    const head = columns.map((column, index) => {
        const columnType = columnTypes[index];
        let tableColumnType;
        let tableColumnFormat;
        if (columnType === shared_1.DATALENS_QL_TYPES.NUMBER) {
            tableColumnType = 'number';
        }
        else if (columnType === shared_1.DATALENS_QL_TYPES.DATE ||
            columnType === shared_1.DATALENS_QL_TYPES.DATETIME) {
            if (columnType === shared_1.DATALENS_QL_TYPES.DATETIME) {
                tableColumnFormat = constants_1.DEFAULT_DATETIME_FORMAT;
            }
            else if (columnType === shared_1.DATALENS_QL_TYPES.DATE) {
                tableColumnFormat = constants_1.DEFAULT_DATE_FORMAT;
            }
            tableColumnType = 'date';
        }
        else {
            tableColumnType = 'string';
        }
        let uniqueColumnName = column.name;
        while (knownColumnNames.has(uniqueColumnName)) {
            if (/-(\d+)$/.test(uniqueColumnName)) {
                uniqueColumnName = uniqueColumnName.replace(/-(\d+)$/, (_substring, uniqueIndex) => {
                    return `-${Number(uniqueIndex) + 1}`;
                });
            }
            else {
                uniqueColumnName = `${uniqueColumnName}-1`;
            }
        }
        knownColumnNames.add(uniqueColumnName);
        return {
            name: uniqueColumnName,
            id: column.name,
            type: tableColumnType,
            format: tableColumnFormat,
        };
    });
    const result = {
        columns: head,
        data: rows.map((row) => {
            const tableRow = { cells: [] };
            head.forEach(({ name }, index) => {
                let cellValue;
                const value = row[index];
                if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.NUMBER) {
                    cellValue = (0, misc_helpers_1.parseNumberValueForTable)(value);
                }
                else if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.DATE ||
                    columnTypes[index] === shared_1.DATALENS_QL_TYPES.DATETIME) {
                    cellValue = value;
                }
                else if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.UNKNOWN ||
                    // We need to wait for BI-4892
                    // Temporarily checking type missmatch
                    (value && typeof value === 'object' && columnTypes[index] === 'string')) {
                    cellValue = (0, misc_helpers_1.formatUnknownTypeValue)(value);
                }
                else {
                    cellValue = value;
                }
                tableRow.cells.push({ fieldId: name, value: cellValue });
            });
            return tableRow;
        }),
    };
    return result;
};
