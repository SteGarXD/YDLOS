"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformResponseError = exports.defaultParamsSerializer = void 0;
exports.filterUrlFragment = filterUrlFragment;
exports.decodePathParams = decodePathParams;
exports.omitCloudAuthUnitHeaders = omitCloudAuthUnitHeaders;
const omit_1 = __importDefault(require("lodash/omit"));
const qs_1 = __importDefault(require("qs"));
function filterUrlFragment(input) {
    return /^[a-zA-Z0-9._:-]*$/.test(input) ? input : '';
}
function decodePathParams(params) {
    const decodedParams = {};
    Object.keys(params).forEach((key) => {
        decodedParams[key] = decodeURIComponent(params[key]);
    });
    return decodedParams;
}
const defaultParamsSerializer = (queryParams) => {
    return qs_1.default.stringify(queryParams, { arrayFormat: 'repeat' });
};
exports.defaultParamsSerializer = defaultParamsSerializer;
function omitCloudAuthUnitHeaders(headers, cloudIdHeader, folderIdHeader, tenantIdHeader) {
    return (0, omit_1.default)(headers, cloudIdHeader, folderIdHeader, tenantIdHeader);
}
const transformResponseError = (response) => {
    const data = (response.data || {});
    const { code, message } = data;
    return {
        code,
        message,
        status: response.status,
        details: { data: response.data },
    };
};
exports.transformResponseError = transformResponseError;
