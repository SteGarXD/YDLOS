"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_API_LATEST_VERSION = exports.PUBLIC_API_VERSION = exports.PUBLIC_API_ROUTE = exports.PUBLIC_API_URL = exports.PUBLIC_API_HTTP_METHOD = exports.OPEN_API_VERSION_HEADER_COMPONENT_NAME = exports.PUBLIC_API_VERSION_HEADER_LATEST_VALUE = exports.PUBLIC_API_VERSION_HEADER = exports.ApiTag = void 0;
var ApiTag;
(function (ApiTag) {
    ApiTag["Connection"] = "Connection";
    ApiTag["Dataset"] = "Dataset";
    ApiTag["Wizard"] = "Wizard";
    ApiTag["Dashboard"] = "Dashboard";
    ApiTag["QL"] = "QL";
    ApiTag["Navigation"] = "Navigation";
    ApiTag["Workbook"] = "Workbook";
    ApiTag["Collection"] = "Collection";
})(ApiTag || (exports.ApiTag = ApiTag = {}));
exports.PUBLIC_API_VERSION_HEADER = 'x-dl-api-version';
exports.PUBLIC_API_VERSION_HEADER_LATEST_VALUE = 'latest';
exports.OPEN_API_VERSION_HEADER_COMPONENT_NAME = 'ApiVersionHeader';
exports.PUBLIC_API_HTTP_METHOD = 'POST';
exports.PUBLIC_API_URL = '/rpc/:action';
exports.PUBLIC_API_ROUTE = `${exports.PUBLIC_API_HTTP_METHOD} ${exports.PUBLIC_API_URL}`;
exports.PUBLIC_API_VERSION = {
    v0: 0,
};
exports.PUBLIC_API_LATEST_VERSION = Math.max(...Object.values(exports.PUBLIC_API_VERSION));
