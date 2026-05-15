"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTitle = getTitle;
const shared_1 = require("../../../../../../../shared");
function getTitle(extraSettings, field) {
    const mode = extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.indicatorTitleMode;
    switch (mode) {
        case "hide" /* IndicatorTitleMode.Hide */: {
            return '';
        }
        case "manual" /* IndicatorTitleMode.Manual */: {
            return (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.title) || '';
        }
        case "by-field" /* IndicatorTitleMode.ByField */:
        default: {
            return (0, shared_1.getFakeTitleOrTitle)(field);
        }
    }
}
