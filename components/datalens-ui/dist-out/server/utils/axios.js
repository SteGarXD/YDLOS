"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtilsAxios = void 0;
const querystring_1 = __importDefault(require("querystring"));
const axios_1 = __importDefault(require("axios"));
const axios_2 = require("../constants/axios");
let axiosInstance;
const getUtilsAxios = (appConfig) => {
    if (!axiosInstance) {
        const config = {
            paramsSerializer: (params) => querystring_1.default.stringify(params),
            ...(appConfig.useIPV6 ? axios_2.IPV6_AXIOS_OPTIONS : {}),
        };
        axiosInstance = axios_1.default.create(config);
    }
    return axiosInstance;
};
exports.getUtilsAxios = getUtilsAxios;
