"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUseFieldForFiltering = canUseFieldForFiltering;
exports.addActionParamValue = addActionParamValue;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
function canUseFieldForFiltering(field) {
    return (0, shared_1.isDimensionField)(field) && !(0, shared_1.isMarkupField)(field);
}
function addActionParamValue(actionParams, field, value) {
    if (typeof value === 'undefined') {
        return actionParams;
    }
    if (field && canUseFieldForFiltering(field)) {
        let paramValue = String(value);
        if ((0, shared_1.isDateField)(field)) {
            paramValue = (0, misc_helpers_1.formatDate)({
                valueType: field.data_type,
                value: value,
                format: (0, misc_helpers_1.getServerDateFormat)(field.data_type),
            });
        }
        actionParams[field.guid] = paramValue;
    }
    return actionParams;
}
