"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDatasetFieldsById = exports.prepareWidgetDatasetData = exports.prepareDatasetData = exports.fetchDataset = void 0;
const registry_1 = require("../../../../server/registry");
const fetchDataset = async ({ datasetId, workbookId, typedApi, ctx, }) => {
    try {
        const data = await typedApi.us.getEntry({
            entryId: datasetId,
            workbookId,
        });
        return {
            datasetId,
            data,
        };
    }
    catch (error) {
        ctx.logError('DASH_FETCH_DATASET_BY_GET_ENTRY_FAILED', error);
    }
    return { datasetId, data: null };
};
exports.fetchDataset = fetchDataset;
const prepareDatasetData = (args) => {
    var _a;
    const { entryId, datasetId, type, items, visualizationType } = args;
    const emptyValue = { entryId, type: null };
    if (!(items === null || items === void 0 ? void 0 : items.data)) {
        return emptyValue;
    }
    const { data, key } = items.data;
    const result_schema = data === null || data === void 0 ? void 0 : data.result_schema;
    if (!result_schema) {
        return emptyValue;
    }
    // we form an array of elements of the following type:
    // * wizard and dataset are not in datasetsIds
    //   {entryId: "0tk6pkyusg", type: "graph_wizard_node", datasetId: "3a3em9nwkk", datasetFields: Array(8)}
    // * wizard and dataset are in datasetsIds
    //   {entryId: "0lwgk7z2kw", type: "graph_wizard_node", datasetId: "fbnaupoasc"}
    // * wizard that doesn't have a datasetId in meta
    //   {entryId: "0epkfeanqv", type: "graph_wizard_node"}
    // * node script
    //   {entryId: "ilslg0le88", type: "graph_node"}
    return {
        entryId,
        type,
        visualizationType,
        datasetId,
        datasetName: ((_a = key.match(/[^/]*$/)) === null || _a === void 0 ? void 0 : _a[0]) || '',
        datasetFields: result_schema.map(({ title, guid, type: fieldType }) => {
            return {
                title,
                guid,
                type: fieldType,
            };
        }),
    };
};
exports.prepareDatasetData = prepareDatasetData;
const prepareWidgetDatasetData = (args) => {
    const { entryId, datasetId, items } = args;
    if (!items.data) {
        return { entryId };
    }
    return {
        entryId,
        datasetId,
        datasetFields: items.data.responseData.fields.map(({ guid }) => guid),
    };
};
exports.prepareWidgetDatasetData = prepareWidgetDatasetData;
const fetchDatasetFieldsById = async ({ datasetId, workbookId, ctx, headers, }) => {
    var _a;
    try {
        const { gatewayApi } = registry_1.registry.getGatewayApi();
        const requestDatasetFields = gatewayApi.bi.getDataSetFieldsById;
        const { iamToken } = ctx.get('gateway');
        const data = await requestDatasetFields({
            ctx: ctx,
            headers: headers,
            requestId: (_a = ctx.getMetadata()) === null || _a === void 0 ? void 0 : _a[ctx.config.requestIdHeaderName],
            authArgs: { iamToken },
            args: {
                dataSetId: datasetId,
                workbookId,
            },
        });
        return {
            datasetId,
            data,
        };
    }
    catch (error) {
        ctx.logError('DASH_GET_DATASET_FIELDS_BY_IDS_FIELDS_GET_DATASET_BY_VERSION_FAILED', error);
    }
    return { datasetId, data: null };
};
exports.fetchDatasetFieldsById = fetchDatasetFieldsById;
