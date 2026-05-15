"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapMarkupValue = wrapMarkupValue;
const constants_1 = require("../constants");
function wrapMarkupValue(value) {
    return { [constants_1.WRAPPED_MARKUP_KEY]: value };
}
