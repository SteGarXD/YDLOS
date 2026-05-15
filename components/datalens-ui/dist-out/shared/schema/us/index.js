"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_1 = require("../../endpoints/schema");
const actions_1 = require("./actions");
exports.default = {
    actions: actions_1.actions,
    endpoints: (0, schema_1.getServiceEndpoints)('us'),
    serviceName: 'us',
};
