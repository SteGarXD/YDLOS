"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const crc32_1 = require("@node-rs/crc32");
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const cache_client_1 = require("../../../cache-client");
const constants_1 = require("../../constants");
const utils_1 = require("../utils");
const isCachedRequestOptions = (options) => 'useCaching' in options && Boolean(options.useCaching) && 'ctx' in options;
const { REQUEST_SIZE_LIMIT, ALL_REQUESTS_SIZE_LIMIT, REQUEST_SIZE_LIMIT_EXCEEDED, ALL_REQUESTS_SIZE_LIMIT_EXCEEDED, } = constants_1.config;
const CACHE_PREFIX = 'sp';
let cacheClient;
const requestWithPresets = request_promise_native_1.default.defaults({
    transform: (body, response) => {
        if (typeof body === 'string' &&
            // Stat in qloud do no return content-type with code 204
            response.headers['content-type'] &&
            response.headers['content-type'].indexOf('application/json') > -1) {
            try {
                response.body = JSON.parse(body);
            }
            catch (e) {
                response.body = body;
            }
        }
        return response;
    },
    useQuerystring: true,
    maxRedirects: 0,
    followAllRedirects: true,
});
class Request {
    static init({ cacheClientInstance }) {
        cacheClient = cacheClientInstance;
    }
    static request({ requestOptions, useCaching = false, requestControl, }) {
        const { signal } = requestOptions;
        if ((signal === null || signal === void 0 ? void 0 : signal.aborted) === true) {
            throw new Error(signal.reason);
        }
        function dataLengthCheck(requestInstance) {
            let bufferLength = 0;
            return function (chunk) {
                const { length } = chunk;
                bufferLength += length;
                requestControl.allBuffersLength += length;
                if (requestControl.allBuffersLength > ALL_REQUESTS_SIZE_LIMIT ||
                    bufferLength > REQUEST_SIZE_LIMIT) {
                    // @ts-ignore we use internal API in this case
                    if (requestInstance._started === true) {
                        requestInstance.abort();
                    }
                    const error = new Error(bufferLength > REQUEST_SIZE_LIMIT
                        ? REQUEST_SIZE_LIMIT_EXCEEDED
                        : ALL_REQUESTS_SIZE_LIMIT_EXCEEDED);
                    requestInstance.emit('error', error);
                }
            };
        }
        if (useCaching && isCachedRequestOptions(requestOptions)) {
            return this.cacheRequest({ requestOptions, dataLengthCheck });
        }
        else {
            return this.directRequest({ requestOptions, dataLengthCheck });
        }
    }
    static directRequest({ requestOptions, dataLengthCheck, }) {
        const requestInstance = requestWithPresets(requestOptions);
        return requestInstance.on('data', dataLengthCheck(requestInstance));
    }
    static cacheRequest({ requestOptions, dataLengthCheck, }) {
        const { uri, ctx } = requestOptions;
        let { spCacheDuration, useCaching } = requestOptions;
        const durationTime = Math.floor(Number(spCacheDuration));
        const removingCondition = spCacheDuration && durationTime < 7;
        const maxValue = 5184000;
        if (spCacheDuration &&
            (!isFinite(durationTime) || durationTime < 0 || durationTime > maxValue)) {
            ctx.logError('Cache duration invalid', { uri: (0, utils_1.hideSensitiveData)(uri) });
            useCaching = false;
            spCacheDuration = null;
        }
        let dataHash;
        if (requestOptions.body || requestOptions.form) {
            try {
                if (requestOptions.body) {
                    dataHash = (0, crc32_1.crc32c)(JSON.stringify(requestOptions.body));
                }
                else if (requestOptions.form) {
                    dataHash = (0, crc32_1.crc32c)(JSON.stringify(requestOptions.form));
                }
            }
            catch (error) {
                ctx.logError('Failed to calculate data hash', error);
            }
        }
        let key = `${CACHE_PREFIX}:${(0, utils_1.hideSensitiveData)(uri)}`;
        if (dataHash) {
            key += `:${dataHash}`;
        }
        const debugInfo = {
            url: key,
            fromCache: false,
        };
        const sequence = Promise.resolve();
        if (removingCondition) {
            sequence
                .then(() => {
                return cacheClient.del({ key });
            })
                .then(() => {
                ctx.log('Cache value successfully removed', { key });
            })
                .catch(() => {
                ctx.logError('Cache proxy deletion error', { key });
            });
        }
        const getData = (cacheServiceFailing) => {
            return this.directRequest({ requestOptions, dataLengthCheck })
                .then((response) => {
                if (useCaching && !removingCondition && !cacheServiceFailing) {
                    cacheClient
                        .set({ key, value: response.body, ttl: durationTime })
                        .then(() => {
                        ctx.log('Cache set', { key, durationTime });
                    })
                        .catch((error) => {
                        ctx.logError('Cache set failed', error);
                    });
                }
                ctx.log('CACHE_SENDING_VALUE_DIRECTLY', { uri: (0, utils_1.hideSensitiveData)(uri) });
                return response.body;
            })
                .catch((error) => {
                if (error.response) {
                    ctx.logError('Cache proxy request error', error);
                    throw error;
                }
                else {
                    throw error;
                }
            });
        };
        return sequence
            .then(() => {
            if (useCaching && spCacheDuration) {
                ctx.log('Cache getting value...', { key });
                return cacheClient.get({ key });
            }
            else {
                return null;
            }
        })
            .catch((error) => {
            ctx.logError('Cache service failed', error);
            return { status: cache_client_1.CacheClient.NOT_OK };
        })
            .then((cacheResponse) => {
            const cacheResponseStatus = cacheResponse && cacheResponse.status;
            if (cacheResponseStatus === cache_client_1.CacheClient.OK &&
                cacheResponse &&
                'data' in cacheResponse) {
                debugInfo.fromCache = true;
                ctx.log('Cache successfully recovered');
                cacheResponse.data.debugInfo = debugInfo;
                return cacheResponse.data;
            }
            else {
                if (useCaching) {
                    ctx.log('Cache failed, requesting without cache', cacheResponse !== null && cacheResponse !== void 0 ? cacheResponse : undefined);
                }
                else {
                    ctx.log('Cache disabled, requesting without cache');
                }
                return getData(cacheResponseStatus === cache_client_1.CacheClient.NOT_OK);
            }
        })
            .catch((error) => {
            ctx.logError('Cache proxy error', error);
            throw error;
        });
    }
}
exports.Request = Request;
