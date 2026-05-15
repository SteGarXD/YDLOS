"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAxisFormatter = void 0;
const shared_1 = require("../../../../../../../../shared");
const getAxisType_1 = require("./getAxisType");
const isAxisLabelDateFormat_1 = require("./isAxisLabelDateFormat");
const addAxisFormatter = (props) => {
    var _a, _b, _c;
    const { axisConfig, otherwiseFormatter, chartConfig, placeholder } = props;
    if (!axisConfig || !placeholder) {
        return;
    }
    const field = (_a = placeholder === null || placeholder === void 0 ? void 0 : placeholder.items) === null || _a === void 0 ? void 0 : _a[0];
    const axisMode = chartConfig ? (0, shared_1.getXAxisMode)({ config: chartConfig }) : undefined;
    const axisType = (0, getAxisType_1.getAxisType)({
        field: field,
        settings: placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings,
        axisMode: axisMode,
    });
    const axisLabelDateFormat = (0, isAxisLabelDateFormat_1.isAxisLabelDateFormat)(placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings, field, axisType);
    const formatter = axisLabelDateFormat
        ? shared_1.ChartkitHandlers.WizardDatetimeAxisFormatter
        : otherwiseFormatter;
    const format = axisLabelDateFormat ? (_b = placeholder === null || placeholder === void 0 ? void 0 : placeholder.settings) === null || _b === void 0 ? void 0 : _b.axisLabelDateFormat : undefined;
    axisConfig.labels = {
        ...((_c = axisConfig.labels) !== null && _c !== void 0 ? _c : {}),
        formatter,
        format,
    };
};
exports.addAxisFormatter = addAxisFormatter;
