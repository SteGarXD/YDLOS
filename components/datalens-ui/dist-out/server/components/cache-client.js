"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_TIMEOUT = 2000;
const timeout = (prom, time) => {
    let timer;
    return Promise.race([
        prom,
        new Promise((_r, rej) => {
            timer = setTimeout(rej, time, Error('TimeoutError'));
        }),
    ]).finally(() => clearTimeout(timer));
};
class CacheClient {
    constructor({ config }) {
        this._debug = false;
        this.client = null;
        this._debug = config.appInstallation === 'development';
        if (config.redis && config.redis.password) {
            this.client = new ioredis_1.default(config.redis);
        }
    }
    async get({ key }) {
        if (this.client) {
            try {
                const data = await timeout(this.client.get(key), REDIS_TIMEOUT);
                if (data === null) {
                    return {
                        status: CacheClient.KEY_NOT_FOUND,
                    };
                }
                return {
                    status: CacheClient.OK,
                    data: JSON.parse(data),
                };
            }
            catch (error) {
                return {
                    status: CacheClient.NOT_OK,
                    message: error.message || 'Service unavailable',
                };
            }
        }
        else {
            return {
                status: CacheClient.NOT_OK,
                message: 'Redis client is null',
            };
        }
    }
    async set({ key, value, ttl, }) {
        if (this.client) {
            try {
                await timeout(this.client.set(key, JSON.stringify(value), 'EX', ttl), REDIS_TIMEOUT);
                return {
                    status: CacheClient.OK,
                };
            }
            catch (error) {
                return {
                    status: CacheClient.NOT_OK,
                    message: error.message || 'Service unavailable',
                };
            }
        }
        else {
            return {
                status: CacheClient.NOT_OK,
                message: 'Redis client is null',
            };
        }
    }
    async del({ key }) {
        if (this.client) {
            try {
                await timeout(this.client.del(key), REDIS_TIMEOUT);
                return {
                    status: CacheClient.OK,
                };
            }
            catch (error) {
                return {
                    status: CacheClient.NOT_OK,
                    message: error.message || 'Service unavailable',
                };
            }
        }
        else {
            return {
                status: CacheClient.NOT_OK,
                message: 'Redis client is null',
            };
        }
    }
}
exports.CacheClient = CacheClient;
CacheClient.OK = Symbol('CACHE_STATUS_OK');
CacheClient.NOT_OK = Symbol('CACHE_STATUS_NOT_OK');
CacheClient.KEY_NOT_FOUND = Symbol('CACHE_STATUS_KEY_NOT_FOUND');
exports.default = CacheClient;
