"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSources = void 0;
const shared_1 = require("../../../../../../shared");
const distincts_1 = require("./distincts");
const fields_1 = require("./fields");
const typed_query_1 = require("./typed-query");
const buildManualSelectorSources = (shared) => {
    if (shared.source.elementType === shared_1.DashTabItemControlElementType.Select) {
        shared.content = shared.source.acceptableValues;
    }
    shared.param = shared.source.fieldName;
    return {};
};
const buildSources = ({ shared, params, }) => {
    switch (shared.sourceType) {
        case shared_1.DashTabItemControlSourceType.Manual:
            return buildManualSelectorSources(shared);
        case shared_1.DashTabItemControlSourceType.Connection:
            return {
                connectionDistincts: (0, typed_query_1.prepareTypedQueryRequest)({ shared, params }),
            };
        case shared_1.DashTabItemControlSourceType.Dataset:
        default: {
            const datasetId = shared.source.datasetId;
            shared.param = shared.source.datasetFieldId || shared.source.fieldName;
            const sources = {
                fields: (0, fields_1.prepareFieldsRequest)({ datasetId }),
            };
            if (shared.source.elementType !== shared_1.DashTabItemControlElementType.Date &&
                shared.source.elementType !== shared_1.DashTabItemControlElementType.Input &&
                shared.source.elementType !== shared_1.DashTabItemControlElementType.Checkbox &&
                shared.source.datasetFieldType !== shared_1.DatasetFieldType.Measure) {
                sources.distincts = (0, distincts_1.prepareDistinctsRequest)({ shared, params });
            }
            return sources;
        }
    }
};
exports.buildSources = buildSources;
