"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectKeys = void 0;
exports.isTruthy = isTruthy;
// This `is guard` is convenient to use in map.filter(isTruthy) to filter truthy values
function isTruthy(value) {
    return Boolean(value);
}
exports.objectKeys = Object.keys;
