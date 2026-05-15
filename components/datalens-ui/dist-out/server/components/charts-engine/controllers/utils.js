"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldUseUnreleasedConfig = shouldUseUnreleasedConfig;
exports.resolveChartConfig = resolveChartConfig;
const isObject_1 = __importDefault(require("lodash/isObject"));
const utils_1 = __importDefault(require("../../../utils"));
const storage_1 = require("../components/storage");
function shouldUseUnreleasedConfig(args) {
    const { request, params } = args;
    let useUnreleasedConfig = request.body.unreleased === '1';
    if (params) {
        if (Array.isArray(params.unreleased)) {
            useUnreleasedConfig = useUnreleasedConfig || params.unreleased[0] === '1';
        }
        else {
            useUnreleasedConfig = useUnreleasedConfig || params.unreleased === '1';
        }
    }
    return useUnreleasedConfig;
}
async function resolveChartConfig(args) {
    const { params, id, key, workbookId, request, extraSettings, subrequestHeaders } = args;
    const { ctx } = request;
    const configResolveArgs = {
        unreleased: shouldUseUnreleasedConfig({ request, params }),
        key,
        id,
        workbookId,
        headers: {
            ...subrequestHeaders,
            ...ctx.getMetadata(),
            ...(ctx.config.isZitadelEnabled ? { ...utils_1.default.pickZitadelHeaders(request) } : {}),
            ...(ctx.config.isAuthEnabled ? { ...utils_1.default.pickAuthHeaders(request) } : {}),
        },
        requestId: request.id,
        ...extraSettings,
    };
    try {
        ctx.log('CHARTS_ENGINE_LOADING_CONFIG', { key, id });
        return await ctx.call('configLoading', (cx) => (0, storage_1.resolveConfig)(cx, configResolveArgs));
    }
    catch (err) {
        const error = (0, isObject_1.default)(err) && 'message' in err ? err : new Error(err);
        const result = {
            error: {
                code: 'ERR.CHARTS.CONFIG_LOADING_ERROR',
                details: {
                    code: (error.response && error.response.status) || error.status || null,
                    entryId: id,
                },
                debug: {
                    message: error.message,
                },
            },
        };
        // TODO use ShowChartsEngineDebugInfo flag
        if (ctx.config.appInstallation !== 'internal') {
            delete result.error.debug;
        }
        ctx.logError(`CHARTS_ENGINE_CONFIG_LOADING_ERROR "${key || id}"`, error);
        return result;
    }
}
