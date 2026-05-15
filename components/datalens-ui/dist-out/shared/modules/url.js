"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTrueArg = isTrueArg;
const TRUE_FLAGS = ['1', 'true', true];
function isTrueArg(arg) {
    return TRUE_FLAGS.includes(arg);
}
