"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const private_module_1 = __importDefault(require("./private-module"));
const buildLibraryConfig = ({ shared, ChartEditor, }) => {
    return private_module_1.default.buildLibraryConfig({ shared, ChartEditor, features: __features });
};
const buildSources = ({ shared, ChartEditor }) => {
    return private_module_1.default.buildSources({
        shared,
        ChartEditor,
        palettes: __palettes,
        qlConnectionTypeMap: __qlConnectionTypeMap,
        features: __features,
    });
};
const buildGraph = ({ shared, ChartEditor }) => {
    return private_module_1.default.buildGraph({
        shared,
        ChartEditor,
        features: __features,
        palettes: __palettes,
        qlConnectionTypeMap: __qlConnectionTypeMap,
        defaultColorPaletteId: __defaultColorPaletteId,
    });
};
const buildChartConfig = ({ shared, ChartEditor }) => {
    return private_module_1.default.buildChartConfig({ shared, ChartEditor, features: __features });
};
exports.default = {
    buildLibraryConfig,
    buildSources,
    buildGraph,
    buildChartConfig,
    buildD3Config: () => { },
    setConsole: private_module_1.default.setConsole,
};
