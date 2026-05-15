"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../shared");
const constants_1 = require("../../../../../../constants");
const misc_helpers_1 = require("../../utils/misc-helpers");
const basic_1 = require("./variants/basic");
const markup_1 = require("./variants/markup");
function prepareMetric({ placeholders, resultData, shared, idToTitle, colorsConfig, defaultColorPaletteId, }) {
    var _a;
    const { data, order } = resultData;
    const measure = placeholders[0].items[0];
    if (typeof measure === 'undefined') {
        return {};
    }
    const measureActualTitle = idToTitle[measure.guid];
    const measureIndex = (0, misc_helpers_1.findIndexInOrder)(order, measure, measureActualTitle);
    const value = data[0][measureIndex];
    if (typeof value === 'undefined' || value === null) {
        return {};
    }
    const useMarkup = (0, shared_1.isMarkupItem)(value);
    const currentPalette = (0, constants_1.selectServerPalette)({
        palette: (_a = shared.extraSettings) === null || _a === void 0 ? void 0 : _a.metricFontColorPalette,
        availablePalettes: colorsConfig.availablePalettes,
        customColorPalettes: colorsConfig.loadedColorPalettes,
        defaultColorPaletteId,
    });
    if (useMarkup) {
        return (0, markup_1.prepareMarkupMetricVariant)({
            measure,
            value,
            extraSettings: shared.extraSettings,
            currentPalette,
        });
    }
    else {
        return (0, basic_1.prepareBasicMetricVariant)({
            measure,
            value,
            extraSettings: shared.extraSettings,
            currentPalette,
        });
    }
}
exports.default = prepareMetric;
