"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVisualizationWithLayers = isVisualizationWithLayers;
exports.mapStringToCoordinates = mapStringToCoordinates;
exports.validateCoordinatesValue = validateCoordinatesValue;
const constants_1 = require("../constants");
function isVisualizationWithLayers(visualization) {
    return [constants_1.WizardVisualizationId.Geolayer, constants_1.WizardVisualizationId.CombinedChart].includes(visualization === null || visualization === void 0 ? void 0 : visualization.id);
}
function mapStringToCoordinates(value) {
    return value.split(',').reduce((acc, val) => {
        const res = Number(val);
        if (!Number.isNaN(res)) {
            acc.push(res);
        }
        return acc;
    }, []);
}
function validateCoordinatesValue(value) {
    let coordinates = [];
    try {
        coordinates = mapStringToCoordinates(value);
    }
    catch (e) {
        return false;
    }
    return coordinates.length === 2;
}
