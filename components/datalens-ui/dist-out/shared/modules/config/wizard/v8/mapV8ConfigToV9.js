"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV8ConfigToV9 = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const mapV8ConfigToV9 = (config) => {
    var _a, _b;
    let shapes = config.shapes;
    if (((_a = config === null || config === void 0 ? void 0 : config.visualization) === null || _a === void 0 ? void 0 : _a.id) === constants_1.WizardVisualizationId.Scatter) {
        const colorField = (_b = config.colors) === null || _b === void 0 ? void 0 : _b[0];
        if ((colorField === null || colorField === void 0 ? void 0 : colorField.type) === types_1.DatasetFieldType.Dimension) {
            shapes = [colorField];
        }
    }
    return {
        ...config,
        shapes,
        version: types_1.ChartsConfigVersion.V9,
    };
};
exports.mapV8ConfigToV9 = mapV8ConfigToV9;
