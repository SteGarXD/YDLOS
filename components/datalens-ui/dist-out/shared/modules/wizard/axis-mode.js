"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXAxisMode = getXAxisMode;
exports.hasSortThanAffectAxisMode = hasSortThanAffectAxisMode;
const constants_1 = require("../../constants");
const helpers_1 = require("../helpers");
const wizard_helpers_1 = require("../wizard-helpers");
const Y_AS_MAIN_AXIS = [
    constants_1.WizardVisualizationId.Bar,
    constants_1.WizardVisualizationId.Bar100p,
    constants_1.WizardVisualizationId.BarYD3,
    constants_1.WizardVisualizationId.BarY100pD3,
];
function getXPlaceholder(args) {
    const { id, placeholders } = args;
    // Historically, x for a bar chart is y
    return placeholders.find((p) => {
        return Y_AS_MAIN_AXIS.includes(id) ? p.id === constants_1.PlaceholderId.Y : p.id === constants_1.PlaceholderId.X;
    });
}
function getXAxisMode(args) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { config, xField: newXField } = args;
    const layers = (_b = (_a = config.visualization) === null || _a === void 0 ? void 0 : _a.layers) !== null && _b !== void 0 ? _b : [];
    const getVisualizationAxisMode = (visualization) => {
        var _a, _b;
        const { placeholders, xField, sort = [] } = visualization;
        const visualizationId = visualization.id;
        const xPlaceholder = getXPlaceholder({ placeholders, id: visualizationId });
        const field = xField !== null && xField !== void 0 ? xField : xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
        const axisSettings = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings;
        if (!field) {
            return "discrete" /* AxisMode.Discrete */;
        }
        const isContinuousModeRestricted = (0, wizard_helpers_1.isContinuousAxisModeDisabled)({
            field,
            axisSettings,
            visualizationId,
            sort,
        });
        if (isContinuousModeRestricted) {
            return "discrete" /* AxisMode.Discrete */;
        }
        return (_b = (_a = axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.axisModeMap) === null || _a === void 0 ? void 0 : _a[field.guid]) !== null && _b !== void 0 ? _b : "continuous" /* AxisMode.Continuous */;
    };
    if (layers.length) {
        const selectedLayerId = (_c = config.visualization) === null || _c === void 0 ? void 0 : _c.selectedLayerId;
        let xField = newXField;
        if (!xField) {
            const selectedLayer = (_d = layers.find((l) => l.id === selectedLayerId)) !== null && _d !== void 0 ? _d : layers[0];
            const xPlaceholder = getXPlaceholder({
                placeholders: (_e = selectedLayer.placeholders) !== null && _e !== void 0 ? _e : [],
                id: selectedLayer.id,
            });
            xField = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items[0];
        }
        return ((_f = layers.reduce((res, layer) => {
            if (res !== "discrete" /* AxisMode.Discrete */) {
                const layerAxisMode = getVisualizationAxisMode({
                    id: layer.id,
                    placeholders: layer.placeholders,
                    xField,
                    sort: hasSortThanAffectAxisMode(config)
                        ? layer.commonPlaceholders.sort
                        : [],
                });
                return layerAxisMode !== null && layerAxisMode !== void 0 ? layerAxisMode : res;
            }
            return res;
        }, undefined)) !== null && _f !== void 0 ? _f : "continuous" /* AxisMode.Continuous */);
    }
    const visualization = config.visualization;
    return getVisualizationAxisMode({
        id: visualization === null || visualization === void 0 ? void 0 : visualization.id,
        placeholders: (_g = visualization === null || visualization === void 0 ? void 0 : visualization.placeholders) !== null && _g !== void 0 ? _g : [],
        xField: newXField,
        sort: hasSortThanAffectAxisMode(config) ? config.sort : [],
    });
}
function hasSortThanAffectAxisMode(config) {
    var _a;
    if ((_a = config.visualization) === null || _a === void 0 ? void 0 : _a.layers) {
        return config.visualization.layers.some((layer) => {
            const { colors = [], shapes = [], sort = [] } = layer.commonPlaceholders || {};
            return sort.length && ![...colors, ...shapes].some((field) => !(0, helpers_1.isMeasureField)(field));
        });
    }
    const { colors = [], shapes = [], sort = [] } = config || {};
    // There is a grouping of data - continuous axis can be used
    // (sorting will be applied to all other dimensions except x)
    return sort.length && ![...colors, ...shapes].some((field) => !(0, helpers_1.isMeasureField)(field));
}
