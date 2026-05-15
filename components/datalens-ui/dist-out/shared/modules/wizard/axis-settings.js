"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAxisNullsSettings = getAxisNullsSettings;
const constants_1 = require("../../constants");
function getAxisNullsSettings(value, visualizationId) {
    const isArea = visualizationId === constants_1.WizardVisualizationId.Area ||
        visualizationId === constants_1.WizardVisualizationId.Area100p;
    const defaultValue = isArea ? "as-0" /* AxisNullsMode.AsZero */ : "connect" /* AxisNullsMode.Connect */;
    const isCurrentValueValid = value && !(value === "use-previous" /* AxisNullsMode.UsePrevious */ && !isArea);
    if (isCurrentValueValid) {
        return value;
    }
    return defaultValue;
}
