"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opensourceEndpoints = void 0;
const constants_1 = require("../constants");
exports.opensourceEndpoints = {
    development: {
        bi: {
            endpoint: constants_1.endpoints.development.api.bi,
            datasetDataApiEndpoint: constants_1.endpoints.development.api.biData,
        },
        biConverter: {
            endpoint: constants_1.endpoints.development.api.biConverter,
            csvConverter: constants_1.endpoints.development.api.csvConverter,
        },
        us: {
            endpoint: constants_1.endpoints.development.api.us,
        },
        auth: {
            endpoint: constants_1.endpoints.development.api.auth,
        },
        metaManager: {
            endpoint: constants_1.endpoints.development.api.metaManager,
        },
    },
    production: {
        bi: {
            endpoint: constants_1.endpoints.production.api.bi,
            datasetDataApiEndpoint: constants_1.endpoints.production.api.biData,
        },
        biConverter: {
            endpoint: constants_1.endpoints.production.api.biConverter,
            csvConverter: constants_1.endpoints.production.api.csvConverter,
        },
        us: {
            endpoint: constants_1.endpoints.production.api.us,
        },
        auth: {
            endpoint: constants_1.endpoints.production.api.auth,
        },
        metaManager: {
            endpoint: constants_1.endpoints.production.api.metaManager,
        },
    },
};
