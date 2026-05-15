"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedsController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const get_1 = __importDefault(require("lodash/get"));
const isObject_1 = __importDefault(require("lodash/isObject"));
const shared_1 = require("../../../../shared");
const storage_1 = require("../components/storage");
const utils_1 = require("../components/utils");
const isControlDisabled = (controlData, embeddingInfo, controlTab) => {
    if ((controlData.sourceType !== shared_1.DashTabItemControlSourceType.Dataset &&
        controlData.sourceType !== shared_1.DashTabItemControlSourceType.Manual) ||
        // dash doesn't support publicParamsMode
        embeddingInfo.embed.publicParamsMode) {
        return false;
    }
    const controlSource = controlData.source;
    const controlParam = 'datasetFieldId' in controlSource ? controlSource.datasetFieldId : controlSource.fieldName;
    const tabAliases = controlTab.aliases[controlData.namespace];
    const aliasesParamsList = tabAliases === null || tabAliases === void 0 ? void 0 : tabAliases.find((alias) => alias.includes(controlParam));
    const forbiddenParams = embeddingInfo.embed.privateParams.concat(embeddingInfo.token.params ? Object.keys(embeddingInfo.token.params) : []);
    return aliasesParamsList
        ? aliasesParamsList.some((alias) => forbiddenParams.includes(alias))
        : forbiddenParams.includes(controlParam);
};
const isResponseError = (error) => {
    return Boolean((0, isObject_1.default)(error) && 'response' in error && error.response);
};
function validateEmbedToken(req, ctx, res) {
    const embedToken = Array.isArray(req.headers[shared_1.DL_EMBED_TOKEN_HEADER])
        ? ''
        : req.headers[shared_1.DL_EMBED_TOKEN_HEADER];
    if (!embedToken) {
        ctx.log('CHARTS_ENGINE_NO_TOKEN');
        res.status(400).send({
            code: shared_1.ErrorCode.TokenNotFound,
            extra: {
                message: 'You must provide embedToken',
                hideRetry: true,
                hideDebugInfo: true,
            },
        });
        return null;
    }
    const payload = jsonwebtoken_1.default.decode(embedToken);
    if (!payload || typeof payload === 'string' || !('embedId' in payload)) {
        ctx.log('CHARTS_ENGINE_WRONG_TOKEN');
        res.status(400).send({
            code: shared_1.ErrorCode.InvalidToken,
            extra: { message: 'Wrong token format', hideRetry: true, hideDebugInfo: true },
        });
        return null;
    }
    const embedId = payload.embedId;
    // Update subrequest headers
    res.locals.subrequestHeaders = {
        ...res.locals.subrequestHeaders,
        [shared_1.DL_EMBED_TOKEN_HEADER]: embedToken,
    };
    return { embedToken, embedId };
}
function handleError(error, ctx, res, defaultCode = 'ERR.CHARTS.CONFIG_LOADING_ERROR', errorLog = 'CHARTS_ENGINE_RUNNER_ERROR') {
    var _a, _b;
    // Handle specific error cases for outdated dependencies
    if (isResponseError(error) &&
        (((_a = error.response) === null || _a === void 0 ? void 0 : _a.data.code) === shared_1.ErrorCode.IncorrectEntry ||
            ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data.code) === shared_1.ErrorCode.IncorrectDepsIds)) {
        res.status(409).send({
            code: shared_1.ErrorCode.OutdatedDependencies,
            extra: {
                message: 'Dependencies of embed are outdated',
                hideRetry: true,
                hideDebugInfo: true,
            },
        });
        return;
    }
    const typedError = (0, isObject_1.default)(error) && 'message' in error ? error : new Error(error);
    const status = (typedError.response && typedError.response.status) || typedError.status || 500;
    const errorCode = (typedError.response && typedError.response.status) || typedError.status || defaultCode;
    ctx.logError(errorLog, typedError);
    res.status(status).send({
        code: errorCode,
        error: {
            code: errorCode,
            details: {
                code: status,
            },
            extra: {
                hideRetry: false,
                hideDebugInfo: true,
            },
        },
    });
}
function processControlWidget(controlData, embeddingInfo, res) {
    if (!(0, utils_1.isDashEntry)(embeddingInfo.entry)) {
        return null;
    }
    const controlTab = (controlData === null || controlData === void 0 ? void 0 : controlData.tabId)
        ? embeddingInfo.entry.data.tabs.find((tab) => tab.id === (controlData === null || controlData === void 0 ? void 0 : controlData.tabId))
        : null;
    // Support group and old single selectors
    const controlWidgetId = controlData.widgetId || controlData.id;
    const controlWidgetConfig = controlTab === null || controlTab === void 0 ? void 0 : controlTab.items.find(({ id }) => id === controlWidgetId);
    // Early return if control widget config is not found or has invalid type
    if (!controlTab ||
        !controlWidgetConfig ||
        (controlWidgetConfig.type !== shared_1.DashTabItemType.Control &&
            controlWidgetConfig.type !== shared_1.DashTabItemType.GroupControl)) {
        res.status(404).send({
            error: 'Сonfig was not found',
        });
        return null;
    }
    const sharedData = controlWidgetConfig.type === shared_1.DashTabItemType.GroupControl
        ? controlWidgetConfig.data.group.find(({ id }) => id === controlData.id)
        : controlWidgetConfig.data;
    if (!sharedData) {
        res.status(404).send({
            error: 'Сonfig was not found',
        });
        return null;
    }
    sharedData.disabled = isControlDisabled(sharedData, embeddingInfo, controlTab);
    return {
        data: { shared: sharedData },
        meta: { stype: shared_1.ControlType.Dash },
    };
}
function processEntry(controlData, embeddingInfo, res) {
    if (controlData && (0, utils_1.isDashEntry)(embeddingInfo.entry)) {
        return processControlWidget(controlData, embeddingInfo, res);
    }
    if (embeddingInfo.entry.scope === shared_1.EntryScope.Widget) {
        return embeddingInfo.entry;
    }
    // Invalid entry type
    res.status(400).send({
        code: shared_1.ErrorCode.InvalidToken,
        extra: {
            message: 'Invalid token',
            hideRetry: true,
            hideDebugInfo: true,
        },
    });
    return null;
}
async function filterParams({ params = {}, embeddingInfo, ctx, }) {
    var _a, _b, _c;
    if (!params || Object.keys(params).length === 0) {
        return { params: { ...embeddingInfo.token.params } };
    }
    const filteredParams = {};
    let forbiddenParamsSet;
    if (embeddingInfo.embed.publicParamsMode && ((_a = embeddingInfo.embed.unsignedParams) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        // public params mode is enabled
        const unsignedParamsSet = new Set(embeddingInfo.embed.unsignedParams);
        Object.keys(params).forEach((key) => {
            if (unsignedParamsSet.has(key)) {
                filteredParams[key] = params[key];
            }
        });
    }
    else if (!embeddingInfo.embed.publicParamsMode &&
        ((_b = embeddingInfo.embed.privateParams) === null || _b === void 0 ? void 0 : _b.length) === 0) {
        // privateParams mode is enabled, but params are not added
        Object.assign(filteredParams, params);
    }
    else if (!embeddingInfo.embed.publicParamsMode &&
        ((_c = embeddingInfo.embed.privateParams) === null || _c === void 0 ? void 0 : _c.length) > 0) {
        const fillingForbiddenParamsSet = new Set(embeddingInfo.embed.privateParams);
        for (const [key, value] of Object.entries(params)) {
            if (!fillingForbiddenParamsSet.has(key)) {
                filteredParams[key] = value;
            }
        }
        forbiddenParamsSet = fillingForbiddenParamsSet;
    }
    if (embeddingInfo.token.params) {
        Object.keys(embeddingInfo.token.params).forEach((param) => forbiddenParamsSet === null || forbiddenParamsSet === void 0 ? void 0 : forbiddenParamsSet.add(param));
    }
    let finalParams;
    const isSecureParamsV2Enabled = ctx.get('isEnabledServerFeature')(shared_1.Feature.EnableSecureParamsV2);
    if (isSecureParamsV2Enabled) {
        finalParams = {
            // params from token are considered as constant
            // they have the most priority over incoming params
            ...filteredParams,
            ...embeddingInfo.token.params,
        };
    }
    else {
        finalParams = {
            ...embeddingInfo.token.params,
            ...filteredParams,
        };
    }
    return {
        params: finalParams,
        privateParams: forbiddenParamsSet,
    };
}
async function findAndExecuteRunner(entry, chartsEngine, ctx, req, res, configResolving, embeddingInfo, privateParams) {
    var _a, _b;
    const configType = (_a = entry === null || entry === void 0 ? void 0 : entry.meta) === null || _a === void 0 ? void 0 : _a.stype;
    ctx.log('CHARTS_ENGINE_CONFIG_TYPE', { configType });
    const runnerFound = chartsEngine.runners.find((runner) => {
        return runner.trigger.has(configType);
    });
    if (!runnerFound) {
        ctx.log('CHARTS_ENGINE_UNKNOWN_CONFIG_TYPE', { configType });
        res.status(400).send({
            error: `Unknown config type ${configType}`,
        });
        return null;
    }
    const isEnabledServerFeature = ctx.get('isEnabledServerFeature');
    if (!isEnabledServerFeature('EnableChartEditor') && runnerFound.name === 'editor') {
        ctx.log('CHARTS_ENGINE_EDITOR_DISABLED');
        res.status(400).send({
            error: 'Editor is disabled',
        });
        return null;
    }
    req.body.config = entry;
    req.body.key = entry.key;
    req.body.widgetConfig = {
        ...req.body.widgetConfig,
        enableExport: ((_b = embeddingInfo.embed.settings) === null || _b === void 0 ? void 0 : _b.enableExport) === true,
    };
    return await runnerFound.handler(ctx, {
        chartsEngine,
        req,
        res,
        config: {
            ...entry,
            data: {
                ...entry.data,
                url: (0, get_1.default)(entry.data, 'sources') || (0, get_1.default)(entry.data, 'url'),
                js: (0, get_1.default)(entry.data, 'prepare') || (0, get_1.default)(entry.data, 'js'),
                ui: (0, get_1.default)(entry.data, 'controls') || (0, get_1.default)(entry.data, 'ui'),
            },
        },
        configResolving,
        // converting it to an array, since for some runners the fields must be serializable
        secureConfig: { privateParams: privateParams ? Array.from(privateParams) : undefined },
        forbiddenFields: ['_confStorageConfig', 'timings', 'key'],
    });
}
const embedsController = (chartsEngine) => {
    return function chartsRunController(req, res) {
        const { ctx } = req;
        // We need it because of timeout error after 120 seconds
        // https://forum.nginx.org/read.php?2,214230,214239#msg-214239
        req.socket.setTimeout(0);
        const hrStart = process.hrtime();
        const { id, controlData } = req.body;
        const tokenData = validateEmbedToken(req, ctx, res);
        if (!tokenData) {
            return; // Token validation failed, response already sent
        }
        const { embedToken, embedId } = tokenData;
        const configResolveArgs = {
            id,
            embedToken,
            // Key is legacy but we using it deeply like cache key, so this is just for compatibility purposes
            key: embedId,
            embedId,
            headers: {
                ...res.locals.subrequestHeaders,
                ...ctx.getMetadata(),
            },
            includeServicePlan: true,
            includeTenantFeatures: true,
            includeTenantSettings: true,
        };
        // 1. it's embedded chart, id is not used, chart is resolved by token
        // 2. it's widget from embedded dash, id is used, chart is resolved by
        // token and id
        // 3. it's selector from embedded dash, id is not used, dash is resolved by
        // token to get embeddedInfo and check token
        const configPromise = ctx.call('configLoading', (cx) => (0, storage_1.resolveEmbedConfig)(cx, configResolveArgs));
        ctx.log('CHARTS_ENGINE_LOADING_CONFIG', { embedId });
        Promise.resolve(configPromise)
            .catch((err) => {
            handleError(err, ctx, res, 'ERR.CHARTS.CONFIG_LOADING_ERROR', 'CHARTS_ENGINE_CONFIG_LOADING_ERROR "token"');
        })
            .then(async (embeddingInfo) => {
            if (!embeddingInfo || !('token' in embeddingInfo)) {
                return null;
            }
            const { params, privateParams } = await filterParams({
                params: req.body.params,
                embeddingInfo,
                ctx,
            });
            req.body.params = params;
            const entry = processEntry(controlData, embeddingInfo, res);
            // If entry processing failed, the response has already been sent
            if (!entry) {
                return null;
            }
            const configResolving = (0, utils_1.getDuration)(hrStart);
            return findAndExecuteRunner(entry, chartsEngine, ctx, req, res, configResolving, embeddingInfo, privateParams);
        })
            .catch((error) => {
            handleError(error, ctx, res, 'ERR.CHARTS.CHARTS_ENGINE_RUNNER_ERROR');
        });
    };
};
exports.embedsController = embedsController;
