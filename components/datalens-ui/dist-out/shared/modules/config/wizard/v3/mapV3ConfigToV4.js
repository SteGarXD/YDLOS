"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateDatetime = exports.mapV3ConfigToV4 = exports.mapV3LabelsToV4Labels = void 0;
const constants_1 = require("../../../../constants");
const types_1 = require("../../../../types");
const wizard_helpers_1 = require("../../../wizard-helpers");
const createV4LabelFromV3 = (v3Label) => {
    return Object.keys(v3Label).reduce((v4Label, key) => {
        switch (key) {
            case 'labelMode':
                return {
                    ...v4Label,
                    formatting: {
                        ...v4Label.formatting,
                        labelMode: v3Label.labelMode || constants_1.DEFAULT_FORMATTING.labelMode,
                    },
                };
            case 'formatting':
                return {
                    ...v4Label,
                    formatting: {
                        ...v4Label.formatting,
                        ...((v3Label === null || v3Label === void 0 ? void 0 : v3Label.formatting) || {}),
                    },
                };
            default:
                return { ...v4Label, [key]: v3Label[key] };
        }
    }, {});
};
const mapV3LabelsToV4Labels = (v3Label) => {
    if (v3Label.type === types_1.DatasetFieldType.Pseudo) {
        return {
            ...v3Label,
            formatting: undefined,
        };
    }
    const v4Label = createV4LabelFromV3(v3Label);
    const formatting = {
        ...(0, wizard_helpers_1.getDefaultFormatting)(v4Label),
        ...(v4Label.formatting || {}),
    };
    return {
        ...v4Label,
        formatting,
    };
};
exports.mapV3LabelsToV4Labels = mapV3LabelsToV4Labels;
const mapV3ConfigToV4 = (config) => {
    var _a;
    const v4Labels = (config.labels || []).map(exports.mapV3LabelsToV4Labels);
    const v4Visualization = {
        ...config.visualization,
        layers: (_a = config.visualization.layers) === null || _a === void 0 ? void 0 : _a.map((layer) => {
            const commonPlaceholders = layer.commonPlaceholders;
            const v3Labels = commonPlaceholders.labels;
            const v4LayerLabels = v3Labels.map(exports.mapV3LabelsToV4Labels);
            return {
                ...layer,
                commonPlaceholders: {
                    ...commonPlaceholders,
                    labels: v4LayerLabels,
                },
            };
        }),
    };
    return {
        ...config,
        visualization: v4Visualization,
        labels: v4Labels,
        version: types_1.ChartsConfigVersion.V4,
    };
};
exports.mapV3ConfigToV4 = mapV3ConfigToV4;
const mutateFieldDatetime = (field) => {
    if (field.data_type === 'datetime') {
        field.data_type = types_1.DATASET_FIELD_TYPES.GENERICDATETIME;
    }
    if (field.cast === 'datetime') {
        field.cast = types_1.DATASET_FIELD_TYPES.GENERICDATETIME;
    }
};
const migrateDatetime = (config) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    (_a = config.visualization.placeholders) === null || _a === void 0 ? void 0 : _a.forEach((placeholder) => {
        var _a;
        (_a = placeholder.items) === null || _a === void 0 ? void 0 : _a.forEach(mutateFieldDatetime);
    });
    (_b = config.visualization.layers) === null || _b === void 0 ? void 0 : _b.forEach((layer) => {
        var _a, _b, _c, _d, _e, _f;
        (_a = layer.placeholders) === null || _a === void 0 ? void 0 : _a.forEach((placeholder) => {
            var _a;
            (_a = placeholder.items) === null || _a === void 0 ? void 0 : _a.forEach(mutateFieldDatetime);
        });
        (_b = layer.commonPlaceholders.colors) === null || _b === void 0 ? void 0 : _b.forEach(mutateFieldDatetime);
        (_c = layer.commonPlaceholders.filters) === null || _c === void 0 ? void 0 : _c.forEach(mutateFieldDatetime);
        (_d = layer.commonPlaceholders.labels) === null || _d === void 0 ? void 0 : _d.forEach(mutateFieldDatetime);
        (_e = layer.commonPlaceholders.sort) === null || _e === void 0 ? void 0 : _e.forEach(mutateFieldDatetime);
        (_f = layer.commonPlaceholders.tooltips) === null || _f === void 0 ? void 0 : _f.forEach(mutateFieldDatetime);
    });
    (_c = config.colors) === null || _c === void 0 ? void 0 : _c.forEach(mutateFieldDatetime);
    (_d = config.labels) === null || _d === void 0 ? void 0 : _d.forEach(mutateFieldDatetime);
    (_e = config.filters) === null || _e === void 0 ? void 0 : _e.forEach(mutateFieldDatetime);
    (_f = config.shapes) === null || _f === void 0 ? void 0 : _f.forEach(mutateFieldDatetime);
    (_g = config.sort) === null || _g === void 0 ? void 0 : _g.forEach(mutateFieldDatetime);
    (_h = config.segments) === null || _h === void 0 ? void 0 : _h.forEach(mutateFieldDatetime);
    (_j = config.updates) === null || _j === void 0 ? void 0 : _j.forEach((update) => {
        if (update.field) {
            mutateFieldDatetime(update.field);
        }
    });
};
exports.migrateDatetime = migrateDatetime;
