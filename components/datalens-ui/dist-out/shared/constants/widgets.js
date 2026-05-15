"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROLS_PLACEMENT_MODE = exports.CustomPaletteTextColors = exports.TITLE_WIDGET_TEXT_COLORS_PRESET = exports.WIDGET_BG_COLORS_PRESET = exports.DUPLICATED_WIDGET_BG_COLORS_PRESET = exports.WIDGET_BG_HEAVY_COLORS_PRESET = exports.BASE_GREY_BACKGROUND_COLOR = exports.LIKE_CHART_COLOR_TOKEN = exports.TRANSPARENT_COLOR_HEX = exports.CustomPaletteBgColors = void 0;
exports.isCustomPaletteBgColor = isCustomPaletteBgColor;
exports.getDefaultWidgetBackgroundColor = getDefaultWidgetBackgroundColor;
exports.CustomPaletteBgColors = {
    LIKE_CHART: 'like-chart-bg',
    NONE: 'transparent',
};
exports.TRANSPARENT_COLOR_HEX = '#00000000';
exports.LIKE_CHART_COLOR_TOKEN = 'var(--g-color-base-float)';
exports.BASE_GREY_BACKGROUND_COLOR = 'var(--g-color-base-generic)';
function isCustomPaletteBgColor(color) {
    return Object.values(exports.CustomPaletteBgColors).includes(color);
}
exports.WIDGET_BG_HEAVY_COLORS_PRESET = [
    'var(--g-color-base-info-heavy)',
    'var(--g-color-base-positive-heavy)',
    'var(--g-color-base-warning-heavy)',
    'var(--g-color-base-danger-heavy)',
    'var(--g-color-base-utility-heavy)',
    'var(--g-color-base-misc-heavy)',
    'var(--g-color-base-neutral-heavy)',
    'var(--g-color-base-info-heavy-hover)',
    'var(--g-color-base-positive-heavy-hover)',
    'var(--g-color-base-warning-heavy-hover)',
    'var(--g-color-base-danger-heavy-hover)',
    'var(--g-color-base-utility-heavy-hover)',
    'var(--g-color-base-misc-heavy-hover)',
    'var(--g-color-base-neutral-heavy-hover)',
];
exports.DUPLICATED_WIDGET_BG_COLORS_PRESET = [
    'var(--g-color-base-info-medium)',
    'var(--g-color-base-positive-medium)',
    'var(--g-color-base-warning-medium)',
    'var(--g-color-base-danger-medium)',
    'var(--g-color-base-utility-medium)',
    'var(--g-color-base-misc-medium)',
    'var(--g-color-base-neutral-medium)',
];
exports.WIDGET_BG_COLORS_PRESET = [
    'var(--g-color-base-info-light)',
    'var(--g-color-base-positive-light)',
    'var(--g-color-base-warning-light)',
    'var(--g-color-base-danger-light)',
    'var(--g-color-base-utility-light)',
    'var(--g-color-base-misc-light)',
    'var(--g-color-base-neutral-light)',
    'var(--g-color-base-info-light-hover)',
    'var(--g-color-base-positive-light-hover)',
    'var(--g-color-base-warning-light-hover)',
    'var(--g-color-base-danger-light-hover)',
    'var(--g-color-base-utility-light-hover)',
    'var(--g-color-base-misc-light-hover)',
    'var(--g-color-base-neutral-light-hover)',
    'var(--g-color-base-info-medium-hover)',
    'var(--g-color-base-positive-medium-hover)',
    'var(--g-color-base-warning-medium-hover)',
    'var(--g-color-base-danger-medium-hover)',
    'var(--g-color-base-utility-medium-hover)',
    'var(--g-color-base-misc-medium-hover)',
    'var(--g-color-base-neutral-medium-hover)',
];
exports.TITLE_WIDGET_TEXT_COLORS_PRESET = [
    'var(--g-color-text-info)',
    'var(--g-color-text-positive)',
    'var(--g-color-text-warning)',
    'var(--g-color-text-danger)',
    'var(--g-color-text-utility)',
    'var(--g-color-text-misc)',
    'var(--g-color-text-info-heavy)',
    'var(--g-color-text-positive-heavy)',
    'var(--g-color-text-warning-heavy)',
    'var(--g-color-text-danger-heavy)',
    'var(--g-color-text-utility-heavy)',
    'var(--g-color-text-misc-heavy)',
];
exports.CustomPaletteTextColors = {
    PRIMARY: 'var(--g-color-text-primary)',
    COMPLEMENTARY: 'var(--g-color-text-complementary)',
    SECONDARY: 'var(--g-color-text-secondary)',
    HINT: 'var(--g-color-text-hint)',
    INVERTED_PRIMARY: 'var(--g-color-text-inverted-primary)',
};
exports.CONTROLS_PLACEMENT_MODE = {
    AUTO: 'auto',
    PERCENT: '%',
    PIXELS: 'px',
};
// TODO: replace by DEFAULT_WIDGET_BACKGROUND_COLOR constant after removing flag Feature.EnableCommonChartDashSettings
function getDefaultWidgetBackgroundColor(isCommonChartDashSettingsEnabled, defaultColor = exports.CustomPaletteBgColors.NONE) {
    return isCommonChartDashSettingsEnabled ? '' : defaultColor;
}
