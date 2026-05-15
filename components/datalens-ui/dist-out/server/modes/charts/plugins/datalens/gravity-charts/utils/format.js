"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldFormatOptions = getFieldFormatOptions;
const shared_1 = require("../../../../../../../shared");
function getFieldFormatOptions({ field }) {
    if ((0, shared_1.isNumberField)(field)) {
        const fieldFormatting = (0, shared_1.getFormatOptions)(field);
        const labelFormat = (fieldFormatting === null || fieldFormatting === void 0 ? void 0 : fieldFormatting.labelMode) === 'percent' ? 'percent' : fieldFormatting === null || fieldFormatting === void 0 ? void 0 : fieldFormatting.format;
        return {
            type: 'number',
            ...fieldFormatting,
            format: labelFormat,
        };
    }
    if ((0, shared_1.isDateField)(field)) {
        return {
            type: 'date',
            format: field.format,
        };
    }
    return undefined;
}
