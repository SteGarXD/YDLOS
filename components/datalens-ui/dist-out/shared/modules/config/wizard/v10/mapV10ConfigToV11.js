"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV10ConfigToV11 = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const mapV10ConfigToV11 = (config) => {
    var _a;
    let extraSettings = config.extraSettings;
    if (((_a = config.visualization) === null || _a === void 0 ? void 0 : _a.id) === constants_1.WizardVisualizationId.Metric) {
        extraSettings = { ...config.extraSettings };
        if (extraSettings.titleMode === 'show' && extraSettings.title) {
            extraSettings.indicatorTitleMode = "manual" /* IndicatorTitleMode.Manual */;
        }
        else {
            extraSettings.indicatorTitleMode = "by-field" /* IndicatorTitleMode.ByField */;
        }
    }
    return {
        ...config,
        extraSettings,
        version: types_1.ChartsConfigVersion.V11,
    };
};
exports.mapV10ConfigToV11 = mapV10ConfigToV11;
