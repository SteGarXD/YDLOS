"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const shared_1 = require("../../../../../../shared");
const misc_helpers_1 = require("../utils/misc-helpers");
// eslint-disable-next-line complexity
exports.default = ({ shared, columns, rows, ChartEditor, tablePreviewData, }) => {
    if (columns === null) {
        return {};
    }
    const columnTypes = columns.map((column) => column.typeName);
    const xGroup = {
        name: 'X',
        group: true,
        undragable: true,
        capacity: 1,
        size: 0,
    };
    const yGroup = {
        name: 'Y',
        group: true,
        undragable: true,
        allowedTypes: [shared_1.DATALENS_QL_TYPES.NUMBER],
        size: 0,
    };
    const colorGroup = {
        name: 'Colors',
        group: true,
        undragable: true,
        size: 0,
    };
    const availableGroup = {
        name: 'Available',
        group: true,
        undragable: true,
        size: 0,
    };
    const order = [
        xGroup,
        yGroup,
        colorGroup,
        availableGroup,
    ];
    let xIndex = -1;
    let yIndexes = [];
    let colorIndexes = [];
    const availableIndexes = [];
    if (shared.order && shared.order.length) {
        let collectingX = false;
        let collectingY = false;
        let collectingColor = false;
        let collectingAvailable = false;
        let draggedX = false;
        let draggedY = false;
        shared.order.forEach((item) => {
            const itemIsGroup = (0, misc_helpers_1.isGroup)(item);
            if (itemIsGroup && item.name === 'X') {
                collectingX = true;
                return;
            }
            if (itemIsGroup && item.name === 'Y') {
                collectingX = false;
                collectingY = true;
                return;
            }
            if (itemIsGroup && item.name === 'Colors') {
                collectingY = false;
                collectingColor = true;
                return;
            }
            if (itemIsGroup && item.name === 'Available') {
                collectingX = false;
                collectingY = false;
                collectingColor = false;
                collectingAvailable = true;
                return;
            }
            if (collectingX && !itemIsGroup) {
                xIndex = columns.findIndex((column) => column.name === item.name);
                draggedX = true;
            }
            if (collectingY && !itemIsGroup) {
                const yIndex = columns.findIndex((column) => column.name === item.name);
                if (yIndex > -1) {
                    yIndexes.push(yIndex);
                }
                draggedY = true;
            }
            if (collectingColor && !itemIsGroup) {
                colorIndexes.push(columns.findIndex((column) => column.name === item.name));
            }
            if (collectingAvailable) {
                availableIndexes.push(columns.findIndex((column) => column.name === item.name));
            }
        });
        if (draggedY) {
            const findNewYIndex = () => columnTypes.findIndex((columnType, index) => columnType === shared_1.DATALENS_QL_TYPES.NUMBER &&
                index !== xIndex &&
                !colorIndexes.includes(index) &&
                !yIndexes.includes(index) &&
                !availableIndexes.includes(index));
            let newFoundYIndex = findNewYIndex();
            while (newFoundYIndex > -1) {
                yIndexes.push(newFoundYIndex);
                newFoundYIndex = findNewYIndex();
            }
        }
        if (draggedX && xIndex === -1) {
            xIndex = columns.findIndex((_column, index) => !yIndexes.includes(index) && !colorIndexes.includes(index));
        }
    }
    else {
        const findNewYIndex = () => columnTypes.findIndex((columnType, index) => columnType === shared_1.DATALENS_QL_TYPES.NUMBER && !yIndexes.includes(index));
        let newFoundYIndex = findNewYIndex();
        while (newFoundYIndex > -1) {
            yIndexes.push(newFoundYIndex);
            newFoundYIndex = findNewYIndex();
        }
        xIndex = columns.findIndex((_column, index) => !yIndexes.includes(index));
        const homogeneousValues = [];
        const iToHomogeneity = [];
        rows.forEach((row) => {
            row.forEach((value, i) => {
                if (typeof homogeneousValues[i] === 'undefined') {
                    homogeneousValues[i] = new Set([value]);
                    iToHomogeneity[i] = true;
                }
                else if (iToHomogeneity[i] === false) {
                    return;
                }
                else if (!homogeneousValues[i].has(value)) {
                    iToHomogeneity[i] = false;
                }
            });
        });
        iToHomogeneity.forEach((_homogeneity, i) => {
            // Removed the uniformity check within CHARTS-5955
            // It may need to be returned in the future for more complex logic, but for now it is superfluous
            if (xIndex !== i && !yIndexes.includes(i)) {
                colorIndexes.push(i);
            }
        });
    }
    colorIndexes = colorIndexes.filter((colorIndex) => colorIndex > -1);
    yIndexes = yIndexes.filter((yIndex) => yIndex > -1);
    let inserted = 0;
    if (columns[xIndex]) {
        order.splice(1 + inserted, 0, columns[xIndex]);
        ++inserted;
        xGroup.size = 1;
    }
    yIndexes.forEach((yIndex) => {
        if (columns[yIndex]) {
            order.splice(2 + inserted, 0, columns[yIndex]);
            ++inserted;
            if (typeof yGroup.size === 'number') {
                yGroup.size += 1;
            }
            else {
                yGroup.size = 1;
            }
        }
    });
    if (yIndexes.length > 1) {
        if (columns.findIndex(({ pseudo }) => pseudo) === -1) {
            columns.push({
                typeName: 'String',
                name: 'Measure Names',
                pseudo: true,
                undragable: true,
            });
        }
        colorGroup.size = 1;
        colorIndexes.push(columns.length - 1);
    }
    if (colorIndexes.length > 0) {
        colorIndexes.forEach((colorIndex) => {
            order.splice(3 + inserted, 0, columns[colorIndex]);
            ++inserted;
            ++colorGroup.size;
        });
    }
    columns.forEach((column, index) => {
        if (index !== xIndex && !yIndexes.includes(index) && !colorIndexes.includes(index)) {
            order.push(column);
        }
    });
    const result = {
        metadata: {
            order,
        },
        tablePreviewData,
    };
    const xIsDate = columnTypes[xIndex] === shared_1.DATALENS_QL_TYPES.DATE ||
        columnTypes[xIndex] === shared_1.DATALENS_QL_TYPES.DATETIME;
    if (xIsDate) {
        ChartEditor.updateHighchartsConfig({
            xAxis: {
                type: 'datetime',
            },
        });
    }
    const xAxisName = xIsDate ? 'categories_ms' : 'categories';
    if (yIndexes.length > 0 && columns[xIndex]) {
        let xValues = [];
        let colorValues = [];
        const dataMatrix = {};
        rows.forEach((row) => {
            let xValue = row[xIndex];
            if (xIsDate) {
                xValue = moment_1.default.utc(xValue).valueOf();
            }
            else if (columnTypes[xIndex] === shared_1.DATALENS_QL_TYPES.UNKNOWN) {
                xValue = (0, misc_helpers_1.formatUnknownTypeValue)(xValue);
            }
            xValues.push(xValue);
            yIndexes.forEach((yIndex) => {
                const yValue = row[yIndex];
                if (colorIndexes.length > 0) {
                    let colorValue = '';
                    colorIndexes.forEach((colorIndex) => {
                        const colorValuePart = columns[colorIndex].pseudo
                            ? columns[yIndex].name
                            : row[colorIndex];
                        colorValue =
                            colorValue.length > 0
                                ? `${colorValue}; ${colorValuePart}`
                                : colorValuePart;
                    });
                    let dataCell = dataMatrix[String(xValue)];
                    if (typeof dataCell === 'undefined') {
                        dataCell = dataMatrix[String(xValue)] = {};
                    }
                    if (typeof dataCell === 'object' && dataCell !== null) {
                        dataCell[String(colorValue)] = (0, misc_helpers_1.parseNumberValue)(yValue);
                    }
                    colorValues.push(colorValue);
                }
                else {
                    dataMatrix[String(xValue)] = (0, misc_helpers_1.parseNumberValue)(yValue);
                }
            });
        });
        xValues = Array.from(new Set(xValues));
        colorValues = Array.from(new Set(colorValues));
        result[xAxisName] = xValues.map((value) => value);
        if (colorIndexes.length > 0) {
            const graphs = colorValues.map((colorValue) => {
                return {
                    title: (0, misc_helpers_1.renderValue)(colorValue),
                    data: [],
                };
            });
            xValues.forEach((xValue) => {
                const dataCell = dataMatrix[String(xValue)];
                if (typeof dataCell === 'object' && dataCell !== null) {
                    colorValues.forEach((colorValue, i) => {
                        if (typeof dataCell[String(colorValue)] === 'undefined') {
                            graphs[i].data.push(null);
                        }
                        else {
                            graphs[i].data.push(dataCell[String(colorValue)]);
                        }
                    });
                }
            });
            result.graphs = graphs;
        }
        else {
            result.graphs = [];
            yIndexes.forEach((yIndex) => {
                var _a;
                const graph = {
                    title: columns[yIndex].name,
                    data: xValues.map((xValue) => {
                        return dataMatrix[String(xValue)];
                    }),
                };
                (_a = result.graphs) === null || _a === void 0 ? void 0 : _a.push(graph);
            });
        }
    }
    else if (columns[xIndex]) {
        result.graphs = [
            {
                data: rows.map(() => {
                    return null;
                }),
            },
        ];
    }
    else {
        result.graphs = [];
    }
    return result;
};
