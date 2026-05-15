"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMarkupItem = isMarkupItem;
const isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
const types_1 = require("../types");
function isMarkupItem(obj) {
    return (0, isPlainObject_1.default)(obj) && isMarkupObject(obj);
}
function isMarkupObject(obj) {
    if (obj.type && Object.values(types_1.MarkupItemTypes).includes(obj.type)) {
        return true;
    }
    {
        return false;
    }
}
