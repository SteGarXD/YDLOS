"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPublicApiVersion = void 0;
const constants_1 = require("../constants");
const isPublicApiVersion = (value) => {
    return Object.values(constants_1.PUBLIC_API_VERSION).includes(Number(value));
};
exports.isPublicApiVersion = isPublicApiVersion;
