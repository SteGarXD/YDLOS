"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareColumns = exports.getBackgroundColorFieldsIds = exports.prepareFieldsForPayload = void 0;
const shared_1 = require("../../../../../../../shared");
const misc_helpers_1 = require("../../utils/misc-helpers");
const prepareFieldsForPayload = (fields, datasetId, links) => {
    return fields
        .filter((field) => {
        const datasetsIdMatching = field.datasetId === datasetId;
        // Checking if this field is in needed dataset
        if (datasetsIdMatching) {
            return true;
        }
        // Checking if this field is linked to other datasets
        const linkForField = links === null || links === void 0 ? void 0 : links.find(({ fields: linkFields }) => {
            return (Boolean(linkFields[datasetId]) &&
                Object.keys(linkFields).some((linkedDatasetId) => {
                    return linkFields[linkedDatasetId].field.guid === field.guid;
                }));
        });
        return linkForField;
    })
        .map((field) => field.guid);
};
exports.prepareFieldsForPayload = prepareFieldsForPayload;
const getBackgroundColorFieldsIds = (fields, datasetId, visualizationId) => {
    let preparedFields = fields.filter((field) => field.datasetId === datasetId && (0, misc_helpers_1.isTableFieldBackgroundSettingsEnabled)(field));
    if (visualizationId === shared_1.WizardVisualizationId.FlatTable) {
        preparedFields = preparedFields.filter((field) => field.backgroundSettings.settings.isContinuous);
    }
    return preparedFields.map((field) => ({
        colorFieldGuid: field.backgroundSettings.colorFieldGuid,
        targetFieldGuid: field.guid,
        isContinuous: field.backgroundSettings.settings.isContinuous,
    }));
};
exports.getBackgroundColorFieldsIds = getBackgroundColorFieldsIds;
const prepareColumns = ({ fields, datasetId, parameters, backgroundColorsFieldsIds, }) => {
    const rawColumns = [
        ...(0, exports.prepareFieldsForPayload)(fields, datasetId),
        // The parameters that lie in the main sections need to be compared with the fields for rendering
        ...(0, exports.prepareFieldsForPayload)(parameters, datasetId),
        ...backgroundColorsFieldsIds.map(({ colorFieldGuid }) => colorFieldGuid),
    ];
    return Array.from(new Set(rawColumns));
};
exports.prepareColumns = prepareColumns;
