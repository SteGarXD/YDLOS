"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapMarkdownValue = wrapMarkdownValue;
const constants_1 = require("../constants");
function wrapMarkdownValue(value) {
    return { [constants_1.WRAPPED_MARKDOWN_KEY]: value };
}
