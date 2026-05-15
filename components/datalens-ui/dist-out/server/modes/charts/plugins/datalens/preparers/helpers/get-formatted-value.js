"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedValue = getFormattedValue;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
function getFormattedValue(field, value) {
    if ((0, shared_1.isDateField)(field)) {
        return (0, misc_helpers_1.formatDate)({
            valueType: field.data_type,
            value: value,
            format: field.format,
        });
    }
    if ((0, shared_1.isNumberField)(field)) {
        return (0, misc_helpers_1.chartKitFormatNumberWrapper)(value, {
            lang: 'ru',
            ...(0, shared_1.getFormatOptions)(field),
        });
    }
    return value;
}
