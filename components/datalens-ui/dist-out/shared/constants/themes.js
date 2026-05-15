"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_THEME_CONFIG = exports.DEFAULT_THEME_SETTINGS = exports.CONTRAST_THEME_SETTINGS = exports.ALLOW_THEMES = exports.CONTRAST_THEMES = exports.THEMES = exports.SYSTEM_THEME = exports.DARK_THEME_HC = exports.DARK_THEME = exports.LIGHT_THEME_HC = exports.LIGHT_THEME = void 0;
exports.LIGHT_THEME = 'light';
exports.LIGHT_THEME_HC = 'light-hc';
exports.DARK_THEME = 'dark';
exports.DARK_THEME_HC = 'dark-hc';
exports.SYSTEM_THEME = 'system';
exports.THEMES = [exports.LIGHT_THEME, exports.DARK_THEME];
exports.CONTRAST_THEMES = [exports.LIGHT_THEME_HC, exports.DARK_THEME_HC];
exports.ALLOW_THEMES = [...exports.THEMES, ...exports.CONTRAST_THEMES, exports.SYSTEM_THEME];
exports.CONTRAST_THEME_SETTINGS = {
    systemDarkTheme: exports.DARK_THEME_HC,
    systemLightTheme: exports.LIGHT_THEME_HC,
};
exports.DEFAULT_THEME_SETTINGS = {
    systemDarkTheme: exports.DARK_THEME,
    systemLightTheme: exports.LIGHT_THEME,
};
exports.DEFAULT_THEME_CONFIG = {
    theme: exports.SYSTEM_THEME,
    themeSettings: exports.DEFAULT_THEME_SETTINGS,
};
