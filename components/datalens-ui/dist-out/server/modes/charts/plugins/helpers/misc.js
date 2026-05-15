"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasetIdAndLayerIdRequestKey = exports.getDatasetIdAndLayerIdFromKey = exports.getLayerIdRequestKey = exports.getDatasetIdRequestKey = void 0;
exports.getFieldList = getFieldList;
const shared_1 = require("../../../../../shared");
const misc_1 = require("../constants/misc");
const getDatasetIdRequestKey = (datasetId) => {
    return misc_1.DATASET_ID_KEY_TEMPLATE.replace(misc_1.DATASET_ID_KEY_TEMPLATE, datasetId);
};
exports.getDatasetIdRequestKey = getDatasetIdRequestKey;
const getLayerIdRequestKey = (layerId) => {
    return misc_1.LAYER_ID_KEY_TEMPLATE.replace(misc_1.LAYER_ID_KEY_TEMPLATE, layerId);
};
exports.getLayerIdRequestKey = getLayerIdRequestKey;
const getDatasetIdAndLayerIdFromKey = (key) => {
    const [datasetIdArgument, layerIdArgument = ''] = key.split(misc_1.DATASET_ID_LAYER_ID_SEPARATOR);
    return [datasetIdArgument, layerIdArgument];
};
exports.getDatasetIdAndLayerIdFromKey = getDatasetIdAndLayerIdFromKey;
const getDatasetIdAndLayerIdRequestKey = (datasetId, layerId) => {
    const datasetIdKey = (0, exports.getDatasetIdRequestKey)(datasetId);
    const key = misc_1.DATASET_ID_LAYER_ID_KEY_TEMPLATE.replace(misc_1.DATASET_ID_KEY_PLACEHOLDER, datasetIdKey);
    if (layerId) {
        const layerIdKey = (0, exports.getLayerIdRequestKey)(layerId);
        return key.replace(misc_1.LAYER_ID_KEY_PLACEHOLDER, layerIdKey);
    }
    return key.replace(misc_1.LAYER_ID_KEY_PLACEHOLDER, '');
};
exports.getDatasetIdAndLayerIdRequestKey = getDatasetIdAndLayerIdRequestKey;
function getFieldList(datasetFields, placeholders) {
    const placeholdersFields = placeholders.map((p) => p.items || []).flat(2);
    return datasetFields.map((field) => {
        const fieldId = field.guid || field.id;
        const placeholdersField = placeholdersFields.find(({ guid }) => guid === fieldId);
        return {
            title: field.title,
            guid: fieldId,
            dataType: field.data_type,
            formatting: placeholdersField
                ? (0, shared_1.getFormatOptions)({ ...field, ...placeholdersField })
                : undefined,
        };
    });
}
