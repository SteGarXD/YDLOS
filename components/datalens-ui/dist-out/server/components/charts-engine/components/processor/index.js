"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = exports.SandboxError = void 0;
exports.stringifyLogs = stringifyLogs;
const helpers_1 = require("@gravity-ui/dashkit/helpers");
const nodekit_1 = require("@gravity-ui/nodekit");
const axios_1 = require("axios");
const json_fn_1 = __importDefault(require("json-fn"));
const lodash_1 = require("lodash");
const get_1 = __importDefault(require("lodash/get"));
const shared_1 = require("../../../../../shared");
const markdown_1 = require("../../../../../shared/modules/markdown/markdown");
const constants_1 = require("../../../../constants");
const color_palettes_1 = require("../../../../modes/charts/plugins/helpers/color-palettes");
const registry_1 = require("../../../../registry");
const constants_2 = require("../../constants");
const utils_1 = require("../utils");
const comments_fetcher_1 = require("./comments-fetcher");
const data_fetcher_1 = require("./data-fetcher");
const hooks_1 = require("./hooks");
const paramsUtils_1 = require("./paramsUtils");
const stack_trace_prepaper_1 = require("./stack-trace-prepaper");
const utils_2 = require("./utils");
const { CONFIG_LOADING_ERROR, CONFIG_TYPE, DATA_FETCHING_ERROR, DEFAULT_OVERSIZE_ERROR_STATUS, DEFAULT_RUNTIME_ERROR_STATUS, DEFAULT_RUNTIME_TIMEOUT_STATUS, DEFAULT_SOURCE_FETCHING_ERROR_STATUS_400, DEFAULT_SOURCE_FETCHING_ERROR_STATUS_500, DEFAULT_SOURCE_FETCHING_LIMIT_EXCEEDED_STATUS, DEPS_RESOLVE_ERROR, HOOKS_ERROR, ROWS_NUMBER_OVERSIZE, RUNTIME_ERROR, RUNTIME_TIMEOUT_ERROR, SEGMENTS_OVERSIZE, TABLE_OVERSIZE, REQUEST_SIZE_LIMIT_EXCEEDED, ALL_REQUESTS_SIZE_LIMIT_EXCEEDED, } = constants_2.config;
class SandboxError extends Error {
    constructor() {
        super(...arguments);
        this.code = RUNTIME_ERROR;
    }
}
exports.SandboxError = SandboxError;
function collectModulesLogs({ processedModules, logsStorage, }) {
    if (!processedModules) {
        return;
    }
    Object.keys(processedModules).forEach((moduleName) => {
        var _a;
        const module = processedModules[moduleName];
        (_a = module.logs) === null || _a === void 0 ? void 0 : _a.forEach((logLine) => {
            logLine.unshift({ type: 'string', value: `[${moduleName}]` });
        });
        logsStorage.modules = logsStorage.modules.concat(module.logs || []);
    });
}
function stringifyLogs({ logs, hooks, ctx, }) {
    try {
        const formatter = hooks.getLogsFormatter();
        return JSON.stringify(logs, (_, value) => {
            if (typeof value === 'number' && isNaN(value)) {
                return '__special_value__NaN';
            }
            if (value === Infinity) {
                return '__special_value__Infinity';
            }
            if (value === -Infinity) {
                return '__special_value__-Infinity';
            }
            return formatter ? formatter(value) : value;
        });
    }
    catch (e) {
        ctx.logError('Error during formatting logs', e);
        return '';
    }
}
function mergeArrayWithObject(a, b) {
    // for example, for xAxis/yAxis, when there is one axis on one side and several on the other
    // typeof === 'object' check in case there is, for example, a string
    if (Array.isArray(a) && b && typeof b === 'object' && !Array.isArray(b)) {
        return a.map((value) => (0, lodash_1.merge)(value, b));
    }
    return;
}
function logSandboxDuration(duration, filename, ctx) {
    ctx.log(`EditorEngineSandbox::Execution[${filename}]: ${duration[0]}s ${duration[1] / 1000000}ms`);
}
function logFetchingError(ctx, error) {
    const errMessage = 'Error fetching sources';
    if (error instanceof Error) {
        ctx.logError(errMessage, error);
    }
    else if ((0, lodash_1.isString)(error)) {
        ctx.logError(errMessage, Error(error));
    }
    else if ((0, lodash_1.isObject)(error) && 'code' in error && (0, lodash_1.isString)(error.code)) {
        ctx.logError(errMessage, Error(error.code));
    }
    else {
        ctx.logError(errMessage);
    }
}
class Processor {
    // eslint-disable-next-line complexity
    static async process({ subrequestHeaders, paramsOverride = {}, widgetConfig = {}, configOverride, userLang, userLogin, userId = null, iamToken = null, responseOptions = {}, uiOnly = false, isEditMode, configResolving, ctx, workbookId, builder, forbiddenFields, disableJSONFnByCookie, configName, configId, revId, isEmbed, zitadelParams, authParams, originalReqHeaders, adapterContext, hooksContext, telemetryCallbacks, cacheClient, hooks, sourcesConfig, secureConfig, defaultColorPaletteId, systemPalettes, }) {
        var _a, _b, _c, _d;
        const requestId = ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '';
        const logs = {
            modules: [],
        };
        let processedModules = {};
        let modulesLogsCollected = false;
        let resolvedSources;
        const config = configOverride;
        let params;
        let actionParams;
        let usedParams;
        const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
        const timings = {
            configResolving,
            dataFetching: null,
            jsExecution: null,
        };
        const onCodeExecuted = telemetryCallbacks.onCodeExecuted || (() => { });
        const onTabsExecuted = telemetryCallbacks.onTabsExecuted || (() => { });
        function injectConfigAndParams({ target }) {
            let responseConfig;
            const useChartsEngineResponseConfig = Boolean(isEnabledServerFeature(shared_1.Feature.UseChartsEngineResponseConfig));
            if (useChartsEngineResponseConfig && responseOptions.includeConfig && config) {
                responseConfig = config;
            }
            else {
                responseConfig = {
                    type: config.type,
                    meta: config.meta,
                    entryId: config.entryId,
                    key: config.key,
                    revId: config.revId,
                };
            }
            responseConfig.key = config.key || configName;
            responseConfig.entryId = config.entryId || configId;
            responseConfig.revId = config.revId || revId;
            target._confStorageConfig = responseConfig;
            target.key = responseConfig.key;
            target.id = responseConfig.entryId;
            target.type = responseConfig.type;
            target.revId = responseConfig.revId;
            if (params) {
                target.params = params;
            }
            if (actionParams) {
                target.actionParams = actionParams;
            }
            return target;
        }
        function injectLogs({ target, }) {
            if (responseOptions.includeLogs) {
                target.logs_v2 = stringifyLogs({ logs, hooks, ctx });
            }
        }
        try {
            let hrStart = process.hrtime();
            const type = config.meta.stype;
            config.type = type;
            ctx.log('EditorEngine::ConfigResolved', { duration: (0, utils_1.getDuration)(hrStart) });
            const resultHooksInit = await hooks.init({
                config: {
                    ...config,
                    entryId: config.entryId || configId,
                },
                isEditMode,
                ctx,
                hooksContext,
            });
            if (resultHooksInit.status === hooks_1.ProcessorHooks.STATUS.FAILED) {
                const { hookError, error } = resultHooksInit;
                if (hookError) {
                    return {
                        error: {
                            code: HOOKS_ERROR,
                            ...hookError,
                        },
                    };
                }
                else {
                    return {
                        error: {
                            code: HOOKS_ERROR,
                            message: 'Unhandled error init hooks',
                            debug: {
                                message: (0, utils_2.getMessageFromUnknownError)(error),
                            },
                        },
                    };
                }
            }
            hrStart = process.hrtime();
            try {
                processedModules = await builder.buildModules({
                    ctx,
                    subrequestHeaders,
                    onModuleBuild: ({ executionTiming, filename }) => {
                        logSandboxDuration(executionTiming, filename, ctx);
                    },
                });
            }
            catch (error) {
                ctx.logError('DEPS_RESOLVE_ERROR', error);
                if (!(0, lodash_1.isObject)(error)) {
                    return {
                        error: {
                            code: DEPS_RESOLVE_ERROR,
                            details: {
                                stackTrace: 'Error resolving required modules: internal error',
                            },
                            debug: {},
                        },
                    };
                }
                let reason = ('stackTrace' in error && error.stackTrace) || 'internal error';
                if ('status' in error) {
                    if (error.status === 403) {
                        reason = 'access denied';
                    }
                    else if (error.status === 404) {
                        reason = 'not found';
                    }
                }
                const sandboxErrorFilename = 'executionResult' in error &&
                    (0, lodash_1.isObject)(error.executionResult) &&
                    'filename' in error.executionResult
                    ? (_a = error.executionResult) === null || _a === void 0 ? void 0 : _a.filename
                    : null;
                const axiosErrorFileName = error instanceof axios_1.AxiosError && 'description' in error
                    ? error.description
                    : null;
                const filename = sandboxErrorFilename || axiosErrorFileName || 'required modules';
                const stackTraceText = 'description' in error ? error.description : `module (${filename}): ${reason}`;
                return {
                    error: {
                        code: DEPS_RESOLVE_ERROR,
                        details: {
                            stackTrace: `Error resolving ${stackTraceText}`,
                        },
                        statusCode: 'status' in error && (0, lodash_1.isNumber)(error.status) ? error.status : undefined,
                        debug: {
                            message: (0, utils_2.getMessageFromUnknownError)(error),
                        },
                    },
                };
            }
            ctx.log('EditorEngine::DepsResolved', { duration: (0, utils_1.getDuration)(hrStart) });
            hrStart = process.hrtime();
            ctx.log('EditorEngine::DepsProcessed', { duration: (0, utils_1.getDuration)(hrStart) });
            try {
                await builder.buildShared();
            }
            catch (error) {
                ctx.logError('Error during shared tab parsing', error);
                logs.Shared = [[{ type: 'string', value: 'Invalid JSON in Shared tab' }]];
                const failedResponse = {
                    error: {
                        code: RUNTIME_ERROR,
                        details: {
                            description: 'Invalid JSON in Shared tab',
                        },
                        debug: {
                            message: (0, utils_2.getMessageFromUnknownError)(error),
                        },
                    },
                };
                injectLogs({ target: failedResponse });
                return failedResponse;
            }
            const { params: normalizedParamsOverride, actionParams: normalizedActionParamsOverride } = (0, utils_1.normalizeParams)(paramsOverride);
            hrStart = process.hrtime();
            usedParams = {};
            const paramsTabResults = await builder.buildParams({
                params: normalizedParamsOverride,
                usedParams: usedParams,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            logSandboxDuration(paramsTabResults.executionTiming, paramsTabResults.name, ctx);
            const paramsTabError = paramsTabResults.runtimeMetadata.error;
            if (paramsTabError) {
                throw paramsTabError;
            }
            ctx.log('EditorEngine::Params', { duration: (0, utils_1.getDuration)(hrStart) });
            usedParams = {
                ...paramsTabResults.exports,
                ...usedParams,
            };
            // Merge used to be here. Merge in this situation does not work as it should for arrays, so assign.
            params = Object.assign({}, usedParams, normalizedParamsOverride);
            actionParams = Object.assign({}, {}, normalizedActionParamsOverride);
            Object.keys(params).forEach((paramName) => {
                const param = params[paramName];
                if (!Array.isArray(param)) {
                    params[paramName] = [param];
                }
            });
            // take values from params in usedParams there are always only defaults exported from the Params tab
            // and in params new passed parameters
            Object.keys(usedParams).forEach((paramName) => {
                usedParams[paramName] = params[paramName];
            });
            // Editor.updateParams() has the highest priority,
            // therefore, now we take the parameters set through this method
            (0, paramsUtils_1.updateParams)({
                userParamsOverride: paramsTabResults.runtimeMetadata.userParamsOverride,
                params,
                usedParams,
            });
            actionParams = (0, paramsUtils_1.updateActionParams)({
                userActionParamsOverride: paramsTabResults.runtimeMetadata.userActionParamsOverride,
                actionParams,
            });
            if (paramsTabResults.logs) {
                logs.Params = paramsTabResults.logs;
            }
            (0, utils_1.resolveParams)(params);
            hrStart = process.hrtime();
            const sourcesTabResults = await builder.buildUrls({
                params,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            logSandboxDuration(sourcesTabResults.executionTiming, sourcesTabResults.name, ctx);
            ctx.log('EditorEngine::Sources', { duration: (0, utils_1.getDuration)(hrStart) });
            logs.Sources = sourcesTabResults.logs;
            try {
                hrStart = process.hrtime();
                const sourcesTabError = sourcesTabResults.runtimeMetadata.error;
                if (sourcesTabError) {
                    throw sourcesTabError;
                }
                let sources = sourcesTabResults.exports;
                if (uiOnly) {
                    const filteredSources = {};
                    Object.keys(sources).forEach((key) => {
                        const source = sources[key];
                        if ((0, lodash_1.isObject)(source) && source.ui) {
                            filteredSources[key] = source;
                        }
                    });
                    sources = filteredSources;
                }
                if ((config === null || config === void 0 ? void 0 : config.entryId) || configId) {
                    let dlContext = {};
                    if (subrequestHeaders[shared_1.DL_CONTEXT_HEADER]) {
                        const dlContextHeader = subrequestHeaders[shared_1.DL_CONTEXT_HEADER];
                        dlContext = JSON.parse(dlContextHeader && !Array.isArray(dlContextHeader)
                            ? dlContextHeader
                            : '');
                    }
                    dlContext.chartId = (config === null || config === void 0 ? void 0 : config.entryId) || configId;
                    if (subrequestHeaders['x-chart-kind']) {
                        dlContext.chartKind = subrequestHeaders['x-chart-kind'];
                    }
                    subrequestHeaders[shared_1.DL_CONTEXT_HEADER] = JSON.stringify(dlContext);
                }
                resolvedSources = await data_fetcher_1.DataFetcher.fetch({
                    sources,
                    ctx,
                    iamToken,
                    subrequestHeaders,
                    userId,
                    userLogin,
                    workbookId,
                    isEmbed,
                    zitadelParams,
                    authParams,
                    originalReqHeaders,
                    adapterContext,
                    telemetryCallbacks,
                    cacheClient,
                    sourcesConfig,
                });
                if (Object.keys(resolvedSources).length) {
                    timings.dataFetching = (0, utils_1.getDuration)(hrStart);
                }
                ctx.log('EditorEngine::DataFetched', { duration: (0, utils_1.getDuration)(hrStart) });
            }
            catch (error) {
                logFetchingError(ctx, error);
                if (!modulesLogsCollected) {
                    collectModulesLogs({ logsStorage: logs, processedModules });
                }
                if (!(0, lodash_1.isObject)(error)) {
                    return { error: 'Internal fetching error' };
                }
                const response = {
                    error: {
                        code: DATA_FETCHING_ERROR,
                        debug: {
                            message: (0, utils_2.getMessageFromUnknownError)(error),
                            ...('debug' in error && error.debug ? error.debug : {}),
                        },
                    },
                };
                if ('status' in error) {
                    if (error.status === 403) {
                        response.error.code = 'ENTRY_FORBIDDEN';
                    }
                    else if (error.status === 404) {
                        response.error.code = 'ENTRY_NOT_FOUND';
                    }
                }
                injectLogs({ target: response });
                if (error instanceof Error) {
                    return { error: 'Internal fetching error' };
                }
                else if (!response.error.details) {
                    response.error.details = {
                        sources: error,
                    };
                    let maybe400 = false;
                    let maybe500 = false;
                    let requestSizeLimitExceeded = false;
                    Object.values(error).forEach((sourceResult) => {
                        const possibleStatus = sourceResult && sourceResult.status;
                        if (399 < possibleStatus && possibleStatus < 500) {
                            maybe400 = true;
                        }
                        else {
                            maybe500 = true;
                        }
                        if (sourceResult.code === REQUEST_SIZE_LIMIT_EXCEEDED ||
                            sourceResult.code === ALL_REQUESTS_SIZE_LIMIT_EXCEEDED) {
                            requestSizeLimitExceeded = true;
                        }
                    });
                    if (maybe400 && !maybe500) {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_ERROR_STATUS_400;
                    }
                    else if (requestSizeLimitExceeded) {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_LIMIT_EXCEEDED_STATUS;
                    }
                    else {
                        response.error.statusCode = DEFAULT_SOURCE_FETCHING_ERROR_STATUS_500;
                    }
                }
                return response;
            }
            const data = Object.keys(resolvedSources).reduce((acc, sourceName) => {
                if (resolvedSources) {
                    acc[sourceName] = resolvedSources[sourceName].body;
                    // @ts-ignore body not optional;
                    delete resolvedSources[sourceName].body;
                }
                return acc;
            }, {});
            const { colorPalettes: tenantColorPalettes } = (0, color_palettes_1.extractColorPalettesFromData)(data);
            hrStart = process.hrtime();
            const libraryTabResult = await builder.buildChartLibraryConfig({
                data,
                params,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            ctx.log('EditorEngine::HighCharts', { duration: (0, utils_1.getDuration)(hrStart) });
            let libraryConfig;
            if (libraryTabResult) {
                logSandboxDuration(libraryTabResult.executionTiming, libraryTabResult.name, ctx);
                libraryConfig = libraryTabResult.exports || {};
                logs.Highcharts = libraryTabResult.logs;
                const libraryError = libraryTabResult.runtimeMetadata.error;
                if (libraryError) {
                    throw libraryTabResult.runtimeMetadata.error;
                }
            }
            else {
                libraryConfig = {};
            }
            let userConfig = {};
            let processedData;
            let jsTabResults;
            if (!uiOnly) {
                hrStart = process.hrtime();
                const configTabResults = await builder.buildChartConfig({
                    data,
                    params,
                    actionParams: normalizedActionParamsOverride,
                    hooks,
                });
                logSandboxDuration(configTabResults.executionTiming, configTabResults.name, ctx);
                ctx.log('EditorEngine::Config', { duration: (0, utils_1.getDuration)(hrStart) });
                logs.Config = configTabResults.logs;
                userConfig = configTabResults.exports;
                hrStart = process.hrtime();
                jsTabResults = await builder.buildChart({
                    data,
                    sources: resolvedSources,
                    params,
                    usedParams,
                    actionParams: normalizedActionParamsOverride,
                    hooks,
                });
                logSandboxDuration(jsTabResults.executionTiming, jsTabResults.name, ctx);
                timings.jsExecution = (0, utils_1.getDuration)(hrStart);
                const hrEnd = process.hrtime();
                const hrDuration = [hrEnd[0] - hrStart[0], hrEnd[1] - hrStart[1]];
                onCodeExecuted({
                    id: `${config.entryId || configId}:${config.key || configName}`,
                    requestId,
                    latency: (hrDuration[0] * 1e9 + hrDuration[1]) / 1e6,
                });
                ctx.log('EditorEngine::Prepare', { duration: (0, utils_1.getDuration)(hrStart) });
                processedData = jsTabResults.exports;
                logs.Prepare = jsTabResults.logs;
                const jsError = jsTabResults.runtimeMetadata.error;
                if (jsError) {
                    throw jsError;
                }
                // Editor.updateParams() has the highest priority,
                // so now we take the parameters set through this method
                (0, paramsUtils_1.updateParams)({
                    userParamsOverride: jsTabResults.runtimeMetadata.userParamsOverride,
                    params,
                    usedParams,
                });
            }
            const uiTabResults = await builder.buildUI({
                data,
                params,
                usedParams,
                actionParams: normalizedActionParamsOverride,
                hooks,
            });
            logSandboxDuration(uiTabResults.executionTiming, uiTabResults.name, ctx);
            const uiTabExports = uiTabResults.exports;
            let uiScheme = null;
            if (uiTabExports &&
                (Array.isArray(uiTabExports) ||
                    ((0, lodash_1.isObject)(uiTabExports) &&
                        'controls' in uiTabExports &&
                        Array.isArray(uiTabExports.controls)))) {
                uiScheme = uiTabExports;
                if (secureConfig === null || secureConfig === void 0 ? void 0 : secureConfig.privateParams) {
                    const controls = Array.isArray(uiScheme) ? uiScheme : uiScheme.controls;
                    controls.forEach((control) => {
                        var _a;
                        if ((_a = secureConfig.privateParams) === null || _a === void 0 ? void 0 : _a.includes(control.param)) {
                            control.disabled = true;
                        }
                    });
                }
            }
            logs.Controls = uiTabResults.logs;
            ctx.log('EditorEngine::Controls', { duration: (0, utils_1.getDuration)(hrStart) });
            // Editor.updateParams() has the highest priority,
            // so now we take the parameters set through this method
            (0, paramsUtils_1.updateParams)({
                userParamsOverride: uiTabResults.runtimeMetadata.userParamsOverride,
                params,
                usedParams,
            });
            if (uiScheme && userConfig && !userConfig.overlayControls) {
                userConfig.notOverlayControls = true;
            }
            collectModulesLogs({ processedModules, logsStorage: logs });
            modulesLogsCollected = true;
            const normalizedDefaultParams = (0, utils_1.normalizeParams)(paramsTabResults.exports);
            const result = {
                sources: resolvedSources,
                uiScheme,
                params: { ...params, ...(0, helpers_1.transformParamsToActionParams)(actionParams) },
                usedParams,
                actionParams,
                widgetConfig,
                defaultParams: normalizedDefaultParams.params,
                extra: {},
                timings,
            };
            injectLogs({ target: result });
            if (!uiOnly && jsTabResults) {
                result.data = processedData;
                let resultConfig = (0, lodash_1.merge)({}, userConfig, jsTabResults.runtimeMetadata.userConfigOverride);
                let resultLibraryConfig = (0, lodash_1.mergeWith)({}, libraryConfig, jsTabResults.runtimeMetadata.libraryConfigOverride, (a, b) => {
                    return mergeArrayWithObject(a, b) || mergeArrayWithObject(b, a);
                });
                onTabsExecuted({
                    result: {
                        config: resultConfig,
                        highchartsConfig: resultLibraryConfig,
                        processedData,
                        sources: resolvedSources,
                        sourceData: data,
                    },
                    entryId: config.entryId || configId,
                });
                const disableFnAndHtml = isEnabledServerFeature(shared_1.Feature.DisableFnAndHtml);
                if (disableFnAndHtml ||
                    !(0, utils_2.isChartWithJSAndHtmlAllowed)({ createdAt: config.createdAt })) {
                    resultConfig.enableJsAndHtml = false;
                }
                const enableJsAndHtml = (0, get_1.default)(resultConfig, 'enableJsAndHtml', false);
                const disableJSONFn = isEnabledServerFeature(shared_1.Feature.NoJsonFn) ||
                    disableJSONFnByCookie ||
                    enableJsAndHtml === false;
                const stringify = disableJSONFn ? JSON.stringify : json_fn_1.default.stringify;
                if (builder.type === 'CHART_EDITOR' && disableJSONFn) {
                    resultConfig = (0, utils_2.cleanJSONFn)(resultConfig);
                    resultLibraryConfig = (0, utils_2.cleanJSONFn)(resultLibraryConfig);
                }
                result.config = stringify(resultConfig);
                result.publicAuthor = config.publicAuthor;
                result.highchartsConfig = stringify(resultLibraryConfig);
                result.extra = jsTabResults.runtimeMetadata.extra || {};
                result.extra.chartsInsights = jsTabResults.runtimeMetadata.chartsInsights;
                result.extra.sideMarkdown = jsTabResults.runtimeMetadata.sideMarkdown;
                result.dataExport = (0, lodash_1.mapValues)(data, (sourceResponse) => {
                    if (typeof sourceResponse === 'object' &&
                        sourceResponse &&
                        'data_export' in sourceResponse) {
                        return sourceResponse.data_export;
                    }
                    return undefined;
                });
                const colors = (0, constants_1.selectServerPalette)({
                    defaultColorPaletteId: defaultColorPaletteId !== null && defaultColorPaletteId !== void 0 ? defaultColorPaletteId : '',
                    customColorPalettes: tenantColorPalettes,
                    availablePalettes: systemPalettes !== null && systemPalettes !== void 0 ? systemPalettes : {},
                });
                if (!(0, lodash_1.isEmpty)(colors)) {
                    result.extra.colors = colors;
                }
                result.sources = (0, lodash_1.merge)(resolvedSources, jsTabResults.runtimeMetadata.dataSourcesInfos);
                if (jsTabResults.runtimeMetadata.exportFilename) {
                    result.extra.exportFilename = jsTabResults.runtimeMetadata.exportFilename;
                }
                ctx.log('EditorEngine::Postprocessing', { duration: (0, utils_1.getDuration)(hrStart) });
                if (((_b = ctx.config.chartsEngineConfig.flags) === null || _b === void 0 ? void 0 : _b.chartComments) &&
                    (type === CONFIG_TYPE.GRAPH_NODE ||
                        type === CONFIG_TYPE.GRAPH_WIZARD_NODE ||
                        type === CONFIG_TYPE.GRAPH_QL_NODE ||
                        type === shared_1.WizardType.GravityChartsWizardNode)) {
                    try {
                        const chartName = type === CONFIG_TYPE.GRAPH_NODE || type === CONFIG_TYPE.GRAPH_QL_NODE
                            ? configName
                            : configId;
                        hrStart = process.hrtime();
                        if (type === shared_1.WizardType.GravityChartsWizardNode) {
                            result.comments = await comments_fetcher_1.CommentsFetcher.prepareGravityChartsComments({
                                chartName,
                                config: resultConfig.comments,
                                data: result.data,
                                params,
                            }, subrequestHeaders, ctx);
                        }
                        else {
                            result.comments = await comments_fetcher_1.CommentsFetcher.prepareComments({
                                chartName,
                                config: resultConfig.comments,
                                data: result.data,
                                params,
                            }, subrequestHeaders, ctx);
                        }
                        ctx.log('EditorEngine::Comments', { duration: (0, utils_1.getDuration)(hrStart) });
                    }
                    catch (error) {
                        ctx.logError('Error preparing comments', error);
                    }
                }
                if (type === CONFIG_TYPE.MARKDOWN_NODE) {
                    try {
                        if (!(((_c = result.data) === null || _c === void 0 ? void 0 : _c.markdown) || ((_d = result.data) === null || _d === void 0 ? void 0 : _d.html))) {
                            throw Error('Empty markdown or html');
                        }
                        const markdown = result.data.markdown || result.data.html;
                        const html = (0, markdown_1.renderHTML)({
                            text: markdown || '',
                            lang: userLang || '',
                            plugins: registry_1.registry.getYfmPlugins(),
                        });
                        result.data.original_markdown = markdown;
                        delete result.data.markdown;
                        result.data.html = html.result;
                        result.data.meta = html.meta;
                    }
                    catch (error) {
                        ctx.logError('Error render markdown', error);
                    }
                }
            }
            injectConfigAndParams({ target: result });
            if (forbiddenFields) {
                forbiddenFields.forEach((field) => {
                    if (result[field]) {
                        delete result[field];
                    }
                });
            }
            return result;
        }
        catch (error) {
            ctx.logError('Run failed', error);
            const isError = (error) => {
                return (0, lodash_1.isObject)(error);
            };
            if (!isError(error)) {
                throw error;
            }
            const executionResult = error.executionResult || {};
            if (!modulesLogsCollected) {
                collectModulesLogs({ logsStorage: logs, processedModules });
            }
            const failedLogs = executionResult.logs;
            if (failedLogs) {
                logs[executionResult.filename || 'failed'] = failedLogs;
            }
            const result = {};
            injectLogs({ target: result });
            switch (error.code) {
                case CONFIG_LOADING_ERROR:
                case DEPS_RESOLVE_ERROR:
                case DATA_FETCHING_ERROR:
                    result.error = error;
                    break;
                case ROWS_NUMBER_OVERSIZE:
                case SEGMENTS_OVERSIZE:
                case TABLE_OVERSIZE:
                    result.error = {
                        code: error.code,
                        details: error.details,
                        statusCode: DEFAULT_OVERSIZE_ERROR_STATUS,
                    };
                    break;
                case RUNTIME_ERROR:
                    executionResult.stackTrace =
                        executionResult.stackTrace || executionResult.stack;
                    if (resolvedSources) {
                        result.sources = resolvedSources;
                    }
                    result.error = {
                        code: RUNTIME_ERROR,
                        details: {
                            stackTrace: executionResult.stackTrace
                                ? stack_trace_prepaper_1.StackTracePreparer.prepare(executionResult.stackTrace)
                                : '',
                            tabName: error.executionResult ? error.executionResult.filename : '',
                        },
                        statusCode: DEFAULT_RUNTIME_ERROR_STATUS,
                    };
                    break;
                case RUNTIME_TIMEOUT_ERROR:
                    result.error = {
                        code: RUNTIME_TIMEOUT_ERROR,
                        statusCode: DEFAULT_RUNTIME_TIMEOUT_STATUS,
                    };
                    onCodeExecuted({
                        id: `${configId}:${configName}`,
                        requestId,
                        latency: executionResult.executionTiming
                            ? (executionResult.executionTiming[0] * 1e9 +
                                executionResult.executionTiming[1]) /
                                1e6
                            : 0,
                    });
                    break;
                default:
                    throw error;
            }
            const tabName = (error.executionResult && error.executionResult.filename) || 'script';
            const message = `EXECUTION_ERROR Error processing ${tabName}\n${error.stackTrace}`;
            ctx.log(message, {
                stackTrace: error.stackTrace,
                tabName,
            });
            return {
                error: result.error,
                logs_v2: result.logs_v2,
                sources: result.sources,
            };
        }
        finally {
            builder.dispose();
        }
    }
}
exports.Processor = Processor;
