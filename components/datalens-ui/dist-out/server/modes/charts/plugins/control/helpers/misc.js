"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISO = getISO;
exports.getISOFromToday = getISOFromToday;
exports.formatRelativeRangeDate = formatRelativeRangeDate;
exports.formatIntervalRangeDate = formatIntervalRangeDate;
const misc_1 = require("../constants/misc");
function getISO(date) {
    return date.toISOString();
}
function getISOFromToday(daysOffset = 0) {
    return getISO(new Date(Date.now() - daysOffset * misc_1.DAY));
}
function formatRelativeRangeDate(value) {
    const { from, to } = value;
    const fromDate = getISOFromToday(Number(from));
    const toDate = getISOFromToday(Number(to));
    return fromDate && toDate ? `__interval_${fromDate}_${toDate}` : '';
}
function formatIntervalRangeDate(value) {
    const { from, to } = value;
    const fromDate = from ? from : '0001-01-01';
    const toDate = to ? to : '9999-12-31';
    return fromDate && toDate ? `__interval_${fromDate}_${toDate}` : '';
}
