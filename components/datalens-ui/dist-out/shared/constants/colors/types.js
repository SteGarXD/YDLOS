"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PALETTE_ID = exports.TABLEAU_PALETTE_ID = exports.COMMON_PALETTE_ID = exports.GRADIENT_PALETTE_ID = exports.AUTO_PALETTE_ID = void 0;
exports.AUTO_PALETTE_ID = 'auto';
exports.GRADIENT_PALETTE_ID = {
    EMERALD_20: 'emerald20',
    GOLDEN_20: 'golden20',
    NEUTRAL_20: 'neutral20',
    OCEANIC_20: 'oceanic20',
    TRAFFIC_LIGHT_9: 'traffic-light9',
};
exports.COMMON_PALETTE_ID = {
    CLASSIC_20: 'classic20',
    DEFAULT_20: 'default20',
    DATALENS_NEO_20: 'datalens-neo-20',
    ...exports.GRADIENT_PALETTE_ID,
};
exports.TABLEAU_PALETTE_ID = {
    BLUE_RED_6: 'Blue-Red 6',
    BLUE_RED_12: 'Blue-Red 12',
    COLOR_BLIND_10: 'Color-Blind 10',
    GRAY_5: 'Gray 5',
    GREEN_ORANGE_6: 'Green-Orange 6',
    GREEN_ORANGE_12: 'Green-Orange 12',
    PURPURE_GRAY_6: 'Purpure-Gray 6',
    PURPURE_GRAY_12: 'Purpure-Gray 12',
    TABLEAU_10_LIGHT: 'Tableau 10 Light',
    TABLEAU_10_MEDIUM: 'Tableau 10 Medium',
    TABLEAU_10: 'Tableau 10',
    TABLEAU_20: 'Tableau 20',
    TRAFFIC_LIGHT: 'Traffic Light',
};
exports.PALETTE_ID = {
    AUTO_PALETTE_ID: exports.AUTO_PALETTE_ID,
    ...exports.COMMON_PALETTE_ID,
    ...exports.TABLEAU_PALETTE_ID,
};
