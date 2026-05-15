"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAxisChartkitFormatting = exports.getAxisFormatting = void 0;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
const getAxisFormatting = ({ placeholder, visualizationId, }) => {
    var _a, _b, _c, _d, _e;
    const field = (_a = placeholder === null || placeholder === void 0 ? void 0 : placeholder.items) === null || _a === void 0 ? void 0 : _a[0];
    if (!field || !(0, shared_1.isNumberField)(field)) {
        return undefined;
    }
    if ((0, shared_1.isPercentVisualization)(visualizationId)) {
        return undefined;
    }
    switch ((_b = placeholder.settings) === null || _b === void 0 ? void 0 : _b.axisFormatMode) {
        case "by-field" /* AxisLabelFormatMode.ByField */:
            return (_c = (0, shared_1.getFormatOptions)(field)) !== null && _c !== void 0 ? _c : {};
        case "manual" /* AxisLabelFormatMode.Manual */:
            return (_e = (_d = placeholder.settings) === null || _d === void 0 ? void 0 : _d.axisLabelFormating) !== null && _e !== void 0 ? _e : {};
        default:
            return null;
    }
};
exports.getAxisFormatting = getAxisFormatting;
const getAxisChartkitFormatting = (placeholder, visualizationId) => {
    var _a;
    const axisFormatting = (0, exports.getAxisFormatting)({ placeholder, visualizationId });
    if (axisFormatting) {
        const field = (_a = placeholder === null || placeholder === void 0 ? void 0 : placeholder.items) === null || _a === void 0 ? void 0 : _a[0];
        return (0, misc_helpers_1.getFormatOptionsFromFieldFormatting)(axisFormatting, field === null || field === void 0 ? void 0 : field.data_type);
    }
    return undefined;
};
exports.getAxisChartkitFormatting = getAxisChartkitFormatting;
