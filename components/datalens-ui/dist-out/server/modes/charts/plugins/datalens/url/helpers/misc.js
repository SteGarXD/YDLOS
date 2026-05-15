"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTreeState = exports.isRawParamValid = exports.isParamValid = void 0;
const paramsUtils_1 = require("../../../../../../components/charts-engine/components/processor/paramsUtils");
const isParamValid = (value) => {
    if (typeof value === 'undefined' || value === null) {
        return false;
    }
    if (typeof value === 'number' && isNaN(value)) {
        return false;
    }
    if (Array.isArray(value) &&
        (value.length === 0 || value.some((x) => x === null))) {
        return false;
    }
    if (Array.isArray(value) && value.length === 1 && value[0] === '') {
        return false;
    }
    return true;
};
exports.isParamValid = isParamValid;
const isRawParamValid = (paramValue) => {
    if (paramValue === null) {
        return false;
    }
    if (paramValue === '') {
        return false;
    }
    if (Array.isArray(paramValue) && paramValue.length === 1 && paramValue[0] === '') {
        return false;
    }
    return true;
};
exports.isRawParamValid = isRawParamValid;
const getTreeState = (params) => {
    return [].concat((0, paramsUtils_1.getParam)('treeState', params)).filter(Boolean);
};
exports.getTreeState = getTreeState;
