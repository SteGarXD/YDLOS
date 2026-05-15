"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSerializableProcessorParams = void 0;
exports.engineProcessingCallback = engineProcessingCallback;
exports.commonRunner = commonRunner;
const lodash_1 = require("lodash");
const shared_1 = require("../../../../shared");
const registry_1 = require("../../../registry");
const processor_1 = require("../components/processor");
const hooks_1 = require("../components/processor/hooks");
const utils_1 = require("../components/utils");
const utils_2 = require("./utils");
function engineProcessingCallback({ ctx, hrStart, processorParams, runnerType, }) {
    const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
    const enableChartEditor = isEnabledServerFeature('EnableChartEditor') && runnerType === 'Editor';
    const showChartsEngineDebugInfo = Boolean(isEnabledServerFeature(shared_1.Feature.ShowChartsEngineDebugInfo));
    return processor_1.Processor.process({ ...processorParams, ctx: ctx })
        .then((result) => {
        ctx.log(`${runnerType}::FullRun`, { duration: (0, utils_1.getDuration)(hrStart) });
        if (result) {
            const showLogs = showChartsEngineDebugInfo || (enableChartEditor && processorParams.isEditMode);
            if ('logs_v2' in result && !showLogs) {
                delete result.logs_v2;
            }
            if ('error' in result) {
                const resultCopy = { ...result };
                if ('_confStorageConfig' in resultCopy) {
                    delete resultCopy._confStorageConfig;
                }
                const logError = (0, utils_2.prepareErrorForLogger)(result.error);
                ctx.log('PROCESSED_WITH_ERRORS', { error: logError });
                let statusCode = 500;
                if ((0, lodash_1.isObject)(result.error) && !showChartsEngineDebugInfo) {
                    const { error } = result;
                    if ('debug' in error) {
                        delete error.debug;
                    }
                    const { details } = error;
                    if (details) {
                        delete details.stackTrace;
                        if (details.sources) {
                            const { sources } = details;
                            Object.keys(sources).forEach((source) => {
                                if (sources[source]) {
                                    const { body } = sources[source];
                                    if (body) {
                                        delete body.debug;
                                    }
                                }
                            });
                        }
                    }
                }
                if ((0, lodash_1.isObject)(result.error) && result.error.statusCode) {
                    statusCode = result.error.statusCode;
                    delete result.error.statusCode;
                }
                return { status: statusCode, payload: result };
            }
            else {
                ctx.log('PROCESSED_SUCCESSFULLY');
                return { status: 200, payload: result };
            }
        }
        else {
            throw new Error('INVALID_PROCESSING_RESULT');
        }
    })
        .catch((error) => {
        ctx.logError('PROCESSING_FAILED', error);
        if (Number(error.statusCode) >= 200 && Number(error.statusCode) < 400) {
            return {
                status: 500,
                payload: {
                    error: {
                        code: 'ERR.CHARTS.INVALID_SET_ERROR_USAGE',
                        message: 'Only 4xx/5xx error status codes valid for .setError',
                    },
                },
            };
        }
        else {
            const result = {
                error: {
                    ...error,
                    code: error.code || 'ERR.CHARTS.UNHANDLED_ERROR',
                    debug: {
                        message: error.message,
                        ...(error.debug || {}),
                    },
                },
            };
            if (!showChartsEngineDebugInfo) {
                delete result.error.debug;
                if (result.error.details) {
                    delete result.error.details.stackTrace;
                }
            }
            return { status: error.statusCode || 500, payload: result };
        }
    });
}
const getSerializableProcessorParams = ({ res, req, ctx, configResolving, generatedConfig, workbookId, localConfig, subrequestHeadersKind, forbiddenFields, secureConfig, }) => {
    var _a, _b, _c, _d;
    const { params, actionParams, widgetConfig } = req.body;
    const iamToken = (_b = (_a = res === null || res === void 0 ? void 0 : res.locals) === null || _a === void 0 ? void 0 : _a.iamToken) !== null && _b !== void 0 ? _b : req.headers[ctx.config.headersMap.subjectToken];
    const configName = req.body.key;
    const configId = req.body.id;
    const disableJSONFnByCookie = req.cookies[shared_1.DISABLE_JSONFN_SWITCH_MODE_COOKIE_NAME] === shared_1.DISABLE;
    const isEmbed = req.headers[shared_1.DL_EMBED_TOKEN_HEADER] !== undefined;
    const zitadelParams = ctx.config.isZitadelEnabled
        ? {
            accessToken: (_c = req.user) === null || _c === void 0 ? void 0 : _c.accessToken,
            serviceUserAccessToken: req.serviceUserAccessToken,
        }
        : undefined;
    const authParams = ctx.config.isAuthEnabled
        ? {
            accessToken: (_d = req.ctx.get('user')) === null || _d === void 0 ? void 0 : _d.accessToken,
        }
        : undefined;
    const originalReqHeaders = {
        xRealIP: req.headers['x-real-ip'],
        xForwardedFor: req.headers['x-forwarded-for'],
        xChartsFetcherVia: req.headers['x-charts-fetcher-via'],
        referer: req.headers.referer,
    };
    const adapterContext = {
        headers: {
            ['x-forwarded-for']: req.headers['x-forwarded-for'],
            cookie: req.headers.cookie,
        },
    };
    const hooksContext = {
        headers: {
            cookie: req.headers.cookie,
            authorization: req.headers.authorization,
        },
    };
    const getAvailablePalettesMap = registry_1.registry.common.functions.get('getAvailablePalettesMap');
    const processorParams = {
        paramsOverride: params,
        actionParamsOverride: actionParams,
        widgetConfig,
        userLang: res.locals && res.locals.lang,
        userLogin: res.locals && res.locals.login,
        userId: res.locals && res.locals.userId,
        subrequestHeaders: res.locals.subrequestHeaders,
        iamToken,
        isEditMode: Boolean(res.locals.editMode),
        configResolving,
        cacheToken: req.headers['x-charts-cache-token'] || null,
        forbiddenFields,
        secureConfig,
        configName,
        configId,
        revId: localConfig === null || localConfig === void 0 ? void 0 : localConfig.revId,
        disableJSONFnByCookie,
        isEmbed,
        zitadelParams,
        authParams,
        originalReqHeaders,
        adapterContext,
        hooksContext,
        configOverride: generatedConfig,
        defaultColorPaletteId: (0, utils_1.getDefaultColorPaletteId)({
            ctx,
            tenantSettings: localConfig === null || localConfig === void 0 ? void 0 : localConfig.tenantSettings,
        }),
        systemPalettes: getAvailablePalettesMap(),
    };
    const configWorkbook = workbookId !== null && workbookId !== void 0 ? workbookId : localConfig === null || localConfig === void 0 ? void 0 : localConfig.workbookId;
    if (configWorkbook) {
        processorParams.workbookId = configWorkbook;
    }
    if (req.body.uiOnly) {
        processorParams.uiOnly = true;
    }
    processorParams.responseOptions = req.body.responseOptions || {};
    if (processorParams.responseOptions &&
        typeof processorParams.responseOptions.includeLogs === 'undefined') {
        processorParams.responseOptions.includeLogs = true;
    }
    if (subrequestHeadersKind &&
        processorParams.subrequestHeaders &&
        typeof processorParams.subrequestHeaders['x-chart-kind'] === 'undefined') {
        processorParams.subrequestHeaders['x-chart-kind'] = subrequestHeadersKind;
    }
    return processorParams;
};
exports.getSerializableProcessorParams = getSerializableProcessorParams;
function commonRunner({ res, req, ctx, chartType, chartsEngine, configResolving, builder, generatedConfig, workbookId, localConfig, runnerType, hrStart, subrequestHeadersKind, forbiddenFields, secureConfig, }) {
    const telemetryCallbacks = chartsEngine.telemetryCallbacks;
    const cacheClient = chartsEngine.cacheClient;
    const sourcesConfig = chartsEngine.sources;
    const hooks = new hooks_1.ProcessorHooks({ processorHooks: chartsEngine.processorHooks });
    res.locals.subrequestHeaders['x-chart-kind'] = chartType;
    const serializableProcessorParams = (0, exports.getSerializableProcessorParams)({
        res,
        req,
        ctx,
        configResolving,
        generatedConfig,
        workbookId,
        localConfig,
        subrequestHeadersKind,
        forbiddenFields,
    });
    ctx.log(`${runnerType}::PreRun`, { duration: (0, utils_1.getDuration)(hrStart) });
    return ctx
        .call('engineProcessing', (cx) => {
        return engineProcessingCallback({
            ctx: cx,
            hrStart,
            processorParams: {
                ...serializableProcessorParams,
                telemetryCallbacks,
                cacheClient,
                builder,
                hooks,
                sourcesConfig,
                secureConfig,
            },
            runnerType: runnerType,
        });
    })
        .then((result) => {
        res.status(result.status).send(result.payload);
    })
        .catch((error) => {
        ctx.logError('CHARTS_ENGINE_PROCESSOR_UNHANDLED_ERROR', error);
        res.status(500).send('Internal error');
    })
        .finally(() => {
        ctx.end();
    });
}
