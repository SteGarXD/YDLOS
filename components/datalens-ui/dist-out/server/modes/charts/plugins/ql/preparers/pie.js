"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const misc_helpers_1 = require("../utils/misc-helpers");
exports.default = ({ shared, columns, rows, tablePreviewData, }) => {
    if (columns === null) {
        return {};
    }
    const columnTypes = columns.map((column) => column.typeName);
    const colorGroup = {
        name: 'Color',
        group: true,
        undragable: true,
        capacity: 1,
        size: 0,
    };
    const measureGroup = {
        name: 'Measure',
        group: true,
        undragable: true,
        capacity: 1,
        size: 0,
    };
    const availableGroup = {
        name: 'Available',
        group: true,
        undragable: true,
        size: 0,
    };
    const order = [
        colorGroup,
        measureGroup,
        availableGroup,
    ];
    // Default color and measure columns mapping
    let colorIndex = -1;
    let measureIndex = -1;
    if (shared.order && shared.order.length) {
        let collectingColor = false;
        let collectingMeasure = false;
        shared.order.forEach((item) => {
            const itemIsGroup = (0, misc_helpers_1.isGroup)(item);
            if (itemIsGroup && item.name === 'Color') {
                collectingColor = true;
                return;
            }
            if (itemIsGroup && item.name === 'Measure') {
                collectingColor = false;
                collectingMeasure = true;
                return;
            }
            if (itemIsGroup && item.name === 'Available') {
                collectingColor = false;
                collectingMeasure = false;
                return;
            }
            if (collectingColor && !itemIsGroup) {
                colorIndex = columns.findIndex((column) => column.name === item.name);
            }
            if (collectingMeasure && !itemIsGroup) {
                measureIndex = columns.findIndex((column) => column.name === item.name);
            }
        });
    }
    else {
        measureIndex = columnTypes.findIndex((columType) => columType === 'number');
        colorIndex = columns.findIndex((_column, index) => index !== measureIndex);
    }
    let colorInserted = 0;
    if (columns[colorIndex]) {
        order.splice(1, 0, columns[colorIndex]);
        colorInserted = 1;
        colorGroup.size = 1;
    }
    if (columns[measureIndex]) {
        order.splice(2 + colorInserted, 0, columns[measureIndex]);
        measureGroup.size = 1;
    }
    columns.forEach((column, index) => {
        if (index !== colorIndex && index !== measureIndex) {
            order.push(column);
        }
    });
    let result = {
        metadata: {
            order,
        },
        tablePreviewData,
    };
    if (columns[measureIndex] && columns[colorIndex]) {
        result.graphs = [
            {
                data: rows.map((row) => {
                    let name = row[colorIndex];
                    if (columnTypes[colorIndex] === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
                        name = (0, misc_helpers_1.formatUnknownTypeValue)(name);
                    }
                    return {
                        y: (0, misc_helpers_1.parseNumberValue)(row[measureIndex]),
                        name,
                    };
                }),
            },
        ];
    }
    else {
        result = {
            graphs: [],
            metadata: {
                order,
            },
            tablePreviewData,
        };
    }
    return result;
};
