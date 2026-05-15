"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV4ConfigToV5 = void 0;
const types_1 = require("../../../../types");
const utils_1 = require("../../../../utils");
const helpers_1 = require("../../../helpers");
const wizard_helpers_1 = require("../../../wizard-helpers");
const mapV4PlaceholderToV5Placeholder = ({ placeholder, sharedData, sort, visualizationId, }) => {
    var _a;
    const v5Placeholder = { ...placeholder };
    const isPlaceholderWithAxisMode = (0, wizard_helpers_1.isPlaceholderSupportsAxisMode)(placeholder.id, visualizationId);
    const sortHasMeasure = sort.some(helpers_1.isMeasureField);
    v5Placeholder.items = (placeholder.items || []).map((rawField, index) => {
        let field = rawField;
        if (field.data_type === types_1.DATASET_FIELD_TYPES.HIERARCHY &&
            field.fields &&
            (sharedData === null || sharedData === void 0 ? void 0 : sharedData.metaHierarchy) &&
            sharedData.metaHierarchy[v5Placeholder.id] &&
            sharedData.metaHierarchy[v5Placeholder.id].hierarchyIndex === index) {
            const currentPlaceholderHierarchyMeta = sharedData.metaHierarchy[v5Placeholder.id];
            field = field.fields[currentPlaceholderHierarchyMeta.hierarchyFieldIndex];
        }
        if (field.dateMode) {
            if (isPlaceholderWithAxisMode &&
                // Axis mode always depends on first item in placeholder
                index === 0) {
                v5Placeholder.settings = {
                    ...v5Placeholder.settings,
                    axisMode: sortHasMeasure ? "discrete" /* AxisMode.Discrete */ : field.dateMode,
                };
            }
            delete field.dateMode;
        }
        return field;
    });
    if (!((_a = v5Placeholder.settings) === null || _a === void 0 ? void 0 : _a.axisMode) && isPlaceholderWithAxisMode) {
        const firstPlaceholderItem = v5Placeholder.items[0];
        if ((0, wizard_helpers_1.isAllAxisModesAvailable)(firstPlaceholderItem) && !sortHasMeasure) {
            v5Placeholder.settings = {
                ...v5Placeholder.settings,
                axisMode: "continuous" /* AxisMode.Continuous */,
            };
        }
        else {
            v5Placeholder.settings = {
                ...v5Placeholder.settings,
                axisMode: "discrete" /* AxisMode.Discrete */,
            };
        }
    }
    return v5Placeholder;
};
const mapV4ConfigToV5 = (config, sharedData) => {
    const v5Visualization = {
        ...config.visualization,
    };
    if ((0, utils_1.isVisualizationWithLayers)(config.visualization)) {
        v5Visualization.layers = (v5Visualization.layers || []).map((layer) => {
            return {
                ...layer,
                placeholders: layer.placeholders.map((placeholder) => {
                    return mapV4PlaceholderToV5Placeholder({
                        sharedData: sharedData,
                        placeholder,
                        sort: config.sort,
                        visualizationId: layer.id,
                    });
                }),
            };
        });
    }
    else if (config.visualization.placeholders) {
        v5Visualization.placeholders = config.visualization.placeholders.map((placeholder) => mapV4PlaceholderToV5Placeholder({
            placeholder,
            sort: config.sort,
            visualizationId: config.visualization.id,
            sharedData,
        }));
    }
    return {
        ...config,
        visualization: v5Visualization,
        version: types_1.ChartsConfigVersion.V5,
    };
};
exports.mapV4ConfigToV5 = mapV4ConfigToV5;
