"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetcher = void 0;
exports.addZitadelHeaders = addZitadelHeaders;
exports.addAuthHeaders = addAuthHeaders;
const node_querystring_1 = __importDefault(require("node:querystring"));
const node_url_1 = __importDefault(require("node:url"));
const nodekit_1 = require("@gravity-ui/nodekit");
const lodash_1 = require("lodash");
const object_sizeof_1 = __importDefault(require("object-sizeof"));
const p_queue_1 = __importDefault(require("p-queue"));
const shared_1 = require("../../../../../shared");
const registry_1 = require("../../../../registry");
const constants_1 = require("../../constants");
const request_1 = require("../request");
const utils_1 = require("../utils");
const sources_1 = require("./sources");
const utils_2 = require("./utils");
const { ALL_REQUESTS_SIZE_LIMIT_EXCEEDED, ALL_REQUESTS_TIMEOUT_EXCEEDED, CONCURRENT_REQUESTS_LIMIT, DEFAULT_FETCHING_TIMEOUT, DEFAULT_SINGLE_FETCHING_TIMEOUT, EMPTY_RESPONSE, INVALID_SOURCE_FORMAT, INVALID_SOURCES_FORMAT, REDACTED_DATA_PLACEHOLDER, REDIRECT, REQUEST_CANCELLED, REQUEST_SIZE_LIMIT_EXCEEDED, SOURCE_IS_CIRCULAR, UNHANDLED_INTERNAL_SERVER_ERROR, UNKNOWN_SOURCE, } = constants_1.config;
// https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1.1
const ALLOWED_HTTP_METHODS = ['GET', 'POST'];
const ALLOWED_REQUEST_FORMATS = ['json', 'form'];
function isSourceWithMiddlewareUrl(source) {
    return (0, lodash_1.isObject)(source.middlewareUrl) && (0, lodash_1.isObject)(source.sourceArgs);
}
function getDatasetId(publicTargetUri) {
    if (!publicTargetUri || typeof publicTargetUri !== 'string') {
        return null;
    }
    // [backend-api]/api/data/v1/datasets/[id]/versions/draft/result
    return publicTargetUri.split('/')[7];
}
function cancelRequestsPromises(requestsPromises, cancelCode, current) {
    requestsPromises.forEach((requestPromise) => {
        if (requestPromise[0] === current) {
            return;
        }
        requestPromise[1].abort(cancelCode);
    });
}
function filterObjectWhitelist(source, whitelist) {
    return whitelist
        ? Object.keys(source).reduce((acc, key) => {
            if (whitelist.includes(key)) {
                acc[key] = source[key];
            }
            return acc;
        }, {})
        : source;
}
const isFetchLimitError = (errorMessage) => errorMessage === `Error: ${REQUEST_SIZE_LIMIT_EXCEEDED}` ||
    errorMessage === `Error: ${ALL_REQUESTS_SIZE_LIMIT_EXCEEDED}`;
