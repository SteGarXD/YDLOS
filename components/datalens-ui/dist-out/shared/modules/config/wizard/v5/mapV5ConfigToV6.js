"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV5ConfigToV6 = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const wizard_helpers_1 = require("../../../wizard-helpers");
const mapV5ConfigToV6 = (config) => {
    const updateSortFields = (config.sort || []).filter((field) => {
        if (config.visualization.id === constants_1.WizardVisualizationId.PivotTable) {
            return !(0, wizard_helpers_1.isMeasureName)(field);
        }
        return true;
    });
    return {
        ...config,
        sort: updateSortFields,
        version: types_1.ChartsConfigVersion.V6,
    };
};
exports.mapV5ConfigToV6 = mapV5ConfigToV6;
