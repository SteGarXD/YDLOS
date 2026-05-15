"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAxisType = getAxisType;
const shared_1 = require("../../../../../../../../shared");
function getAxisType(args) {
    var _a;
    const { field, settings } = args;
    let axisMode = args.axisMode;
    if (!axisMode && (field === null || field === void 0 ? void 0 : field.guid)) {
        axisMode = (_a = settings === null || settings === void 0 ? void 0 : settings.axisModeMap) === null || _a === void 0 ? void 0 : _a[field.guid];
    }
    if (axisMode !== "discrete" /* AxisMode.Discrete */) {
        if ((0, shared_1.isDateField)(field)) {
            return 'datetime';
        }
        if ((0, shared_1.isNumberField)(field)) {
            return (settings === null || settings === void 0 ? void 0 : settings.type) === 'logarithmic' ? 'logarithmic' : 'linear';
        }
    }
    if (field) {
        return 'category';
    }
    return undefined;
}
