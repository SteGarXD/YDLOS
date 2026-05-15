"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguredRoute = void 0;
const controllers_1 = require("../controllers");
const registry_1 = require("../registry");
const getConfiguredRoute = (controllerName, params) => {
    switch (controllerName) {
        case 'navigate':
            return {
                handler: controllers_1.navigateController,
                ...params,
            };
        case 'api.deleteLock':
            return {
                handler: controllers_1.apiControllers.deleteLock,
                ...params,
            };
        case 'dl-main':
            return {
                handler: controllers_1.dlMainController,
                ...params,
            };
        case 'navigation':
            return {
                handler: controllers_1.navigationController,
                ...params,
            };
        case 'schematic-gateway': {
            const { gatewayController } = registry_1.registry.getGatewayController();
            return {
                handler: gatewayController,
                ...params,
            };
        }
        default:
            return null;
    }
};
exports.getConfiguredRoute = getConfiguredRoute;
