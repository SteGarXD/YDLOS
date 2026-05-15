"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldSchema = void 0;
const CHARTS_API_SCHEMA = require('./charts').default;
const SCHEMA_API = {
    charts: {
        ...CHARTS_API_SCHEMA,
    },
};
exports.oldSchema = SCHEMA_API;
