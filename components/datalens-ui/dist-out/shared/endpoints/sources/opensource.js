"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opensourceSources = void 0;
const constants_1 = require("../constants");
const CONNECTIONS_PATH = '/api/data/v1/connections';
const DATASETS_PATH = '/api/data/v2/datasets';
exports.opensourceSources = {
    development: {
        bi: constants_1.endpoints.development.api.biData,
        bi_connections: constants_1.endpoints.development.api.biData + CONNECTIONS_PATH,
        bi_datasets: constants_1.endpoints.development.api.biData + DATASETS_PATH,
        us: constants_1.endpoints.development.api.us,
    },
    production: {
        bi: constants_1.endpoints.production.api.biData,
        bi_connections: constants_1.endpoints.production.api.biData + CONNECTIONS_PATH,
        bi_datasets: constants_1.endpoints.production.api.biData + DATASETS_PATH,
        us: constants_1.endpoints.production.api.us,
    },
};
