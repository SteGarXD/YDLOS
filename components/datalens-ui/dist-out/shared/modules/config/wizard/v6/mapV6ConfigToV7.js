"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV6ConfigToV7 = void 0;
const lodash_1 = require("lodash");
const types_1 = require("../../../../types");
const utils_1 = require("../../../../utils");
const helpers_1 = require("../../../helpers");
const wizard_helpers_1 = require("../../../wizard-helpers");
const mapV6PlaceholdersToV7Placeholders = (visualizationId, placeholders, sort, sharedData) => {
    const sortHasMeasure = sort.some(helpers_1.isMeasureField);
    return placeholders.map((v6Placeholder) => {
        var _a;
        const v6Settings = v6Placeholder.settings;
        if ((0, wizard_helpers_1.isPlaceholderSupportsAxisMode)(v6Placeholder.id, visualizationId) &&
            (v6Settings === null || v6Settings === void 0 ? void 0 : v6Settings.axisMode)) {
            const firstField = (_a = v6Placeholder.items) === null || _a === void 0 ? void 0 : _a[0];
            if (!firstField) {
                return {
                    ...v6Placeholder,
                    settings: {
                        ...v6Settings,
                        axisModeMap: {},
                    },
                };
            }
            const fieldIsHierarchyByType = (0, types_1.isFieldHierarchy)(firstField);
            const fieldIsHierarchyByMeta = (sharedData === null || sharedData === void 0 ? void 0 : sharedData.metaHierarchy) &&
                sharedData.metaHierarchy[v6Placeholder.id] &&
                sharedData.metaHierarchy[v6Placeholder.id].hierarchyIndex === 0;
            const fieldIsHierarchy = fieldIsHierarchyByType || fieldIsHierarchyByMeta;
            if (fieldIsHierarchy) {
                if (firstField.fields && fieldIsHierarchyByType) {
                    const axisModeByHierarchyField = firstField.fields.reduce((acc, field) => {
                        const isContinuousMode = (0, wizard_helpers_1.isAllAxisModesAvailable)(field) && !sortHasMeasure;
                        if (isContinuousMode) {
                            acc[field.guid] = "continuous" /* AxisMode.Continuous */;
                        }
                        else {
                            acc[field.guid] = "discrete" /* AxisMode.Discrete */;
                        }
                        return acc;
                    }, {});
                    return {
                        ...v6Placeholder,
                        settings: {
                            ...(0, lodash_1.omit)(v6Settings, 'axisMode'),
                            axisModeMap: axisModeByHierarchyField,
                        },
                    };
                }
                else {
                    const isContinuousMode = (0, wizard_helpers_1.isAllAxisModesAvailable)(firstField) && !sortHasMeasure;
                    return {
                        ...v6Placeholder,
                        settings: {
                            ...(0, lodash_1.omit)(v6Settings, 'axisMode'),
                            axisModeMap: {
                                [firstField.guid]: isContinuousMode
                                    ? "continuous" /* AxisMode.Continuous */
                                    : "discrete" /* AxisMode.Discrete */,
                            },
                        },
                    };
                }
            }
            return {
                ...v6Placeholder,
                settings: {
                    ...(0, lodash_1.omit)(v6Settings, 'axisMode'),
                    axisModeMap: {
                        [firstField.guid]: v6Settings.axisMode,
                    },
                },
            };
        }
        return {
            ...v6Placeholder,
            settings: {
                ...(0, lodash_1.omit)(v6Settings, 'axisMode'),
                axisModeMap: undefined,
            },
        };
    });
};
const mapV6ConfigToV7 = (config, sharedData) => {
    let v7Visualization;
    const sort = config.sort;
    if ((0, utils_1.isVisualizationWithLayers)(config.visualization)) {
        v7Visualization = {
            ...config.visualization,
            layers: config.visualization.layers.map((layer) => {
                return {
                    ...layer,
                    placeholders: mapV6PlaceholdersToV7Placeholders(layer.id, layer.placeholders, sort, sharedData),
                };
            }),
        };
    }
    else {
        const placeholders = config.visualization.placeholders || [];
        v7Visualization = {
            ...config.visualization,
            layers: undefined,
            placeholders: mapV6PlaceholdersToV7Placeholders(config.visualization.id, placeholders, sort, sharedData),
        };
    }
    return {
        ...config,
        visualization: v7Visualization,
        version: types_1.ChartsConfigVersion.V7,
    };
};
exports.mapV6ConfigToV7 = mapV6ConfigToV7;
