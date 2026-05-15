"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAxisLabelDateFormat = void 0;
const shared_1 = require("../../../../../../../../shared");
const isAxisLabelDateFormat = (settings, field, axisType) => {
    const { axisFormatMode, axisLabelDateFormat } = settings || {};
    return (axisFormatMode === "manual" /* AxisLabelFormatMode.Manual */ &&
        (0, shared_1.isDateField)(field) &&
        axisType === 'datetime' &&
        axisLabelDateFormat);
};
exports.isAxisLabelDateFormat = isAxisLabelDateFormat;
