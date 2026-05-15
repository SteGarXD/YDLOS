"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareTypedQueryRequest = void 0;
const typed_query_api_1 = require("../../../../../../../shared/modules/typed-query-api");
const parameters_1 = require("../../../../../../../shared/modules/typed-query-api/helpers/parameters");
const constants_1 = require("../constants");
const prepareTypedQueryRequest = (args) => {
    const { shared, params } = args;
    const { connectionId, connectionQueryType, connectionQueryContent } = shared.source;
    shared.param = shared.source.fieldName;
    if (!connectionId || !connectionQueryType || !connectionQueryContent) {
        throw new Error('Missed required fields for TypedQueryApi request');
    }
    const parameters = (0, typed_query_api_1.mapParametersRecordToTypedQueryApiParameters)((0, parameters_1.extractTypedQueryParams)(params, shared.source.fieldName));
    return {
        url: constants_1.CONNECTIONS_TYPED_QUERY_URL.replace(constants_1.CONNECTION_ID_PLACEHOLDER, connectionId),
        method: 'POST',
        data: {
            query_type: connectionQueryType,
            query_content: connectionQueryContent,
            parameters,
        },
    };
};
exports.prepareTypedQueryRequest = prepareTypedQueryRequest;
