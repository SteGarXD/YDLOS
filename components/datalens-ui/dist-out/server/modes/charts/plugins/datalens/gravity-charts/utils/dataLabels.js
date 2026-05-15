"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedLabel = getFormattedLabel;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
function getFormattedLabel(value, labelField) {
    if (!labelField || typeof value === 'undefined') {
        return undefined;
    }
    if ((0, shared_1.isNumberField)(labelField)) {
        return (0, misc_helpers_1.chartKitFormatNumberWrapper)(value, {
            lang: 'ru',
            ...(0, shared_1.getFormatOptions)(labelField),
        });
    }
    return String(value);
}
