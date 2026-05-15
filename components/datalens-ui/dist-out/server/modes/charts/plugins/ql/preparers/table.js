"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const shared_1 = require("../../../../../../shared");
const constants_1 = require("../utils/constants");
const misc_helpers_1 = require("../utils/misc-helpers");
exports.default = ({ shared, columns, rows, tablePreviewData, }) => {
    if (columns === null) {
        return {};
    }
    const columnTypes = columns.map((column) => column.typeName);
    const orderColumns = [];
    const orderAvailable = [];
    const result = {
        head: [],
        rows: [],
        tablePreviewData,
    };
    const displayedColumnsIndices = [];
    if (shared.order && shared.order.length) {
        let collectingColumns = false;
        let collectingAvailable = false;
        shared.order.forEach((item) => {
            const itemIsGroup = (0, misc_helpers_1.isGroup)(item);
            if (itemIsGroup && item.name === 'Columns') {
                collectingColumns = true;
                return;
            }
            if (itemIsGroup && item.name === 'Available') {
                collectingColumns = false;
                collectingAvailable = true;
                return;
            }
            if (collectingColumns && !itemIsGroup) {
                const itemIndex = columns.findIndex((column) => column.name === item.name);
                if (itemIndex > -1) {
                    orderColumns.push(columns[itemIndex]);
                    displayedColumnsIndices.push(itemIndex);
                }
            }
            if (collectingAvailable && !itemIsGroup) {
                const itemIndex = columns.findIndex((column) => column.name === item.name);
                if (itemIndex > -1) {
                    orderAvailable.push(columns[itemIndex]);
                }
            }
        });
    }
    else {
        columns.forEach((column, index) => {
            orderColumns.push(column);
            displayedColumnsIndices.push(index);
        });
    }
    columns.forEach((column) => {
        if (orderAvailable.indexOf(column) === -1 && orderColumns.indexOf(column) === -1) {
            orderAvailable.push(column);
        }
    });
    result.head = displayedColumnsIndices.map((index) => {
        let tableColumnType;
        let tableColumnFormat;
        const columnType = columnTypes[index];
        if (columnType === shared_1.DATALENS_QL_TYPES.NUMBER) {
            tableColumnType = 'number';
        }
        else if (columnType === shared_1.DATALENS_QL_TYPES.DATETIME ||
            columnType === shared_1.DATALENS_QL_TYPES.DATE) {
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
        return {
            name: columns[index].name,
            type: tableColumnType,
            format: tableColumnFormat,
        };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.rows = rows.map((row) => {
        return {
            values: displayedColumnsIndices.map((index) => {
                let cellValue;
                if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.NUMBER) {
                    cellValue = (0, misc_helpers_1.parseNumberValueForTable)(row[index]);
                }
                else if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.DATETIME ||
                    columnTypes[index] === shared_1.DATALENS_QL_TYPES.DATE) {
                    cellValue = moment_1.default.utc(row[index]).valueOf();
                }
                else if (columnTypes[index] === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
                    cellValue = (0, misc_helpers_1.formatUnknownTypeValue)(row[index]);
                }
                else {
                    cellValue = row[index];
                }
                return cellValue;
            }),
        };
    });
    const order = [
        {
            name: 'Columns',
            group: true,
            undragable: true,
            size: 0,
        },
        ...orderColumns,
        {
            name: 'Available',
            group: true,
            undragable: true,
            size: 0,
        },
        ...orderAvailable,
    ];
    result.metadata = { order };
    return result;
};
