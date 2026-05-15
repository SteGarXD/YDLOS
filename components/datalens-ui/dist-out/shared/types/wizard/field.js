"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFieldHierarchy = void 0;
exports.isIntegerField = isIntegerField;
exports.isFloatField = isFloatField;
exports.isStringField = isStringField;
exports.isMarkdownField = isMarkdownField;
exports.isHtmlField = isHtmlField;
exports.isNumberField = isNumberField;
exports.isMarkupDataType = isMarkupDataType;
exports.isMarkupField = isMarkupField;
exports.isUnsupportedDataType = isUnsupportedDataType;
exports.isUnsupportedField = isUnsupportedField;
exports.isDateType = isDateType;
exports.isDateField = isDateField;
const charts_1 = require("../charts");
const dataset_1 = require("../dataset");
function isIntegerField(field) {
    return ((field === null || field === void 0 ? void 0 : field.data_type) === dataset_1.DATASET_FIELD_TYPES.INTEGER ||
        (field === null || field === void 0 ? void 0 : field.data_type) === dataset_1.DATASET_FIELD_TYPES.UINTEGER);
}
function isFloatField(field) {
    return field.data_type === dataset_1.DATASET_FIELD_TYPES.FLOAT;
}
function isStringField(field) {
    return field.data_type === dataset_1.DATASET_FIELD_TYPES.STRING;
}
function isMarkdownField(field) {
    return Boolean(field && isStringField(field) && field.markupType === charts_1.MARKUP_TYPE.markdown);
}
function isHtmlField(field) {
    return Boolean(field && isStringField(field) && field.markupType === charts_1.MARKUP_TYPE.html);
}
function isNumberField(field) {
    return Boolean(field && (isIntegerField(field) || isFloatField(field)));
}
function isMarkupDataType(dataType) {
    return dataType === dataset_1.DATASET_FIELD_TYPES.MARKUP;
}
function isMarkupField(field) {
    return Boolean(field && isMarkupDataType(field.data_type));
}
function isUnsupportedDataType(dataType) {
    return dataType === dataset_1.DATASET_FIELD_TYPES.UNSUPPORTED;
}
function isUnsupportedField(field) {
    return Boolean(field && isUnsupportedDataType(field.data_type));
}
function isDateType(dataType) {
    return Boolean(dataType === dataset_1.DATASET_FIELD_TYPES.DATE ||
        dataType === 'datetime' ||
        dataType === dataset_1.DATASET_FIELD_TYPES.GENERICDATETIME ||
        dataType === dataset_1.DATASET_FIELD_TYPES.DATETIMETZ);
}
function isDateField(field) {
    return Boolean(field && isDateType(field === null || field === void 0 ? void 0 : field.data_type));
}
const isFieldHierarchy = (field) => (field === null || field === void 0 ? void 0 : field.data_type) === dataset_1.DATASET_FIELD_TYPES.HIERARCHY;
exports.isFieldHierarchy = isFieldHierarchy;
