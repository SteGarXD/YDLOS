"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
// Without this import shared object is empty in runtime and it should be exactly here
require("../shared");
const endpoints_1 = require("../shared/endpoints");
const app_env_1 = require("./app-env");
const auth_1 = require("./components/auth/middlewares/auth");
const opensource_layout_config_1 = require("./components/layout/opensource-layout-config");
const middlewares_1 = require("./middlewares");
const auth_zitadel_1 = __importDefault(require("./middlewares/auth-zitadel"));
const connection_1 = require("./modes/charts/plugins/ql/utils/connection");
const app_1 = __importDefault(require("./modes/opensource/app"));
const nodekit_1 = require("./nodekit");
const registry_1 = require("./registry");
const register_app_plugins_1 = require("./registry/utils/register-app-plugins");
registry_1.registry.registerGetLayoutConfig(opensource_layout_config_1.getOpensourceLayoutConfig);
registry_1.registry.setupQLConnectionTypeMap((0, connection_1.getConnectorToQlConnectionTypeMap)());
(0, register_app_plugins_1.registerAppPlugins)();
nodekit_1.nodekit.config.endpoints = (0, endpoints_1.getAppEndpointsConfig)(app_env_1.appEnv);
if (nodekit_1.nodekit.config.isZitadelEnabled) {
    nodekit_1.nodekit.config.appAuthHandler = auth_zitadel_1.default;
}
if (nodekit_1.nodekit.config.isAuthEnabled) {
    nodekit_1.nodekit.config.appAuthHandler = auth_1.appAuth;
}
nodekit_1.nodekit.config.appAllowedLangs = (_a = nodekit_1.nodekit.config.regionalEnvConfig) === null || _a === void 0 ? void 0 : _a.allowLanguages;
nodekit_1.nodekit.config.appDefaultLang = (_b = nodekit_1.nodekit.config.regionalEnvConfig) === null || _b === void 0 ? void 0 : _b.defaultLang;
nodekit_1.nodekit.config.appBeforeAuthMiddleware = [middlewares_1.serverFeatureWithBoundedContext];
const app = (0, app_1.default)(nodekit_1.nodekit);
registry_1.registry.setupApp(app);
if (nodekit_1.nodekit.config.workers && nodekit_1.nodekit.config.workers > 1 && cluster_1.default.isPrimary) {
    for (let i = 0; i < nodekit_1.nodekit.config.workers; i++) {
        cluster_1.default.fork();
    }
}
else {
    app.run();
}
