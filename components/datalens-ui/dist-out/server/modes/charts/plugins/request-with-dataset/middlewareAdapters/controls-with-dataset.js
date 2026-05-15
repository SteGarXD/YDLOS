"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_distincts_body_1 = require("../../control/url/distincts/build-distincts-body");
const request_dataset_1 = require("../request-dataset");
exports.default = async (args) => {
    const { ctx, source, cacheClient, userId, iamToken, workbookId, rejectFetchingSource, pluginOptions, zitadelParams, authParams, requestHeaders, } = args;
    const datasetId = source.datasetId || '';
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
    const datasetFields = datasetFieldsResponse.datasetFields;
    ctx.log('CONTROLS_DATASET_FIELDS_RECEIVED', {
        count: datasetFields.length,
    });
    const data = (0, build_distincts_body_1.getDistinctsRequestBody)({
        params: source.sourceArgs.params,
        shared: source.sourceArgs.shared,
        datasetFields,
        ctx,
    });
    ctx.log('CONTROLS_DATASET_FIELDS_PROCESSED');
    return {
        ...source,
        data,
    };
};
