"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSystemPaletteId = exports.getPalettesOrder = exports.getAvailablePalettesMap = exports.selectAvailablePalettes = exports.BASE_PALETTES_MAP = exports.PALETTES = void 0;
const classic_20_1 = __importDefault(require("./common/classic-20"));
const datalens_1 = __importDefault(require("./common/datalens"));
const default_20_1 = __importDefault(require("./common/default-20"));
const emerald_20_1 = __importDefault(require("./common/emerald-20"));
const golden_20_1 = __importDefault(require("./common/golden-20"));
const neutral_20_1 = __importDefault(require("./common/neutral-20"));
const oceanic_20_1 = __importDefault(require("./common/oceanic-20"));
const traffic_light_9_1 = __importDefault(require("./common/traffic-light-9"));
__exportStar(require("./types"), exports);
exports.PALETTES = {
    default20: default_20_1.default,
    classic: classic_20_1.default,
    neutral: neutral_20_1.default,
    golden: golden_20_1.default,
    emerald: emerald_20_1.default,
    oceanic: oceanic_20_1.default,
    trafficLight: traffic_light_9_1.default,
    datalens: datalens_1.default,
};
exports.BASE_PALETTES_MAP = {
    [default_20_1.default.id]: default_20_1.default,
    [classic_20_1.default.id]: classic_20_1.default,
    [emerald_20_1.default.id]: emerald_20_1.default,
    [neutral_20_1.default.id]: neutral_20_1.default,
    [golden_20_1.default.id]: golden_20_1.default,
    [oceanic_20_1.default.id]: oceanic_20_1.default,
    [traffic_light_9_1.default.id]: traffic_light_9_1.default,
    [datalens_1.default.id]: datalens_1.default,
};
const sortPalettes = (palettes, defaultPaletteId) => palettes.sort((a, b) => {
    if (a === defaultPaletteId) {
        return -1;
    }
    if (b === defaultPaletteId) {
        return 1;
    }
    return a.localeCompare(b);
});
const selectAvailablePalettes = ({ palettes, defaultPaletteId, }) => {
    const gradientPalettes = [];
    const colorPalettes = [];
    const datalensPalettes = [];
    const palettesIds = Object.keys(palettes);
    palettesIds.forEach((id) => {
        if (palettes[id].datalens) {
            datalensPalettes.push(id);
        }
        else if (palettes[id].gradient) {
            gradientPalettes.push(id);
        }
        else {
            colorPalettes.push(id);
        }
    });
    return {
        color: [
            ...sortPalettes(datalensPalettes, defaultPaletteId),
            ...sortPalettes(colorPalettes, defaultPaletteId),
        ],
        gradient: sortPalettes(gradientPalettes, defaultPaletteId),
    };
};
exports.selectAvailablePalettes = selectAvailablePalettes;
const getAvailablePalettesMap = () => {
    return exports.BASE_PALETTES_MAP;
};
exports.getAvailablePalettesMap = getAvailablePalettesMap;
const getPalettesOrder = () => {
    return ['color', 'gradient'];
};
exports.getPalettesOrder = getPalettesOrder;
const isSystemPaletteId = (paletteId, palettes) => {
    return Boolean(palettes[paletteId]);
};
exports.isSystemPaletteId = isSystemPaletteId;
