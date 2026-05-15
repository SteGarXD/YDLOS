"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDatasetFields = void 0;
const prepareDatasetFields = (fields) => {
    const datasetFields = {};
    const paramsFromDataset = {};
    fields.fields.forEach((field) => {
        datasetFields[field.guid] = field.title;
        paramsFromDataset[field.guid] = '';
    });
    const datasetFieldsList = fields.fields.map((field) => {
        const { guid } = field;
        return {
            title: field.title,
            guid,
            dataType: field.data_type,
            calc_mode: field.calc_mode,
            fieldType: field.type,
        };
    });
    return {
        datasetFieldsList,
        paramsFromDataset,
        datasetFields,
    };
};
const processDatasetFields = (datasetId, fields, ChartEditor) => {
    if (!fields) {
        return;
    }
    const { datasetFieldsList, paramsFromDataset, datasetFields } = prepareDatasetFields(fields);
    ChartEditor.setExtra('datasets', [
        {
            fields: datasetFields,
            fieldsList: datasetFieldsList,
            id: datasetId,
        },
    ]);
    ChartEditor.updateParams(paramsFromDataset);
};
exports.processDatasetFields = processDatasetFields;
