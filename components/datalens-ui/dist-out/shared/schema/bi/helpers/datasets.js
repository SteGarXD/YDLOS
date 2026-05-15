"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDatasetProperty = exports.transformApiV2DistinctsResponse = exports.transformConnectionResponseError = exports.transformValidateDatasetFormulaResponseError = exports.transformValidateDatasetResponseError = void 0;
const feature_1 = require("../../../types/feature");
const transformResponseError = (response) => {
    const data = (response.data || {});
    const { code, message } = data;
    return {
        code,
        message,
        status: response.status,
        details: { data },
    };
};
const transformValidateDatasetResponseError = (response) => transformResponseError(response);
exports.transformValidateDatasetResponseError = transformValidateDatasetResponseError;
const transformValidateDatasetFormulaResponseError = (response) => transformResponseError(response);
exports.transformValidateDatasetFormulaResponseError = transformValidateDatasetFormulaResponseError;
const transformConnectionResponseError = (response) => transformResponseError(response);
exports.transformConnectionResponseError = transformConnectionResponseError;
const transformApiV2DistinctsResponse = (response) => {
    const { result_data } = response;
    const rows = result_data[0].rows;
    const responseData = rows.reduce((data, row) => {
        return [...data, row.data];
    }, []);
    return {
        result: {
            data: {
                Data: responseData,
            },
        },
    };
};
exports.transformApiV2DistinctsResponse = transformApiV2DistinctsResponse;
const prepareDatasetProperty = (ctx, dataset) => {
    const result = { ...dataset };
    const keyToDelete = ctx.get('isEnabledServerFeature')(feature_1.Feature.EnableRLSV2) ? 'rls' : 'rls2';
    delete result[keyToDelete];
    return result;
};
exports.prepareDatasetProperty = prepareDatasetProperty;
