"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoints = void 0;
const utils_1 = require("../utils");
const opensource_1 = require("./opensource");
exports.endpoints = (0, utils_1.removeLastSlash)(opensource_1.opensourceEndpoints);
