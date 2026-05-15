"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPublishLink = void 0;
const isValidPublishLink = (link) => {
    const validLinkRe = /^(http(s)?:\/\/|tel:|mailto:)/g;
    if (link) {
        return validLinkRe.test(link);
    }
    return true;
};
exports.isValidPublishLink = isValidPublishLink;
