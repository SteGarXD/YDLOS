"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAxios = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const shared_1 = require("../../shared");
const axios_2 = require("../constants/axios");
let axiosInstance;
const getAxios = (config) => {
    if (!axiosInstance) {
        axiosInstance = axios_1.default.create({
            ...(config.useIPV6 ? axios_2.IPV6_AXIOS_OPTIONS : {}),
            timeout: shared_1.DEFAULT_TIMEOUT,
        });
        (0, axios_retry_1.default)(axiosInstance, {
            retries: 0,
            retryDelay: (retryCount) => retryCount * 3000,
            retryCondition: (error) => {
                if (!error.config) {
                    return false;
                }
                return axios_retry_1.default.isNetworkError(error) || axios_retry_1.default.isRetryableError(error);
            },
        });
    }
    return axiosInstance;
};
exports.getAxios = getAxios;
