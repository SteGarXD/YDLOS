"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initChartsEngine = initChartsEngine;
exports.applyPluginRoutes = applyPluginRoutes;
const shared_1 = require("../../../shared");
const cache_client_1 = __importDefault(require("../../components/cache-client"));
const charts_engine_1 = require("../../components/charts-engine");
const runners_1 = require("../../components/charts-engine/runners");
const validation_1 = require("../../lib/validation");
const telemetry_1 = require("./telemetry");
function initChartsEngine({ plugins, ctx, config, beforeAuth, afterAuth, }) {
    const telemetryCallbacks = (0, telemetry_1.getTelemetryCallbacks)(ctx);
    const { appEnv, endpoints, chartsEngineConfig } = config;
    if (!appEnv) {
        throw new Error('App environment is not defined');
    }
    const typedAppEnv = appEnv;
    if (!Object.values(shared_1.AppEnvironment).includes(typedAppEnv)) {
        throw new Error(`Unknown app environment: ${appEnv}`);
    }
    config.sources = config.getSourcesByEnv(typedAppEnv);
    config.usEndpoint = endpoints.api.us + chartsEngineConfig.usEndpointPostfix;
    const cacheClient = new cache_client_1.default({ config });
    return new charts_engine_1.ChartsEngine({
        config,
        secrets: chartsEngineConfig.secrets,
        flags: chartsEngineConfig.flags,
        plugins,
        telemetryCallbacks: chartsEngineConfig.enableTelemetry ? telemetryCallbacks : undefined,
        cacheClient,
        beforeAuth,
        afterAuth,
        runners: (0, runners_1.getDefaultRunners)(),
    });
}
function applyPluginRoutes({ chartsEngine, routes, beforeAuth, afterAuth, }) {
    chartsEngine.plugins.forEach((plugin) => {
        const pluginRoutes = plugin.routes || [];
        pluginRoutes.forEach((pluginRoute) => {
            const routeValidationConfig = pluginRoute.validationConfig;
            let handler = pluginRoute.handler;
            if (routeValidationConfig) {
                handler = (req, res) => {
                    const validationResult = (0, validation_1.checkValidation)(req, routeValidationConfig);
                    if (!validationResult.success) {
                        res.status(400).send({
                            message: validationResult.message,
                            details: validationResult.details,
                        });
                        return;
                    }
                    return pluginRoute.handler(req, res);
                };
            }
            const appRoute = {
                handler,
                handlerName: pluginRoute.handlerName,
                beforeAuth,
                afterAuth,
            };
            if (pluginRoute.authPolicy) {
                appRoute.authPolicy = pluginRoute.authPolicy;
            }
            if (typeof pluginRoute.disableCsrf !== 'undefined') {
                appRoute.disableCsrf = pluginRoute.disableCsrf;
            }
            routes[`${pluginRoute.method} ${pluginRoute.path}`] = {
                ...appRoute,
                route: `${pluginRoute.method} ${pluginRoute.path}`,
            };
        });
    });
}
