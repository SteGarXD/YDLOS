"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceEndpoints = getServiceEndpoints;
const lodash_1 = __importDefault(require("lodash"));
const opensource_1 = require("./opensource");
const endpoints = {
    opensource: opensource_1.opensourceEndpoints,
};
function getServiceEndpoints(service) {
    const serviceEndpoints = {};
    for (const region in endpoints) {
        if (endpoints[region]) {
            const regionEndpoints = endpoints[region];
            for (const environment in regionEndpoints) {
                if (regionEndpoints[environment]) {
                    if (lodash_1.default.get(regionEndpoints, [environment, service])) {
                        lodash_1.default.set(serviceEndpoints, [region, environment], lodash_1.default.get(regionEndpoints, [environment, service]));
                    }
                }
            }
        }
    }
    return serviceEndpoints;
}
