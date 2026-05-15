"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const build_request_body_1 = require("../../datalens/url/build-request-body");
const misc_1 = require("../../helpers/misc");
const request_dataset_1 = require("../request-dataset");
exports.default = async (args) => {
    const { ctx, source, sourceName, cacheClient, userId, iamToken, workbookId, rejectFetchingSource, pluginOptions, zitadelParams, authParams, requestHeaders, } = args;
    const [datasetId, layerId] = (0, misc_1.getDatasetIdAndLayerIdFromKey)(sourceName);
    const urlsSourceArgs = source.sourceArgs;
    const shared = urlsSourceArgs.shared;
    const wizardDataset = shared.wizardDataset;
    let revisionId;
    let datasetFields;
    // When Urls are executed on the Wizard side, we don't need a dataset from the CHARTS side to avoid an unnecessary request
    // Since we get it when loading the chart into Wizard and put it in the api request arguments/run
    // the dataset is stored in shared.dataset
    if (wizardDataset && wizardDataset.id === datasetId) {
        revisionId = wizardDataset.dataset.revisionId;
        datasetFields = (0, shared_1.getResultSchemaFromDataset)(wizardDataset);
    }
    else {
        const datasetFieldsResponse = await (0, request_dataset_1.getDatasetFields)({
            datasetId,
            workbookId: workbookId !== null && workbookId !== void 0 ? workbookId : null,
            ctx,
            cacheClient,
            userId,
            iamToken,
            rejectFetchingSource,
            pluginOptions,
            zitadelParams,
            authParams,
            requestHeaders,
        });
        revisionId = datasetFieldsResponse.revisionId;
        datasetFields = datasetFieldsResponse.datasetFields;
    }
    ctx.log('CHARTS_DATASET_FIELDS_RECEIVED', {
        count: datasetFields.length,
    });
    const data = (0, build_request_body_1.getUrlsRequestBody)({
        params: source.sourceArgs.params,
        shared: source.sourceArgs.shared,
        apiVersion: source.sourceArgs.apiVersion,
        datasetId,
        datasetFields,
        layerId,
        revisionId,
    });
    ctx.log('CHARTS_DATASET_FIELDS_PROCESSED');
    return { ...source, data };
};
