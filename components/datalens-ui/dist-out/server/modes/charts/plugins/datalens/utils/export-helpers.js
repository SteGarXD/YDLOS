"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldsExportingOptions = getFieldsExportingOptions;
exports.getFieldExportingOptions = getFieldExportingOptions;
exports.getExportColumnSettings = getExportColumnSettings;
const shared_1 = require("../../../../../../shared");
const misc_helpers_1 = require("./misc-helpers");
function getFieldsExportingOptions(fields) {
    const result = {};
    return Object.keys(fields).reduce((res, key) => {
        res[key] = getFieldExportingOptions(fields[key]);
        return res;
    }, result);
}
function getFieldExportingOptions(field) {
    let format = field === null || field === void 0 ? void 0 : field.format;
    if ((0, shared_1.isDateField)(field) && !format) {
        format = (0, misc_helpers_1.getDefaultDateFormat)(field === null || field === void 0 ? void 0 : field.data_type);
    }
    return {
        title: field ? (0, shared_1.getFakeTitleOrTitle)(field) : undefined,
        dataType: field === null || field === void 0 ? void 0 : field.data_type,
        format,
    };
}
function getExportColumnSettings(args) {
    const { path, field } = args;
    return {
        name: (0, shared_1.getFakeTitleOrTitle)(field),
        formatter: field ? (0, shared_1.getFormatOptions)(field) : {},
        field: path,
        type: (0, shared_1.isNumberField)(field) ? 'number' : 'text',
    };
}
