"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processContent = void 0;
const shared_1 = require("../../../../../../../shared");
const parameters_1 = require("../../../../../../../shared/modules/typed-query-api/helpers/parameters");
const process_dataset_content_1 = require("./dataset/process-dataset-content");
const process_fields_1 = require("./dataset/process-fields");
const process_typed_query_content_1 = require("./typed-query/process-typed-query-content");
const process_typed_query_parameters_1 = require("./typed-query/process-typed-query-parameters");
const processContent = (args) => {
    const { data, shared, ChartEditor, params } = args;
    const { sourceType, source, content, param } = shared;
    switch (sourceType) {
        case shared_1.DashTabItemControlSourceType.Dataset: {
            (0, process_fields_1.processDatasetFields)(source.datasetId, data.fields, ChartEditor);
            return (0, process_dataset_content_1.processDatasetSourceTypeContent)({ shared, distincts: data.distincts });
        }
        case shared_1.DashTabItemControlSourceType.Connection: {
            (0, process_typed_query_parameters_1.processTypedQueryParameters)({
                ChartEditor,
                parameters: (0, parameters_1.extractTypedQueryParams)(params, param),
            });
            return (0, process_typed_query_content_1.processTypedQueryContent)(data.connectionDistincts);
        }
        default: {
            return content || [];
        }
    }
};
exports.processContent = processContent;
