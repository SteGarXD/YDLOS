"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStorage = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const uuid_1 = require("uuid");
const DEFAULT_PRELOAD_FETCHING_INTERVAL = 120e3;
class BaseStorage {
    constructor(provider) {
        this.requestIdHeaderName = '';
        this.cachedConfigs = {};
        this.flags = {};
        this.telemetryCallbacks = {};
        this.provider = provider;
    }
    init({ initialPreloadFetchingInterval = DEFAULT_PRELOAD_FETCHING_INTERVAL, initialOauthToken, config, telemetryCallbacks, flags, }) {
        this.preloadFetchingInterval = initialPreloadFetchingInterval;
        this.oauthToken = initialOauthToken;
        this.cachedConfigs = {};
        this.requestIdHeaderName = config.requestIdHeaderName;
        this.flags = flags;
        this.telemetryCallbacks = telemetryCallbacks;
        this.initProvider(config);
    }
    async refreshPreloaded(parentCtx, callback) {
        const requestId = (0, uuid_1.v4)();
        const ctx = parentCtx.create('Configs preloading', { loggerPostfix: requestId });
        ctx.set(nodekit_1.REQUEST_ID_PARAM_NAME, requestId);
        ctx.setTag('request_id', requestId);
        ctx.log('STORAGE_REFRESHING_PRELOADED');
        const preloadList = parentCtx.config.preloadList || [];
        try {
            for (const key of preloadList) {
                await this.resolveConfig(ctx, {
                    key,
                    headers: {
                        authorization: `OAuth ${this.oauthToken}`,
                    },
                    noCache: true,
                })
                    .then((config) => {
                    this.cachedConfigs[key] = config;
                })
                    .catch((error) => {
                    ctx.logError('Error preloading config', error, {
                        key,
                    });
                });
            }
            setTimeout(() => this.refreshPreloaded(parentCtx, callback), this.preloadFetchingInterval);
            callback(this.cachedConfigs);
        }
        catch (error) {
            ctx.logError('Error preloading configs', error);
        }
        finally {
            ctx.end();
        }
    }
    initPreloading(ctx, callback) {
        this.refreshPreloaded(ctx, callback).catch((error) => {
            ctx.logError('Error preloading configs', error);
        });
    }
    fetchConfig(ctx, params) {
        const { headers, unreleased, storageApiPath, extraAllowedHeaders, workbookId, includeServicePlan, includeTenantFeatures, } = params;
        const requestId = ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME);
        if (requestId) {
            headers[this.requestIdHeaderName] = requestId;
        }
        const storageRetrieveArgs = {
            headers,
            unreleased: this.flags.alwaysUnreleased ? true : unreleased,
            includePermissionsInfo: true,
            includeServicePlan,
            includeTenantFeatures,
            includeTenantSettings: true,
            storageApiPath,
            extraAllowedHeaders,
        };
        const onConfigFetched = this.telemetryCallbacks.onConfigFetched || (() => { });
        const onConfigFetchingFailed = this.telemetryCallbacks.onConfigFetchingFailed || (() => { });
        const startTime = new Date().getTime();
        let retrieve;
        let id;
        if (params.id && 'embedToken' in params && params.embedToken) {
            retrieve = this.provider.retrieveByTokenAndId(ctx, {
                token: params.embedToken,
                id: params.id,
                ...storageRetrieveArgs,
            });
            id = `embed-${params.embedId}`;
        }
        else if (params.id) {
            retrieve = this.provider.retrieveById(ctx, {
                id: params.id,
                workbookId,
                ...storageRetrieveArgs,
            });
            id = params.id;
        }
        else if ('embedToken' in params && params.embedToken) {
            retrieve = this.provider.retrieveByToken(ctx, {
                token: params.embedToken,
                ...storageRetrieveArgs,
            });
            id = `embed-${params.embedId}`;
        }
        else if (params.key) {
            retrieve = this.provider.retrieveByKey(ctx, { key: params.key, ...storageRetrieveArgs });
            id = params.key;
        }
        else {
            throw new Error('Wrong fetch config params');
        }
        const traceId = ctx.getTraceId();
        const tenantId = ctx.get('tenantId');
        const userId = ctx.get('userId');
        return retrieve
            .then((result) => {
            onConfigFetched({
                id,
                requestId,
                traceId,
                statusCode: 200,
                latency: new Date().getTime() - startTime,
                tenantId,
                userId,
            });
            return result;
        })
            .catch((error) => {
            var _a;
            onConfigFetchingFailed(error, {
                id,
                requestId,
                traceId,
                tenantId,
                statusCode: error.status || error.statusCode || ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500,
                latency: new Date().getTime() - startTime,
                userId,
            });
            throw error;
        });
    }
    setPreloaded(preloaded) {
        this.cachedConfigs = preloaded;
    }
    resolveConfig(ctx, props) {
        const { key, unreleased = false, noCache = false } = props;
        if (!noCache && !unreleased && this.cachedConfigs[key]) {
            ctx.log('STORAGE_CONF_PRELOAD_HIT', { key });
            return Promise.resolve(this.cachedConfigs[key]);
        }
        return this.fetchConfig(ctx, { ...props, unreleased });
    }
    resolveEmbedConfig(ctx, props) {
        const { unreleased = false } = props;
        return this.fetchConfig(ctx, { ...props, unreleased });
    }
    initProvider(config) {
        this.provider.init({
            endpoint: config.usEndpoint,
            requestIdHeaderName: this.requestIdHeaderName,
        });
    }
}
exports.BaseStorage = BaseStorage;
