"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapHtml = wrapHtml;
exports.isWrappedHTML = isWrappedHTML;
const constants_1 = require("../constants");
function wrapHtml(value) {
    return {
        [constants_1.WRAPPED_HTML_KEY]: value,
    };
}
function isWrappedHTML(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    return constants_1.WRAPPED_HTML_KEY in value;
}
