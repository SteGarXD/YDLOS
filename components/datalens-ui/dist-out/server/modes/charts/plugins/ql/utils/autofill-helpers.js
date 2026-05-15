"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autofillTableVisualization = exports.autofillTreemapVisualization = exports.autofillMetricVisualization = exports.autofillPieVisualization = exports.autofillScatterVisualization = exports.autofillLineVisualization = void 0;
const shared_1 = require("../../../../../../shared");
const colors_1 = require("./colors");
const autofillLineVisualization = ({ fields, distinctsMap, }) => {
    const yIndexes = [];
    const findNewYIndex = () => fields.findIndex((column, index) => (column.cast === shared_1.DATASET_FIELD_TYPES.INTEGER ||
        column.cast === shared_1.DATASET_FIELD_TYPES.FLOAT) &&
        !yIndexes.includes(index));
    let newFoundYIndex = findNewYIndex();
    while (newFoundYIndex > -1) {
        yIndexes.push(newFoundYIndex);
        newFoundYIndex = findNewYIndex();
    }
    const xIndex = fields.findIndex((_column, index) => !yIndexes.includes(index));
    let xFields = [];
    if (xIndex > -1) {
        xFields = [fields[xIndex]];
    }
    const yFields = [];
    yIndexes.forEach((index) => {
        yFields.push(fields[index]);
    });
    return {
        xFields,
        yFields,
        colors: (0, colors_1.getColorFieldsFromDistincts)(distinctsMap, fields, [...xFields, ...yFields]),
    };
};
exports.autofillLineVisualization = autofillLineVisualization;
const autofillScatterVisualization = ({ fields }) => {
    const xIndex = fields.findIndex((column) => column.cast === shared_1.DATASET_FIELD_TYPES.INTEGER ||
        column.cast === shared_1.DATASET_FIELD_TYPES.FLOAT);
    const yIndex = fields.findIndex((column, i) => (column.cast === shared_1.DATASET_FIELD_TYPES.INTEGER ||
        column.cast === shared_1.DATASET_FIELD_TYPES.FLOAT) &&
        i !== xIndex);
    const pointsIndex = fields.findIndex((_column, i) => i !== xIndex && i !== yIndex);
    let xFields = [];
    let yFields = [];
    let pointsFields = [];
    if (xIndex > -1) {
        xFields = [fields[xIndex]];
    }
    if (yIndex > -1) {
        yFields = [fields[yIndex]];
    }
    if (pointsIndex > -1) {
        pointsFields = [fields[pointsIndex]];
    }
    return {
        xFields,
        yFields,
        pointsFields,
    };
};
exports.autofillScatterVisualization = autofillScatterVisualization;
const autofillPieVisualization = ({ fields }) => {
    const measureIndex = fields.findIndex((field) => field.cast === shared_1.DATASET_FIELD_TYPES.INTEGER || field.cast === shared_1.DATASET_FIELD_TYPES.FLOAT);
    const colorIndex = fields.findIndex((_field, index) => index !== measureIndex);
    let colorFields = [];
    let measureFields = [];
    if (colorIndex > -1) {
        colorFields = [fields[colorIndex]];
    }
    if (measureIndex > -1) {
        measureFields = [fields[measureIndex]];
    }
    return {
        colorFields,
        measureFields,
    };
};
exports.autofillPieVisualization = autofillPieVisualization;
const autofillMetricVisualization = ({ fields }) => {
    // First of all, we need to find some numeric value for metric
    let measureIndex = fields.findIndex((field) => field.cast === shared_1.DATASET_FIELD_TYPES.INTEGER || field.cast === shared_1.DATASET_FIELD_TYPES.FLOAT);
    // If there is no such value, then we will use any other available value
    if (measureIndex === -1 && fields.length > 0) {
        measureIndex = 0;
    }
    let measureFields = [];
    if (measureIndex > -1) {
        measureFields = [fields[measureIndex]];
    }
    return {
        measureFields,
    };
};
exports.autofillMetricVisualization = autofillMetricVisualization;
const autofillTreemapVisualization = ({ fields }) => {
    const sizeIndex = fields.findIndex((field) => field.cast === shared_1.DATASET_FIELD_TYPES.INTEGER || field.cast === shared_1.DATASET_FIELD_TYPES.FLOAT);
    const dimensionIndex = fields.findIndex((_field, index) => index !== sizeIndex);
    let dimensionFields = [];
    let sizeFields = [];
    if (dimensionIndex > -1) {
        dimensionFields = [fields[dimensionIndex]];
    }
    if (sizeIndex > -1) {
        sizeFields = [fields[sizeIndex]];
    }
    return {
        dimensionFields,
        sizeFields,
    };
};
exports.autofillTreemapVisualization = autofillTreemapVisualization;
const autofillTableVisualization = ({ fields }) => {
    const columnFields = fields.filter((column) => column.type !== shared_1.DatasetFieldType.Pseudo);
    return {
        columnFields,
    };
};
exports.autofillTableVisualization = autofillTableVisualization;
