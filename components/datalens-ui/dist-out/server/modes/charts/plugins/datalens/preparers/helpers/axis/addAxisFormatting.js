"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAxisFormatting = void 0;
const get_axis_formatting_1 = require("./get-axis-formatting");
const addAxisFormatting = (arrToPush, visualizationId, placeholder) => {
    var _a;
    const formatMode = (_a = placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings) === null || _a === void 0 ? void 0 : _a.axisFormatMode;
    if (formatMode && formatMode !== "auto" /* AxisLabelFormatMode.Auto */) {
        const formatting = (0, get_axis_formatting_1.getAxisChartkitFormatting)(placeholder, visualizationId);
        if (formatting) {
            arrToPush.push(formatting);
        }
    }
};
exports.addAxisFormatting = addAxisFormatting;
