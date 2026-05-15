"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = initApp;
const app_layout_1 = require("@gravity-ui/app-layout");
const expresskit_1 = require("@gravity-ui/expresskit");
const passport_1 = __importDefault(require("passport"));
const shared_1 = require("../../../shared");
const app_env_1 = require("../../app-env");
const app_layout_settings_1 = require("../../components/app-layout/app-layout-settings");
const layout_1 = require("../../components/app-layout/plugins/layout");
const init_zitadel_1 = require("../../components/zitadel/init-zitadel");
const xlsx_converter_1 = require("../../controllers/xlsx-converter");
const expresskit_2 = require("../../expresskit");
const middlewares_1 = require("../../middlewares");
const registry_1 = require("../../registry");
const init_charts_engine_1 = require("../charts/init-charts-engine");
const dash_api_1 = require("../charts/plugins/dash-api");
const ql_1 = require("../charts/plugins/ql");
const request_with_dataset_1 = require("../charts/plugins/request-with-dataset");
const middlewares_2 = require("./middlewares");
const routes_1 = require("./routes");
function initApp(nodekit) {
    const beforeAuth = [];
    const afterAuth = [];
    registry_1.registry.setupXlsxConverter(xlsx_converter_1.xlsxConverter);
    if (nodekit.config.isZitadelEnabled) {
        (0, init_zitadel_1.initZitadel)({ nodekit, beforeAuth });
    }
    if (app_env_1.isFullMode || app_env_1.isDatalensMode) {
        initDataLensApp({ beforeAuth, afterAuth });
    }
    let chartsEngine;
    if (app_env_1.isFullMode || app_env_1.isChartsMode) {
        chartsEngine = initChartsApp({ nodekit, beforeAuth, afterAuth });
    }
    if (app_env_1.isFullMode || app_env_1.isApiMode) {
        initApiApp({ beforeAuth, afterAuth });
    }
    const extendedRoutes = (0, routes_1.getRoutes)({
        ctx: nodekit.ctx,
        chartsEngine,
        passport: passport_1.default,
        beforeAuth,
        afterAuth,
    });
    return (0, expresskit_2.getExpressKit)({ extendedRoutes, nodekit });
}
function initDataLensApp({ beforeAuth, afterAuth, }) {
    beforeAuth.push((0, middlewares_1.createAppLayoutMiddleware)({
        plugins: [(0, layout_1.createLayoutPlugin)(), (0, app_layout_1.createUikitPlugin)()],
        getAppLayoutSettings: app_layout_settings_1.getAppLayoutSettings,
    }), middlewares_1.beforeAuthDefaults);
    afterAuth.push((0, middlewares_1.xDlContext)(), (0, middlewares_1.getCtxMiddleware)());
}
function initChartsApp({ beforeAuth, afterAuth, nodekit, }) {
    const chartsEngine = (0, init_charts_engine_1.initChartsEngine)({
        config: nodekit.config,
        ctx: nodekit.ctx,
        plugins: [
            (0, dash_api_1.configuredDashApiPlugin)({
                basePath: shared_1.DASH_API_BASE_URL,
                routeParams: {
                    authPolicy: nodekit.config.isZitadelEnabled || nodekit.config.isAuthEnabled
                        ? expresskit_1.AuthPolicy.required
                        : expresskit_1.AuthPolicy.disabled,
                },
                privatePath: shared_1.PUBLIC_API_DASH_API_BASE_URL,
                privateRouteParams: {
                    authPolicy: expresskit_1.AuthPolicy.disabled,
                },
            }),
            ql_1.plugin,
            (0, request_with_dataset_1.configurableRequestWithDatasetPlugin)(),
        ],
        beforeAuth,
        afterAuth,
    });
    registry_1.registry.setupChartsEngine(chartsEngine);
    if (app_env_1.isChartsMode) {
        afterAuth.push((0, middlewares_1.xDlContext)());
    }
    afterAuth.push(middlewares_2.setSubrequestHeaders, middlewares_1.patchLogger);
    if (app_env_1.isChartsMode) {
        beforeAuth.push(middlewares_1.beforeAuthDefaults);
        afterAuth.push((0, middlewares_1.getCtxMiddleware)());
    }
    if (nodekit.config.enablePreloading) {
        chartsEngine.initPreloading(nodekit.ctx);
    }
    return chartsEngine;
}
function initApiApp({ beforeAuth, afterAuth, }) {
    // As charts app except chartEngine
    if (app_env_1.isApiMode) {
        afterAuth.push((0, middlewares_1.xDlContext)(), middlewares_2.setSubrequestHeaders, middlewares_1.patchLogger, (0, middlewares_1.getCtxMiddleware)());
        beforeAuth.push(middlewares_1.beforeAuthDefaults);
    }
}
