"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUndefinedConfigToV1 = void 0;
const constants_1 = require("../../../../constants");
const versions_1 = require("../../../../types/ql/versions");
const mapUndefinedConfigToV1 = (config) => {
    const isPlaceholdersExists = config.visualization && 'placeholders' in config.visualization;
    if (!isPlaceholdersExists) {
        return {
            ...config,
            version: versions_1.QlConfigVersions.V1,
        };
    }
    const updatedVisualization = {
        ...config.visualization,
        placeholders: config.visualization.placeholders.map((placeholder) => {
            var _a, _b;
            if (placeholder.id === constants_1.PlaceholderId.Y || placeholder.id === constants_1.PlaceholderId.Y2) {
                return {
                    ...placeholder,
                    settings: {
                        ...placeholder.settings,
                        nulls: ((_a = placeholder.settings) === null || _a === void 0 ? void 0 : _a.nulls) === "ignore" /* AxisNullsMode.Ignore */
                            ? "connect" /* AxisNullsMode.Connect */
                            : (_b = placeholder.settings) === null || _b === void 0 ? void 0 : _b.nulls,
                    },
                };
            }
            return placeholder;
        }),
    };
    return {
        ...config,
        visualization: updatedVisualization,
        version: versions_1.QlConfigVersions.V1,
    };
};
exports.mapUndefinedConfigToV1 = mapUndefinedConfigToV1;
