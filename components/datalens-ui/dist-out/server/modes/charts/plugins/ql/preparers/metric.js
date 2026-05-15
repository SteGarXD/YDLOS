"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const markup_helpers_1 = require("../../datalens/utils/markup-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
exports.default = ({ shared, columns, rows, ChartEditor: _ChartEditor, }) => {
    if (columns === null) {
        return {};
    }
    const columnTypes = columns.map((column) => column.typeName);
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
    const order = [measureGroup, availableGroup];
    // Default x and y columns mapping
    let measureIndex = -1;
    if (shared.order && shared.order.length) {
        let collectingMeasure = false;
        shared.order.forEach((item) => {
            const itemIsGroup = (0, misc_helpers_1.isGroup)(item);
            if (itemIsGroup && item.name === 'Measure') {
                collectingMeasure = true;
                return;
            }
            if (itemIsGroup && item.name === 'Available') {
                collectingMeasure = false;
                return;
            }
            if (collectingMeasure && !itemIsGroup) {
                measureIndex = columns.findIndex((column) => column.name === item.name);
            }
        });
    }
    else {
        measureIndex = 0;
    }
    if (columns[measureIndex]) {
        order.splice(1, 0, columns[measureIndex]);
        measureGroup.size = 1;
    }
    columns.forEach((column, index) => {
        if (index !== measureIndex) {
            order.push(column);
        }
    });
    let result;
    const measureColumn = columns[measureIndex];
    if (measureColumn) {
        let value = rows[0][measureIndex];
        if (columnTypes[measureIndex] === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
            value = (0, misc_helpers_1.formatUnknownTypeValue)(value);
        }
        else if (columnTypes[measureIndex] === shared_1.DATALENS_QL_TYPES.NUMBER) {
            value = (0, misc_helpers_1.parseNumberValue)(value);
        }
        const size = 'm';
        const color = 'rgb(77, 162, 241)';
        const title = measureColumn.name;
        let formattedValue = String(value);
        if (typeof value === 'number') {
            formattedValue = (0, shared_1.formatNumber)(value, {});
        }
        return (0, markup_helpers_1.prepareMetricObject)({ size, title, color, value: formattedValue });
    }
    else {
        result = {};
    }
    return result;
};
