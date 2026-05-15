"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWrapFnArgsValid = void 0;
exports.getMessageFromUnknownError = getMessageFromUnknownError;
exports.isChartWithJSAndHtmlAllowed = isChartWithJSAndHtmlAllowed;
exports.cleanJSONFn = cleanJSONFn;
const isObject_1 = __importDefault(require("lodash/isObject"));
const isString_1 = __importDefault(require("lodash/isString"));
// There is a user value here, it could have any type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isWrapFnArgsValid = (value) => {
    if (!value || typeof value !== 'object') {
        throw new Error('You should pass an object to Editor.wrapFn method');
    }
    if (typeof value.fn !== 'function') {
        throw new Error('"fn" property should be a function');
    }
    if (typeof value.libs !== 'undefined' && !Array.isArray(value.libs)) {
        throw new Error('"libs" property should be an array of strings');
    }
    return true;
};
exports.isWrapFnArgsValid = isWrapFnArgsValid;
function getMessageFromUnknownError(e) {
    return (0, isObject_1.default)(e) && 'message' in e && (0, isString_1.default)(e.message) ? e.message : '';
}
const ESCAPE_CHART_FIELDS_DATE = new Date('2030-01-01').valueOf();
function isChartWithJSAndHtmlAllowed(config) {
    if (!config.createdAt) {
        return true;
    }
    return new Date(config.createdAt).valueOf() < ESCAPE_CHART_FIELDS_DATE;
}
function cleanJSONFn(value) {
    if (Array.isArray(value)) {
        return value.map(cleanJSONFn);
    }
    if (typeof value === 'object' && value !== null) {
        const replaced = {};
        Object.keys(value).forEach((key) => {
            const currentValue = value[key];
            replaced[key] = cleanJSONFn(currentValue);
        });
        return replaced;
    }
    if (typeof value !== 'string') {
        return value;
    }
    if (value.length < 8) {
        return value;
    }
    const prefix = value.substring(0, 8);
    if (prefix === '_NuFrRa_') {
        return undefined;
    }
    return value;
}