function addZitadelHeaders({ headers, zitadelParams, }) {
    if (zitadelParams === null || zitadelParams === void 0 ? void 0 : zitadelParams.accessToken) {
        Object.assign(headers, { authorization: `Bearer ${zitadelParams.accessToken}` });
    }
    if (zitadelParams === null || zitadelParams === void 0 ? void 0 : zitadelParams.serviceUserAccessToken) {
        Object.assign(headers, {
            [shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER]: zitadelParams.serviceUserAccessToken,
        });
    }
}
function addAuthHeaders({ headers, authParams, }) {
    if (authParams === null || authParams === void 0 ? void 0 : authParams.accessToken) {
        Object.assign(headers, { authorization: `Bearer ${authParams.accessToken}` });
    }
}
class DataFetcher {
    static fetch({ sources, ctx, postprocess = null, subrequestHeaders, userId, userLogin, iamToken, workbookId, isEmbed = false, zitadelParams, authParams, originalReqHeaders, adapterContext, telemetryCallbacks, cacheClient, sourcesConfig, }) {
        const fetchingTimeout = ctx.config.fetchingTimeout || DEFAULT_FETCHING_TIMEOUT;
        const fetchingStartTime = Date.now();
        const processingRequests = [];
        const overallTimeout = setTimeout(() => {
            cancelRequestsPromises(processingRequests, ALL_REQUESTS_TIMEOUT_EXCEEDED);
        }, fetchingTimeout);
        return new Promise((resolve, reject) => {
            if (typeof sources !== 'object' && sources !== null) {
                return reject({
                    code: INVALID_SOURCES_FORMAT,
                });
            }
            const queue = new p_queue_1.default({ concurrency: CONCURRENT_REQUESTS_LIMIT });
            const fetchPromisesList = [];
            if (!originalReqHeaders || !adapterContext) {
                throw new Error('Missing original request headers or adapter context');
            }
            Object.keys(sources).forEach((sourceName) => {
                const source = sources[sourceName];
                fetchPromisesList.push(() => source
                    ? DataFetcher.fetchSource({
                        ctx,
                        sourceName,
                        source: (0, lodash_1.isString)(source) ? { url: source } : source,
                        fetchingStartTime,
                        subrequestHeaders,
                        processingRequests,
                        rejectFetchingSource: reject,
                        userId,
                        userLogin,
                        iamToken,
                        workbookId,
                        isEmbed,
                        zitadelParams,
                        authParams,
                        originalReqHeaders: originalReqHeaders,
                        adapterContext: adapterContext,
                        telemetryCallbacks,
                        cacheClient,
                        sourcesConfig,
                    })
                    : {
                        sourceId: sourceName,
                        sourceType: 'Invalid',
                        code: INVALID_SOURCE_FORMAT,
                    });
            });
            queue
                .addAll(fetchPromisesList)
                .then((results) => {
                const failed = {};
                const fetched = {};
                clearTimeout(overallTimeout);
                results.forEach((result) => {
                    Object.keys(result).forEach((key) => {
                        if (result[key] === null) {
                            delete result[key];
                        }
                    });
                    if (result.message || result.code) {
                        const entry = {
                            sourceType: result.sourceType,
                            status: result.status,
                            message: result.message,
                            code: result.code,
                            responseHeaders: result.responseHeaders,
                            uiUrl: result.uiUrl,
                            dataUrl: result.dataUrl,
                            data: result.data,
                            hideInInspector: result.hideInInspector,
                            /** @deprecated use uiUrl and dataUrl */
                            url: result.url,
                            details: result.details,
                        };
                        if (result.body) {
                            entry.body = result.body;
                        }
                        failed[result.sourceId] = filterObjectWhitelist(entry, ctx.config.runResponseWhitelist);
                    }
                    else {
                        fetched[result.sourceId] = filterObjectWhitelist(result, ctx.config.runResponseWhitelist);
                    }
                });
                if (Object.keys(failed).length) {
                    reject(failed);
                }
                else if (postprocess) {
                    resolve(postprocess(fetched));
                }
                else {
                    resolve(fetched);
                }
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    static getSourceName(sourcePath) {
        return sourcePath.replace(/\/([^?/]+)(.|\n)*/g, '$1').slice(1);
    }
    /**
     * @param {String} chartsEngine
     * @param {String} sourcePath requested source
     *
     * @returns {Object} source configuration
     */
    static getSourceConfig({ sourcesConfig, sourcePath, isEmbed, }) {
        let sourceName = DataFetcher.getSourceName(sourcePath);
        // Temporary hack for embed endpoints
        if (isEmbed && sourceName === 'bi_datasets') {
            sourceName = 'bi_datasets_embed';
        }
        if (isEmbed && sourceName === 'bi_connections') {
            sourceName = 'bi_connections_embed';
        }
        const resultSourceType = Object.keys(sourcesConfig).find((sourceType) => {
            if (sourceName === sourceType) {
                return true;
            }
            const aliases = sourcesConfig[sourceType].aliases;
            if (aliases) {
                return aliases.has(sourceName);
            }
            return false;
        });
        if (resultSourceType) {
            const sourceConfig = sourcesConfig[resultSourceType];
            sourceConfig.sourceType = resultSourceType;
            // Temporary hack for embed endpoints
            if (isEmbed && resultSourceType === 'bi_datasets_embed') {
                sourceConfig.sourceType = 'bi_datasets';
            }
            if (isEmbed && resultSourceType === 'bi_connections_embed') {
                sourceConfig.sourceType = 'bi_connections';
            }
            return sourceConfig;
        }
        else {
            return null;
        }
    }
    /**
     * @param {String} sourcesConfig
     * @param {String} lang target lang
     *
     * @returns {Object} config for all sources
     */
    static getChartKitSources({ sourcesConfig, lang = 'en', }) {
        const sources = sourcesConfig;
        const chartkitSources = {};
        Object.keys(sources).forEach((sourceType) => {
            const chartkitSource = {};
            const source = sources[sourceType];
            if (source.description) {
                const chartkitSourceDescription = {};
                const description = source.description;
                if (description.title) {
                    chartkitSourceDescription.title = description.title[lang];
                }
                chartkitSource.description = chartkitSourceDescription;
            }
            if (source.uiEndpoint) {
                chartkitSource.uiEndpoint = source.uiEndpoint;
            }
            if (source.dataEndpoint) {
                chartkitSource.dataEndpoint = source.dataEndpoint;
            }
            chartkitSources[sourceType] = chartkitSource;
            if (source.aliases) {
                [...source.aliases].forEach((alias) => {
                    chartkitSources[alias] = chartkitSource;
                });
            }
        });
        return chartkitSources;
    }
    /**
     * @param {String} sourcePath requested source
     *
     * @returns {Boolean} check is source stat or not
     */
    static isStat({ sourcesConfig, sourcePath, }) {
        return DataFetcher.getSourceConfig({ sourcesConfig, sourcePath }) === null;
    }
    static removeFromProcessingRequests(promise, processingRequests) {
        const index = processingRequests.findIndex((elem) => elem[0] === promise);
        processingRequests.splice(index, 1);
    }
    static async fetchSource({ sourceName, source, ctx, fetchingStartTime, subrequestHeaders, processingRequests, rejectFetchingSource, userId, userLogin, iamToken, workbookId, isEmbed, zitadelParams, authParams, originalReqHeaders, adapterContext, telemetryCallbacks, cacheClient, sourcesConfig, }) {
        const singleFetchingTimeout = ctx.config.singleFetchingTimeout || DEFAULT_SINGLE_FETCHING_TIMEOUT;
        const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
        const useChartsEngineLogin = Boolean(isEnabledServerFeature(shared_1.Feature.UseChartsEngineLogin));
        try {
            source = (0, sources_1.prepareSource)(source);
        }
        catch (e) {
            return {
                sourceId: sourceName,
                sourceType: 'Unresolved',
                code: 'INVALID_SOURCE_CONFIG',
                details: (0, utils_2.getMessageFromUnknownError)(e),
            };
        }
        const onDataFetched = telemetryCallbacks.onDataFetched || (() => { });
        const onDataFetchingFailed = telemetryCallbacks.onDataFetchingFailed || (() => { });
        const requestControl = {
            allBuffersLength: 0,
        };
        const hideInInspector = source.hideInInspector;
        let targetUri = source.url;
        const loggedSource = Object.assign({}, source, {
            data: REDACTED_DATA_PLACEHOLDER,
            sourceArgs: REDACTED_DATA_PLACEHOLDER,
            headers: REDACTED_DATA_PLACEHOLDER,
        });
        const loggedInfo = {
            sourceName,
            source: loggedSource,
        };
        if (useChartsEngineLogin && userLogin) {
            loggedInfo.login = userLogin;
        }
        ctx.log('FETCHER_REQUEST', loggedInfo);
        if (typeof targetUri !== 'string' || !targetUri) {
            ctx.logError('FETCHER_UNKNOWN_SOURCE', null, { targetUri });
            return {
                sourceId: sourceName,
                sourceType: 'Unresolved',
                code: UNKNOWN_SOURCE,
            };
        }
        targetUri = targetUri.replace(/^\/_node/, '/_charts/_node');
        targetUri = targetUri.replace(/^\/api\/special\/traf/, '/_traf');
        targetUri = targetUri.replace(/^\/api\/wizard\/v1\/run/, '/_charts/api/wizard/v1/run');
        targetUri = targetUri.replace(/^\/api\/editor\/v1\/run/, '/_charts/api/editor/v1/run');
        targetUri = targetUri.replace(/^\/api\/run/, '/_charts/api/run');
        if (DataFetcher.isStat({ sourcesConfig, sourcePath: targetUri })) {
            targetUri = '/_stat' + targetUri;
        }
        const parsedUrl = node_url_1.default.parse(targetUri);
        const parsedQuery = node_querystring_1.default.parse(parsedUrl.query || '');
        // https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html#sec5.1.1
        const sourceMethod = (source.method && source.method.toUpperCase()) || 'GET';
        const customHeaders = source.headers || {};
        if (!ALLOWED_HTTP_METHODS.includes(sourceMethod)) {
            const message = `This HTTP method is not allowed: ${sourceMethod}`;
            ctx.logError(message);
            return {
                sourceId: sourceName,
                sourceType: sourceName,
                message,
            };
        }
        const sourceCache = source.cache || parsedQuery['_sp_cache_duration'] || null;
        const sourceStatFormat = source.statFormat || parsedQuery['_sp_stat_format'] || null;
        let sourceFormat = source.format;
        if (sourceFormat === 'text') {
            sourceFormat = 'form';
        }
        if (!sourceFormat || !ALLOWED_REQUEST_FORMATS.includes(sourceFormat)) {
            sourceFormat = 'json';
        }
        const dataSourceName = DataFetcher.getSourceName(targetUri);
        const sourceConfig = DataFetcher.getSourceConfig({
            sourcesConfig,
            sourcePath: targetUri,
            isEmbed,
        });
        if (!sourceConfig) {
            ctx.logError(`Invalid source: ${targetUri}`);
            return {
                sourceId: sourceName,
                sourceType: 'Unresolved',
                code: INVALID_SOURCE_FORMAT,
            };
        }
        const { passedCredentials, extraHeaders, sourceType } = sourceConfig;
        if (sourceConfig.allowedMethods &&
            !sourceConfig.allowedMethods.includes(sourceMethod)) {
            const message = `This HTTP method (${sourceMethod}) is not allowed for this source: ${sourceName}`;
            ctx.logError(message);
            return {
                sourceId: sourceName,
                sourceType,
                message,
            };
        }
        if (sourceConfig.check) {
            const result = await sourceConfigCheck({
                ctx,
                targetUri,
                sourceConfig,
                sourceName,
                sourceType,
            });
            if (result.valid === false) {
                return result.meta;
            }
        }
        const useCaching = Boolean(sourceConfig.useCaching && sourceCache);
        const croppedTargetUri = targetUri.replace('/_' + sourceType, '');
        let userTargetUriUi = null;
        if (sourceConfig.uiEndpointFormatter) {
            userTargetUriUi = sourceConfig.uiEndpointFormatter(targetUri, source.data);
        }
        else if (sourceConfig.uiEndpoint) {
            userTargetUriUi = sourceConfig.uiEndpoint + croppedTargetUri;
        }
        if (sourceConfig.adapterWithContext) {
            return sourceConfig.adapterWithContext({
                targetUri: croppedTargetUri,
                sourceName,
                adapterContext,
                ctx,
            });
        }
        const headers = Object.assign({}, {
            'user-agent': 'Datalens Charts',
        }, ctx.getMetadata());
        if (subrequestHeaders['x-rpc-authorization']) {
            headers['x-request-id'] = '{{' + subrequestHeaders['x-rpc-authorization'] + '}}.' + headers['x-request-id'];
        }
        if (sourceType === 'charts') {
            const incomingHeader = originalReqHeaders.xChartsFetcherVia || '';
            const { reqBody } = ctx.get('sources');
            const scriptName = reqBody.params ? '/editor/' + reqBody.params.name : reqBody.path;
            if (incomingHeader && !Array.isArray(incomingHeader)) {
                const circular = incomingHeader.split(',').some((someScriptName) => {
                    return scriptName === someScriptName;
                });
                if (circular) {
                    ctx.logError('Source is circullar');
                    return {
                        sourceId: sourceName,
                        url: targetUri,
                        sourceType,
                        code: SOURCE_IS_CIRCULAR,
                    };
                }
            }
            headers['x-charts-fetcher-via'] = incomingHeader
                ? `${incomingHeader},${scriptName}`
                : scriptName;
        }
        if (originalReqHeaders.referer) {
            headers.referer = ctx.utils.redactSensitiveQueryParams(originalReqHeaders.referer);
        }
        const proxyHeaders = ctx.config.chartsEngineConfig.dataFetcherProxiedHeaders || [
            // fallback will be removed soon
            shared_1.SuperuserHeader.XDlAllowSuperuser,
            shared_1.SuperuserHeader.XDlSudo,
            shared_1.DL_CONTEXT_HEADER,
            'x-dl-debug-mode',
            shared_1.DL_EMBED_TOKEN_HEADER,
        ];
        if (Array.isArray(proxyHeaders)) {
            proxyHeaders.forEach((headerName) => {
                if (sourceConfig.isExternal && headerName.toLowerCase().startsWith('x-dl')) {
                    return;
                }
                if (subrequestHeaders[headerName]) {
                    headers[headerName] = subrequestHeaders[headerName];
                }
            });
        }
        if (workbookId) {
            headers[shared_1.WORKBOOK_ID_HEADER] = workbookId;
        }
        if (zitadelParams) {
            addZitadelHeaders({ headers, zitadelParams });
        }
        if (authParams) {
            addAuthHeaders({ headers, authParams });
        }
        if (passedCredentials) {
            const getSourceAuthorizationHeaders = registry_1.registry.common.functions.get('getSourceAuthorizationHeaders');
            const sourceAuthorizationHeaders = getSourceAuthorizationHeaders({
                ctx,
                sourceConfig,
                subrequestHeaders,
            });
            Object.assign(headers, sourceAuthorizationHeaders);
        }
        if (extraHeaders) {
            if (typeof extraHeaders === 'function') {
                const extraHeadersResult = extraHeaders();
                Object.assign(headers, extraHeadersResult);
            }
            else if (typeof extraHeaders === 'object') {
                Object.assign(headers, extraHeaders);
            }
        }
        if (sourceConfig.args) {
            Object.assign(parsedQuery, sourceConfig.args);
        }
        delete parsedQuery['_sp_cache_duration'];
        delete parsedQuery['_sp_stat_format'];
        parsedUrl.query = node_querystring_1.default.stringify(parsedQuery);
        parsedUrl.search = parsedUrl.query ? '?' + parsedUrl.query : '';
        targetUri =
            sourceConfig.dataEndpoint + node_url_1.default.format(parsedUrl).replace('/_' + sourceType, '');
        const requestHeaders = Object.assign({}, customHeaders, headers);
        if (sourceConfig.preprocess) {
            targetUri = sourceConfig.preprocess(targetUri);
        }
        const requestOptions = {
            method: sourceMethod,
            uri: targetUri,
            headers: requestHeaders,
            timeout: singleFetchingTimeout,
            spStatFormat: sourceStatFormat,
        };
        if (sourceConfig.maxRedirects) {
            requestOptions.maxRedirects = sourceConfig.maxRedirects;
        }
        if (useCaching) {
            Object.assign(requestOptions, {
                ctx,
                spCacheDuration: sourceCache,
                useCaching,
            });
        }
        requestOptions.headers['x-forwarded-for'] = originalReqHeaders.xForwardedFor;
        if (!requestOptions.headers['x-real-ip']) {
            requestOptions.headers['x-real-ip'] = originalReqHeaders.xRealIP;
        }
        if (isSourceWithMiddlewareUrl(source)) {
            const middlewareSourceConfig = DataFetcher.getSourceConfig({
                sourcesConfig,
                sourcePath: source.middlewareUrl.sourceName,
            });
            if (middlewareSourceConfig === null || middlewareSourceConfig === void 0 ? void 0 : middlewareSourceConfig.middlewareAdapter) {
                source = await middlewareSourceConfig.middlewareAdapter({
                    ctx,
                    source,
                    sourceName,
                    iamToken: iamToken !== null && iamToken !== void 0 ? iamToken : undefined,
                    workbookId,
                    cacheClient,
                    userId: userId === undefined ? null : userId,
                    rejectFetchingSource,
                    zitadelParams,
                    authParams,
                    requestHeaders: requestOptions.headers,
                });
            }
        }
        const sourceData = (0, sources_1.isAPIConnectorSource)(source)
            ? { parameters: (0, sources_1.getApiConnectorParamsFromSource)(source) }
            : (!(0, lodash_1.isString)(source) && source.data) || null;
        if (sourceData) {
            if (sourceFormat === 'form') {
                requestOptions.form = sourceData;
            }
            else {
                requestOptions.body = sourceData;
                if (typeof sourceData === 'object') {
                    requestOptions.json = true;
                }
            }
        }
        const publicTargetUri = (0, utils_1.hideSensitiveData)(targetUri);
        const publicSourceData = (0, utils_1.hideSensitiveData)(sourceData);
        const traceId = ctx.getTraceId();
        const tenantId = ctx.get('tenantId');
        return new Promise((fetchResolve) => {
            ctx.log('Fetching', { publicTargetUri, xRealIp: requestOptions.headers['x-real-ip'] });
            if (useCaching) {
                ctx.log('Using caching', { publicTargetUri });
            }
            const abortController = new AbortController();
            const signal = abortController.signal;
            const currentRequest = request_1.Request.request({
                requestOptions: { ...requestOptions, signal },
                requestControl,
                useCaching,
            })
                // eslint-disable-next-line
                .catch((error) => {
                var _a, _b, _c, _d;
                if (signal.aborted) {
                    return;
                }
                const latency = new Date().getTime() - fetchingStartTime;
                const statusCode = isFetchLimitError(error.message) ? 200 : error.statusCode;
                onDataFetchingFailed(error, {
                    sourceName: dataSourceName,
                    statusCode,
                    requestId: ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
                    latency,
                    traceId,
                    tenantId,
                    url: publicTargetUri,
                    userId: userId || '',
                });
                if (error.response) {
                    if (error.response.req) {
                        error.response.req.headers = ctx.utils.redactSensitiveHeaders(error.response.req.headers);
                    }
                    if (error.response.request) {
                        error.response.request.headers = ctx.utils.redactSensitiveHeaders(error.response.request.headers);
                    }
                }
                const invalidJsonResponse = typeof ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.body) === 'string' &&
                    ((_d = (_c = (_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['content-type']) === null || _d === void 0 ? void 0 : _d.includes('application/json'));
                if (invalidJsonResponse) {
                    error.response.body = '[INVALID BODY]';
                }
                if (error.statusCode) {
                    ctx.log(`Fetching failed with response code: ${error.statusCode} ${publicTargetUri}`);
                    fetchResolve({
                        status: error.statusCode,
                        sourceId: sourceName,
                        sourceType,
                        message: `${error.statusCode}`.replace('ECONNABORTED', 'Network error (source processing timed out)'),
                        body: (error.response && error.response.body) || {},
                        uiUrl: userTargetUriUi,
                        dataUrl: publicTargetUri,
                        data: publicSourceData,
                        hideInInspector,
                        /** @deprecated use uiUrl or dataUrl */
                        url: userTargetUriUi || publicTargetUri,
                    });
                }
                else {
                    ctx.logError(`Fetching failed unexpectedly ${publicTargetUri}`, error);
                    const errorMessage = error.message;
                    let errorCode = error.code;
                    if (isFetchLimitError(errorMessage)) {
                        errorCode = error.message.replace('Error: ', '');
                        let cancelCode = errorCode;
                        if (errorCode === REQUEST_SIZE_LIMIT_EXCEEDED) {
                            cancelCode = null;
                        }
                        cancelRequestsPromises(processingRequests, cancelCode, currentRequest);
                        fetchResolve({
                            sourceId: sourceName,
                            sourceType,
                            code: errorCode,
                            responseHeaders: (error.response && error.response.headers) || null,
                            uiUrl: userTargetUriUi,
                            dataUrl: publicTargetUri,
                            data: publicSourceData,
                            hideInInspector,
                            /** @deprecated use uiUrl or dataUrl */
                            url: userTargetUriUi || publicTargetUri,
                        });
                    }
                    else {
                        fetchResolve({
                            sourceId: sourceName,
                            sourceType,
                            message: errorMessage,
                            code: errorCode,
                            status: (error.response && error.response.statusCode) || null,
                            responseHeaders: (error.response && error.response.headers) || null,
                            body: error.response && error.response.body,
                            uiUrl: userTargetUriUi,
                            dataUrl: publicTargetUri,
                            data: publicSourceData,
                            hideInInspector,
                            /** @deprecated use uiUrl or dataUrl */
                            url: userTargetUriUi || publicTargetUri,
                        });
                    }
                }
            })
                .then((response) => {
                if (response) {
                    let data = response.body || response;
                    const latency = new Date().getTime() - fetchingStartTime;
                    onDataFetched({
                        sourceName: dataSourceName,
                        statusCode: response.statusCode,
                        requestId: ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
                        latency,
                        url: publicTargetUri,
                        traceId,
                        tenantId,
                        userId: userId || '',
                    });
                    if (response.statusCode === 204 && data === '') {
                        fetchResolve({
                            sourceId: sourceName,
                            sourceType,
                            status: response.statusCode,
                            code: EMPTY_RESPONSE,
                            responseHeaders: response.headers,
                            uiUrl: userTargetUriUi,
                            dataUrl: publicTargetUri,
                            data: publicSourceData,
                            hideInInspector,
                            /** @deprecated use uiUrl or dataUrl */
                            url: userTargetUriUi || publicTargetUri,
                        });
                    }
                    else if (response.statusCode === 301 ||
                        response.statusCode === 302 ||
                        response.statusCode === 307) {
                        fetchResolve({
                            sourceId: sourceName,
                            sourceType,
                            status: response.statusCode,
                            code: REDIRECT,
                            body: data,
                            responseHeaders: response.headers,
                            uiUrl: userTargetUriUi,
                            dataUrl: publicTargetUri,
                            data: publicSourceData,
                            hideInInspector,
                            /** @deprecated use uiUrl or dataUrl */
                            url: userTargetUriUi || publicTargetUri,
                        });
                    }
                    else {
                        if (sourceConfig.postprocess) {
                            data = sourceConfig.postprocess(data, requestOptions);
                        }
                        const datasetId = getDatasetId(publicTargetUri);
                        fetchResolve({
                            sourceId: sourceName,
                            sourceType,
                            body: data,
                            responseHeaders: response.headers,
                            status: response.statusCode,
                            latency,
                            size: (0, object_sizeof_1.default)(data),
                            uiUrl: userTargetUriUi,
                            dataUrl: publicTargetUri,
                            datasetId,
                            hideInInspector,
                            data: publicSourceData,
                            /** @deprecated use uiUrl or dataUrl */
                            url: userTargetUriUi || publicTargetUri,
                        });
                    }
                }
            })
                .catch((error) => {
                ctx.logError('Unhandled internal fetcher error', error);
                fetchResolve({
                    sourceId: sourceName,
                    sourceType,
                    code: UNHANDLED_INTERNAL_SERVER_ERROR,
                    uiUrl: userTargetUriUi,
                    dataUrl: publicTargetUri,
                    data: publicSourceData,
                    hideInInspector,
                    /** @deprecated use uiUrl or dataUrl */
                    url: userTargetUriUi || publicTargetUri,
                });
            })
                .finally(() => {
                if (signal.aborted) {
                    const code = signal.reason || REQUEST_CANCELLED;
                    fetchResolve({
                        sourceId: sourceName,
                        sourceType,
                        code,
                        uiUrl: userTargetUriUi,
                        dataUrl: publicTargetUri,
                        data: publicSourceData,
                        hideInInspector,
                        /** @deprecated use uiUrl or dataUrl */
                        url: userTargetUriUi || publicTargetUri,
                    });
                }
                DataFetcher.removeFromProcessingRequests(currentRequest, processingRequests);
            });
            processingRequests.push([currentRequest, abortController]);
        });
    }
}
exports.DataFetcher = DataFetcher;
async function sourceConfigCheck({ ctx, sourceName, sourceType, sourceConfig, targetUri, }) {
    if (!sourceConfig.check) {
        return { valid: true };
    }
    try {
        const checkResult = await sourceConfig.check(targetUri);
        if (checkResult === true) {
            ctx.log('Access to source allowed');
            return { valid: true };
        }
        else if (checkResult === false) {
            ctx.log('Access to source forbidden');
            return {
                valid: false,
                meta: {
                    sourceId: sourceName,
                    sourceType,
                    message: 'Access to source forbidden',
                },
            };
        }
        else {
            ctx.logError('Source access check failed');
            return {
                valid: false,
                meta: {
                    sourceId: sourceName,
                    sourceType,
                    message: 'Source access check failed',
                },
            };
        }
    }
    catch (error) {
        ctx.logError('Failed to run source check', error);
        return {
            valid: false,
            meta: {
                sourceId: sourceName,
                sourceType,
                message: 'Failed to run source check',
            },
        };
    }
}
