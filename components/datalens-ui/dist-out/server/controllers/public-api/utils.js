"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequestApiVersion = exports.validateRequestBody = exports.prepareError = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const axios_1 = require("axios");
const isObject_1 = __importDefault(require("lodash/isObject"));
const zod_1 = require("zod");
const error_1 = require("../../../shared/constants/error");
const constants_1 = require("../../components/public-api/constants");
const utils_1 = require("../../components/public-api/utils");
const gateway_1 = require("../../utils/gateway");
const constants_2 = require("./constants");
// eslint-disable-next-line complexity
const prepareError = (error) => {
    var _a, _b;
    if (error instanceof constants_2.PublicApiError) {
        const { code, message, details } = error;
        switch (code) {
            case constants_2.PUBLIC_API_ERRORS.VALIDATION_ERROR: {
                return { status: 400, message, code, details };
            }
            case constants_2.PUBLIC_API_ERRORS.ENDPOINT_NOT_FOUND: {
                return { status: 404, message, code, details };
            }
            case constants_2.PUBLIC_API_ERRORS.INVALID_API_VERSION_HEADER: {
                return { status: 400, message, code };
            }
            default: {
                return {
                    status: 500,
                    message: 'Internal server error',
                };
            }
        }
    }
    if ((0, gateway_1.isGatewayError)(error)) {
        const { error: innerError } = error;
        if (innerError.status !== 500) {
            return {
                status: innerError.status,
                code: innerError.code,
                message: innerError.message,
                details: innerError.details,
            };
        }
        const originalError = innerError.debug.originalError;
        if (originalError instanceof axios_1.AxiosError) {
            const status = (_a = originalError.status) !== null && _a !== void 0 ? _a : 500;
            let message = originalError.message;
            let code;
            let details;
            const data = (_b = originalError.response) === null || _b === void 0 ? void 0 : _b.data;
            if ((0, isObject_1.default)(data)) {
                if ('message' in data && typeof data.message === 'string') {
                    message = data.message;
                }
                if ('code' in data && typeof data.code === 'string') {
                    code = data.code;
                }
                if ('details' in data) {
                    details = data.details;
                }
            }
            return { status, message, code, details };
        }
        if (originalError instanceof nodekit_1.AppError) {
            const message = originalError.message;
            const code = originalError.code ? String(originalError.code) : undefined;
            const details = originalError.details;
            return { status: innerError.status, message, code, details };
        }
        if (originalError instanceof error_1.ServerError) {
            const { status, message, code, details } = originalError;
            return { status, message, code, details };
        }
        if (!(originalError instanceof TypeError) &&
            !(originalError instanceof ReferenceError) &&
            !(originalError instanceof SyntaxError)) {
            return { status: innerError.status, message: innerError.message };
        }
    }
    return {
        status: 500,
        message: 'Internal server error',
    };
};
exports.prepareError = prepareError;
const validateRequestBody = async (schema, data) => {
    try {
        return await schema.parseAsync(data);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new constants_2.PublicApiError('Validation error', {
                code: constants_2.PUBLIC_API_ERRORS.VALIDATION_ERROR,
                details: error.issues,
            });
        }
        throw error;
    }
};
exports.validateRequestBody = validateRequestBody;
const parseRequestApiVersion = (req) => {
    const versionHeader = req.headers[constants_1.PUBLIC_API_VERSION_HEADER];
    if (versionHeader) {
        if ((0, utils_1.isPublicApiVersion)(versionHeader)) {
            return versionHeader;
        }
        if (versionHeader === constants_1.PUBLIC_API_VERSION_HEADER_LATEST_VALUE) {
            return constants_1.PUBLIC_API_LATEST_VERSION;
        }
    }
    throw new constants_2.PublicApiError(`Invalid or empty ${constants_1.PUBLIC_API_VERSION_HEADER} header value`, {
        code: constants_2.PUBLIC_API_ERRORS.INVALID_API_VERSION_HEADER,
    });
};
exports.parseRequestApiVersion = parseRequestApiVersion;
