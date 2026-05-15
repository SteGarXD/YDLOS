"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthHeaders = exports.getAuthArgs = exports.createTypedAction = exports.getValidationSchema = exports.hasValidationSchema = exports.getAuthHeadersNone = void 0;
exports.createAction = createAction;
const constants_1 = require("../constants");
const getAuthHeadersNone = () => undefined;
exports.getAuthHeadersNone = getAuthHeadersNone;
function createAction(config) {
    return config;
}
const VALIDATION_SCHEMA_KEY = Symbol('$schema');
const registerValidationSchema = (value, schema) => {
    Object.defineProperty(value, VALIDATION_SCHEMA_KEY, {
        value: schema,
        enumerable: false,
    });
    return value;
};
const hasValidationSchema = (value) => {
    return Object.prototype.hasOwnProperty.call(value, VALIDATION_SCHEMA_KEY);
};
exports.hasValidationSchema = hasValidationSchema;
const getValidationSchema = (value) => {
    return (0, exports.hasValidationSchema)(value) ? value[VALIDATION_SCHEMA_KEY] : null;
};
exports.getValidationSchema = getValidationSchema;
const createTypedAction = (schema, actionConfig) => {
    const schemaValidationObject = {
        paramsSchema: schema.paramsSchema,
        resultSchema: schema.resultSchema,
    };
    return registerValidationSchema(actionConfig, schemaValidationObject);
};
exports.createTypedAction = createTypedAction;
const getAuthArgs = (req, _res) => {
    var _a, _b;
    return {
        // zitadel
        userAccessToken: (_a = req.user) === null || _a === void 0 ? void 0 : _a.accessToken,
        serviceUserAccessToken: req.serviceUserAccessToken,
        // auth
        accessToken: (_b = req.ctx.get('user')) === null || _b === void 0 ? void 0 : _b.accessToken,
    };
};
exports.getAuthArgs = getAuthArgs;
const createGetAuthHeaders = () => (params) => {
    const { authArgs } = params;
    const resultHeaders = {};
    // zitadel
    if (authArgs === null || authArgs === void 0 ? void 0 : authArgs.userAccessToken) {
        Object.assign(resultHeaders, {
            [constants_1.AuthHeader.Authorization]: `Bearer ${authArgs.userAccessToken}`,
        });
    }
    // zitadel
    if (authArgs === null || authArgs === void 0 ? void 0 : authArgs.serviceUserAccessToken) {
        Object.assign(resultHeaders, {
            [constants_1.SERVICE_USER_ACCESS_TOKEN_HEADER]: authArgs.serviceUserAccessToken,
        });
    }
    // auth
    if (authArgs === null || authArgs === void 0 ? void 0 : authArgs.accessToken) {
        Object.assign(resultHeaders, {
            [constants_1.AuthHeader.Authorization]: `Bearer ${authArgs.accessToken}`,
        });
    }
    return resultHeaders;
};
exports.getAuthHeaders = createGetAuthHeaders();
