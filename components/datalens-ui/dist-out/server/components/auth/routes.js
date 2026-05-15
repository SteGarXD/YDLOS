"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthRoutes = getAuthRoutes;
const expresskit_1 = require("@gravity-ui/expresskit");
const routes_1 = require("../../utils/routes");
function getAuthRoutes({ routeParams, }) {
    const routes = {
        postAuthGateway: (0, routes_1.getConfiguredRoute)('schematic-gateway', {
            authPolicy: expresskit_1.AuthPolicy.disabled,
            route: 'POST /gateway/:scope(auth)/:service/:action?',
            ...routeParams,
        }),
    };
    return routes;
}
