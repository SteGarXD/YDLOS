"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareSource = exports.prepareSourceWithDataset = exports.isDatasetSource = exports.prepareSourceWithQLConnection = exports.isQLConnectionSource = exports.prepareSourceWithAPIConnector = exports.getApiConnectorParamsFromSource = exports.isAPIConnectorSource = void 0;
const lodash_1 = require("lodash");
const constants_1 = require("../../../../modes/charts/plugins/control/url/constants");
const validateAPIConnectorSource = (source) => {
    const requiredFields = [
        { field: 'apiConnectionId', valid: (0, lodash_1.isString)(source.apiConnectionId) },
        { field: 'method', valid: (0, lodash_1.isString)(source.method) },
        { field: 'path', valid: (0, lodash_1.isString)(source.path) },
    ];
    const missingFields = requiredFields.filter((item) => !item.valid).map((item) => item.field);
    if (missingFields.length > 0) {
        throw new Error(`Missing or invalid API connector fields: ${missingFields.join(', ')}`);
    }
    return true;
};
const isAPIConnectorSource = (source) => {
    return (0, lodash_1.isString)(source.apiConnectionId) && validateAPIConnectorSource(source);
};
exports.isAPIConnectorSource = isAPIConnectorSource;
const getApiConnectorParamsFromSource = (source) => {
    const originalSource = source._original;
    if (!((0, lodash_1.isObject)(originalSource) &&
        'method' in originalSource &&
        (0, lodash_1.isString)(originalSource.method) &&
        'path' in originalSource &&
        (0, lodash_1.isString)(originalSource.path))) {
        throw new Error('ApiConnector source is not prepared');
    }
    const result = {
        method: originalSource.method,
        body: {},
        path: originalSource.path,
    };
    if (originalSource.method === 'POST' && 'body' in originalSource) {
        result.body = originalSource.body;
        result.content_type = (0, lodash_1.isString)(originalSource.body)
            ? 'text/plain;charset=utf-8'
            : 'application/json';
    }
    return result;
};
exports.getApiConnectorParamsFromSource = getApiConnectorParamsFromSource;
const prepareSourceWithAPIConnector = (source) => {
    source._original = { ...source };
    const sourceUrl = constants_1.CONNECTIONS_TYPED_QUERY_RAW_URL.replace(constants_1.CONNECTION_ID_PLACEHOLDER, encodeURIComponent(source.apiConnectionId));
    source.url = sourceUrl;
    source.method = 'POST';
    return source;
};
exports.prepareSourceWithAPIConnector = prepareSourceWithAPIConnector;
const validateQLConnectionSource = (source) => {
    const requiredFields = [
        { field: 'qlConnectionId', valid: (0, lodash_1.isString)(source.qlConnectionId) },
        { field: 'data', valid: (0, lodash_1.isObject)(source.data) },
    ];
    const missingFields = requiredFields.filter((item) => !item.valid).map((item) => item.field);
    if (missingFields.length > 0) {
        throw new Error(`Missing or invalid QL connector fields: ${missingFields.join(', ')}`);
    }
    return true;
};
const isQLConnectionSource = (source) => {
    return (0, lodash_1.isString)(source.qlConnectionId) && validateQLConnectionSource(source);
};
exports.isQLConnectionSource = isQLConnectionSource;
const prepareSourceWithQLConnection = (source) => {
    const sourceUrl = constants_1.CONNECTIONS_DASHSQL.replace(constants_1.CONNECTION_ID_PLACEHOLDER, encodeURIComponent(source.qlConnectionId));
    source.url = sourceUrl;
    source.method = 'POST';
    return source;
};
exports.prepareSourceWithQLConnection = prepareSourceWithQLConnection;
const isDatasetSource = (source) => {
    return (0, lodash_1.isString)(source.datasetId);
};
exports.isDatasetSource = isDatasetSource;
const prepareSourceWithDataset = (source) => {
    const urlPath = (0, lodash_1.isObject)(source) && 'path' in source && (0, lodash_1.isString)(source.path) ? source.path : 'result';
    let template;
    let method;
    switch (urlPath) {
        case 'result': {
            template = constants_1.DATASET_RESULT_URL;
            method = 'POST';
            break;
        }
        case 'values/distinct': {
            template = constants_1.DATASET_DISTINCTS_URL;
            method = 'POST';
            break;
        }
        case 'fields': {
            template = constants_1.DATASET_FIELDS_URL;
            method = 'GET';
            break;
        }
        default: {
            throw Error('Wrong path');
        }
    }
    const sourceUrl = template.replace(constants_1.DATASET_ID_PLACEHOLDER, encodeURIComponent(source.datasetId));
    source.url = sourceUrl;
    source.method = method;
    return source;
};
exports.prepareSourceWithDataset = prepareSourceWithDataset;
const prepareSource = (source) => {
    if (!(0, lodash_1.isObject)(source)) {
        return source;
    }
    if ((0, exports.isAPIConnectorSource)(source)) {
        return (0, exports.prepareSourceWithAPIConnector)(source);
    }
    if ((0, exports.isQLConnectionSource)(source)) {
        return (0, exports.prepareSourceWithQLConnection)(source);
    }
    if ((0, exports.isDatasetSource)(source)) {
        return (0, exports.prepareSourceWithDataset)(source);
    }
    return source;
};
exports.prepareSource = prepareSource;
