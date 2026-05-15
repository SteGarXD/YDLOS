"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppEndpointsConfig = getAppEndpointsConfig;
const constants_1 = require("./constants");
function getAppEndpointsConfig(appEnviroment) {
    return constants_1.endpoints[appEnviroment];
}
