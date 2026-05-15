"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const querystring_1 = require("querystring");
const pick_1 = __importDefault(require("lodash/pick"));
const utils_1 = require("../../../shared/schema/utils");
const axios_1 = require("../axios");
class US {
    /**
     * Универсальный метод для запросов RPC через backend UI
     *
     * @param data данные в формате RPC {action:string, method:string, data:any[], tid: number}
     * @param headers заголовки запроса, главное чтобы был x-rpc-authorization
     * @param ctx
     * @returns объект {err:any, data:any}, если err заполнен, то ошибка
     */
    static async universalService(data, headers, ctx) {
        try {
            var axios = (0, axios_1.getAxios)(ctx.config);
            const { data: result } = await axios({
                method: 'POST',
                url: `${ctx.config.endpoints.api.us}/universal_service`,
                headers: {
                    'Content-Type': 'application/json',
                    'x-rpc-authorization': headers['x-rpc-authorization']
                },
                data,
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_UNIVERSAL_SERVICE_SUCCESS', US.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_US_UNIVERSAL_SERVICE_FAILED', error, {});
            throw error;
        }
    }
    static async oidcAuth(data, ctx) {
        try {
            var axios = (0, axios_1.getAxios)(ctx.config);
            const { data: result } = await axios({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/oidc/auth?login=${data.login}&token=${data.token}&data=${encodeURIComponent(data.data)}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_UNIVERSAL_SERVICE_SUCCESS', US.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_US_UNIVERSAL_SERVICE_FAILED', error, {});
            throw error;
        }
    }
    static async createEntry(data, headers, ctx) {
        try {
            const { data: result } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'POST',
                url: `${ctx.config.endpoints.api.us}/v1/entries`,
                headers,
                data,
            });
            ctx.log('SDK_US_CREATE_ENTRY_SUCCESS', US.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_US_CREATE_ENTRY_FAILED', error, US.getLoggedErrorEntry(data));
            throw error;
        }
    }
    static async readEntry(entryId, params, headers, ctx) {
        try {
            if (entryId == undefined) {
                throw Error('SDK_US_READ_EMPTY_ENTRY_FAILED');
            }
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/v1/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
                headers,
                params,
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_READ_ENTRY_SUCCESS', US.getLoggedEntry(data));
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_READ_ENTRY_FAILED', error, { entryId, params });
            throw error;
        }
    }
    static async updateEntry(entryId, mode, data, headers, ctx) {
        try {
            const { data: result } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'POST',
                url: `${ctx.config.endpoints.api.us}/v1/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
                headers,
                data: {
                    ...data,
                    mode,
                },
            });
            ctx.log('SDK_US_UPDATE_ENTRY_SUCCESS', US.getLoggedEntry(result));
            return result;
        }
        catch (error) {
            ctx.logError('SDK_US_UPDATE_ENTRY_FAILED', error, {
                entryId,
                ...US.getLoggedErrorEntry(data),
            });
            throw error;
        }
    }
    static async deleteEntry(entryId, headers, ctx) {
        try {
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'delete',
                url: `${ctx.config.endpoints.api.us}/v1/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
                headers,
            });
            ctx.log('SDK_US_DELETE_ENTRY_SUCCESS', US.getLoggedEntry(data));
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_DELETE_ENTRY_FAILED', error, { entryId });
            throw error;
        }
    }
    static async getEntryMeta(entryId, params, headers, ctx) {
        try {
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/v1/entries/${(0, utils_1.filterUrlFragment)(entryId)}/meta`,
                headers,
                params,
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_READ_ENTRY_META_SUCCESS', US.getLoggedEntry(data));
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_READ_ENTRY_META_FAILED', error, { entryId, params });
            throw error;
        }
    }
    static async getEntryByKey(key, params, headers, ctx) {
        try {
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/v1/entriesByKey`,
                headers,
                params: params ? { ...params, key } : { key },
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_GET_ENTRY_BY_KEY_SUCCESS', US.getLoggedEntry(data));
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_GET_ENTRY_BY_KEY_FAILED', error, { key, params });
            throw error;
        }
    }
    static async getEntries(params, headers, ctx) {
        try {
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/v1/entries`,
                headers,
                params,
                paramsSerializer: (params) => (0, querystring_1.stringify)(params),
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_GET_ENTRIES_SUCCESS', { count: data.length });
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_GET_ENTRIES_FAILED', error);
            throw error;
        }
    }
    static async getState(entryId, hash, headers, ctx) {
        const logData = { entryId, hash };
        try {
            const { data } = await (0, axios_1.getAxios)(ctx.config)({
                method: 'GET',
                url: `${ctx.config.endpoints.api.us}/v1/states/${(0, utils_1.filterUrlFragment)(entryId)}/${(0, utils_1.filterUrlFragment)(hash)}`,
                headers,
                'axios-retry': { retries: 1 },
            });
            ctx.log('SDK_US_GET_STATE_SUCCESS', logData);
            return data;
        }
        catch (error) {
            ctx.logError('SDK_US_GET_STATE_FAILED', error, logData);
            throw error;
        }
    }
    static getLoggedEntry(entry) {
        return (0, pick_1.default)(entry, ['key', 'entryId', 'scope', 'type']);
    }
    static getLoggedErrorEntry(data) {
        return (0, pick_1.default)(data, ['key', 'entryId', 'scope', 'type']);
    }
}
exports.default = US;
