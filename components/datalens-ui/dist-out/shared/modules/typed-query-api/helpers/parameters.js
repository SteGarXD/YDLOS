"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTypedQueryParams = void 0;
const lodash_1 = require("lodash");
const extractTypedQueryParams = (params, fieldName) => {
    return (0, lodash_1.omit)(params !== null && params !== void 0 ? params : {}, fieldName !== null && fieldName !== void 0 ? fieldName : '');
};
exports.extractTypedQueryParams = extractTypedQueryParams;
