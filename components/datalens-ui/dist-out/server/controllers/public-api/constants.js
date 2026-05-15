"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_API_ERRORS = exports.PublicApiError = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
class PublicApiError extends nodekit_1.AppError {
}
exports.PublicApiError = PublicApiError;
exports.PUBLIC_API_ERRORS = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
    ACTION_CONFIG_NOT_FOUND: 'ACTION_CONFIG_NOT_FOUND',
    INVALID_API_VERSION_HEADER: 'INVALID_API_VERSION_HEADER',
    ACTION_VALIDATION_SCHEMA_NOT_FOUND: 'ACTION_VALIDATION_SCHEMA_NOT_FOUND',
};
