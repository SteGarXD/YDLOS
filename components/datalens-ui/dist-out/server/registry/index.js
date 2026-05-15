"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registry = exports.wrapperGetGatewayControllers = void 0;
const gateway_1 = require("@gravity-ui/gateway");
const connection_1 = require("../modes/charts/plugins/ql/utils/connection");
const common_1 = __importDefault(require("./units/common"));
let app;
let chartsEngine;
const wrapperGetGatewayControllers = (schemasByScope, config) => (0, gateway_1.getGatewayControllers)(schemasByScope, config);
exports.wrapperGetGatewayControllers = wrapperGetGatewayControllers;
let gateway;
let gatewaySchemasByScope;
let getLayoutConfig;
let yfmPlugins;
let getXlsxConverter;
let qLConnectionTypeMap;
let publicApiConfig;
exports.registry = {
    common: common_1.default,
    setupApp(appInstance) {
        if (app) {
            throw new Error('The method must not be called more than once');
        }
        app = appInstance;
    },
    getApp() {
        if (!app) {
            throw new Error('First of all setup the app');
        }
        return app;
    },
    setupChartsEngine(chartsEngineInstance) {
        if (chartsEngine) {
            throw new Error('The method must not be called more than once');
        }
        chartsEngine = chartsEngineInstance;
    },
    getChartsEngine() {
        if (!chartsEngine) {
            throw new Error('First of all setup the chartsEngine');
        }
        return chartsEngine;
    },
    setupGateway(config, schemasByScope) {
        if (gateway) {
            throw new Error('The method must not be called more than once');
        }
        gateway = (0, exports.wrapperGetGatewayControllers)(schemasByScope, config);
        gatewaySchemasByScope = schemasByScope;
    },
    getGatewayController() {
        if (!gateway) {
            throw new Error('First of all setup the gateway');
        }
        return { gatewayController: gateway.controller };
    },
    getGatewayApi() {
        if (!gateway) {
            throw new Error('First of all setup the gateway');
        }
        return { gatewayApi: gateway.api };
    },
    getGatewaySchemasByScope() {
        if (!gatewaySchemasByScope) {
            throw new Error('First of all setup the gateway');
        }
        return gatewaySchemasByScope;
    },
    registerGetLayoutConfig(fn) {
        if (getLayoutConfig) {
            throw new Error('The method must not be called more than once [registerGetLayoutConfig]');
        }
        getLayoutConfig = fn;
    },
    useGetLayoutConfig(...params) {
        if (!getLayoutConfig) {
            throw new Error('First of all register getLayoutConfig function');
        }
        return getLayoutConfig(...params);
    },
    setupYfmPlugins(plugins) {
        if (yfmPlugins) {
            throw new Error('The method must not be called more than once');
        }
        yfmPlugins = plugins;
    },
    getYfmPlugins() {
        return yfmPlugins;
    },
    setupXlsxConverter(fn) {
        if (getXlsxConverter) {
            throw new Error('The method setupXlsxConverter must not be called more than once');
        }
        getXlsxConverter = fn;
    },
    getXlsxConverter() {
        return getXlsxConverter;
    },
    setupQLConnectionTypeMap(map) {
        if (!qLConnectionTypeMap) {
            qLConnectionTypeMap = map;
        }
    },
    getQLConnectionTypeMap() {
        return qLConnectionTypeMap !== null && qLConnectionTypeMap !== void 0 ? qLConnectionTypeMap : (0, connection_1.getConnectorToQlConnectionTypeMap)();
    },
    setupPublicApiConfig(config) {
        if (publicApiConfig) {
            throw new Error('The method must not be called more than once [setupPublicApiConfig]');
        }
        publicApiConfig = config;
    },
    getPublicApiConfig() {
        if (!publicApiConfig) {
            throw new Error('First of all setup the publicApiConfig');
        }
        return publicApiConfig;
    },
};
