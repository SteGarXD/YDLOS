"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUnknownTypeValue = formatUnknownTypeValue;
exports.renderValue = renderValue;
exports.parseNumberValue = parseNumberValue;
exports.parseNumberValueForTable = parseNumberValueForTable;
function formatUnknownTypeValue(value) {
    if (value === null) {
        return null;
    }
    return JSON.stringify(value);
}
function renderValue(value) {
    if (value === null) {
        return 'null';
    }
    return value;
}
function parseNumberValue(value) {
    let result;
    if (value === null) {
        result = null;
    }
    else if (value === '-inf') {
        result = -Infinity;
    }
    else if (value === 'inf') {
        result = Infinity;
    }
    else if (value === 'nan') {
        result = NaN;
    }
    else {
        result = Number(value);
    }
    return result;
}
function parseNumberValueForTable(value) {
    let result;
    if (value === null) {
        result = null;
    }
    else if (value === '-inf') {
        result = '-Infinity';
    }
    else if (value === 'inf') {
        result = 'Infinity';
    }
    else if (value === 'nan') {
        result = 'NaN';
    }
    else {
        result = Number(value);
    }
    return result;
}
