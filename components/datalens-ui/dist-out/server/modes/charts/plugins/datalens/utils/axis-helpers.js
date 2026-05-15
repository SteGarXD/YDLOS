"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlaceholderSettingsToAxis = void 0;
exports.getAxisTitle = getAxisTitle;
exports.isGridEnabled = isGridEnabled;
exports.getTickPixelInterval = getTickPixelInterval;
const shared_1 = require("../../../../../../shared");
const misc_helpers_1 = require("./misc-helpers");
function getAxisTitle(placeholderSettings, field) {
    switch (placeholderSettings.title) {
        case 'auto': {
            if (field) {
                return (0, misc_helpers_1.getOriginalTitleOrTitle)(field);
            }
            return undefined;
        }
        case 'manual': {
            return placeholderSettings.titleValue;
        }
        case 'off': {
            return null;
        }
        default: {
            return undefined;
        }
    }
}
function isGridEnabled(placeholderSettings) {
    return (placeholderSettings === null || placeholderSettings === void 0 ? void 0 : placeholderSettings.grid) !== 'off';
}
function getTickPixelInterval(placeholderSettings) {
    if (placeholderSettings.grid === 'on' && placeholderSettings.gridStep === 'manual') {
        return placeholderSettings.gridStepValue;
    }
    return undefined;
}
// eslint-disable-next-line complexity
const applyPlaceholderSettingsToAxis = (placeholder, axis, ignore) => {
    var _a;
    if (placeholder && placeholder.settings) {
        // Setting 0-max for y1
        // min-max is already there by default!
        // Including support for the old autoscale flag === false
        if (placeholder.settings.autoscale === false ||
            (placeholder.settings.scale === 'auto' && placeholder.settings.scaleValue === '0-max')) {
            if (placeholder.settings.type === 'logarithmic') {
                // Fallback to null for incorrect case
                axis.min = null;
            }
            else {
                axis.min = 0;
            }
        }
        else if (placeholder.settings.scale === 'manual') {
            axis.endOnTick = false;
            const minValue = Number(placeholder.settings.scaleValue[0]);
            const maxValue = Number(placeholder.settings.scaleValue[1]);
            if (placeholder.settings.type !== 'logarithmic' || 0 < minValue) {
                axis.min = minValue;
            }
            if (placeholder.settings.type !== 'logarithmic' || 0 < maxValue) {
                axis.max = maxValue;
            }
        }
        const axisTitle = getAxisTitle(placeholder.settings, placeholder.items[0]);
        if (!ignore.title && typeof axisTitle !== 'undefined') {
            axis.title = { text: axisTitle };
        }
        if ((0, shared_1.isDateField)(placeholder.items[0])) {
            axis.type = 'datetime';
        }
        else {
            axis.type = placeholder.settings.type === 'logarithmic' ? 'logarithmic' : 'linear';
        }
        if (!isGridEnabled(placeholder.settings)) {
            axis.gridLineWidth = 0;
            axis.minorGridLineWidth = 0;
        }
        if (((_a = placeholder.settings) === null || _a === void 0 ? void 0 : _a.axisVisibility) === 'hide') {
            axis.visible = false;
        }
        const tickPixelInterval = getTickPixelInterval(placeholder.settings);
        if (tickPixelInterval) {
            axis.tickPixelInterval = tickPixelInterval;
        }
        // We put the logarithmic type for the y axis
        // The linear type is there and so by default
        if (placeholder.settings.hideLabels === 'yes') {
            axis.labels = {
                ...(axis.labels || {}),
                enabled: false,
            };
        }
        else if (placeholder.settings.hideLabels === 'no') {
            axis.labels = {
                ...(axis.labels || {}),
                enabled: true,
            };
        }
        // We put the logarithmic type for the y axis
        // The linear type is there and so by default
        if (placeholder.settings.labelsView === 'horizontal') {
            axis.labels = {
                ...(axis.labels || {}),
                rotation: 0,
            };
        }
        else if (placeholder.settings.labelsView === 'vertical') {
            axis.labels = {
                ...(axis.labels || {}),
                rotation: 90,
                x: -3,
            };
        }
        else if (placeholder.settings.labelsView === 'angle') {
            axis.labels = {
                ...(axis.labels || {}),
                rotation: 45,
                y: 20,
                x: -3,
            };
        }
    }
};
exports.applyPlaceholderSettingsToAxis = applyPlaceholderSettingsToAxis;
