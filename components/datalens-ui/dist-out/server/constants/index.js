"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_NAME_DATALENS = exports.WORLD_REGION = exports.BLOCK_STAT = exports.BASE_PROJECT_NAME = exports.DASH_ENTRY_RELEVANT_FIELDS = exports.DASH_DEFAULT_NAMESPACE = exports.CHARTS_API_BASE_URL = exports.DASH_API_BASE_URL = exports.selectServerPalette = void 0;
const DASH_API_BASE_URL = '/api/dash/v1/dashboards';
exports.DASH_API_BASE_URL = DASH_API_BASE_URL;
const CHARTS_API_BASE_URL = '/api/charts/v1/charts';
exports.CHARTS_API_BASE_URL = CHARTS_API_BASE_URL;
const DASH_DEFAULT_NAMESPACE = 'default';
exports.DASH_DEFAULT_NAMESPACE = DASH_DEFAULT_NAMESPACE;
const DASH_ENTRY_RELEVANT_FIELDS = [
    'entryId',
    'data',
    'key',
    'links',
    'meta',
    'permissions',
    'scope',
    'type',
    'public',
    'isFavorite',
    'annotation',
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
    'revId',
    'savedId',
    'publishedId',
    'workbookId',
];
exports.DASH_ENTRY_RELEVANT_FIELDS = DASH_ENTRY_RELEVANT_FIELDS;
const BASE_PROJECT_NAME = 'datalens';
exports.BASE_PROJECT_NAME = BASE_PROJECT_NAME;
const BLOCK_STAT = {
    RU: '28',
    DATALENS: '3995',
    EXTERNAL: '1105',
    INTERNAL: '1649',
    UI: '2819',
    SERVER: '2443',
};
exports.BLOCK_STAT = BLOCK_STAT;
const WORLD_REGION = 10000;
exports.WORLD_REGION = WORLD_REGION;
// if the palette is not specified or not found, it returns the default palette
const selectServerPalette = (args) => {
    var _a, _b;
    const { defaultColorPaletteId, palette: selectedPalleteId, availablePalettes, customColorPalettes, } = args;
    if (selectedPalleteId) {
        if (customColorPalettes === null || customColorPalettes === void 0 ? void 0 : customColorPalettes[selectedPalleteId]) {
            return customColorPalettes[selectedPalleteId].colors;
        }
        if (availablePalettes === null || availablePalettes === void 0 ? void 0 : availablePalettes[selectedPalleteId]) {
            return availablePalettes[selectedPalleteId].scheme;
        }
    }
    if (customColorPalettes === null || customColorPalettes === void 0 ? void 0 : customColorPalettes[defaultColorPaletteId]) {
        return customColorPalettes[defaultColorPaletteId].colors;
    }
    return (_b = (_a = availablePalettes === null || availablePalettes === void 0 ? void 0 : availablePalettes[defaultColorPaletteId]) === null || _a === void 0 ? void 0 : _a.scheme) !== null && _b !== void 0 ? _b : [];
};
exports.selectServerPalette = selectServerPalette;
const SERVICE_NAME_DATALENS = 'DataLens';
exports.SERVICE_NAME_DATALENS = SERVICE_NAME_DATALENS;
