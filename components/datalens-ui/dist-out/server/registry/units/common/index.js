"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_registry_1 = require("../../../../shared/utils/functions-registry");
const auth_functions_map_1 = require("./auth-functions-map");
const functions_map_1 = require("./functions-map");
const functionsRegistry = (0, functions_registry_1.createFunctionsRegistry)(functions_map_1.commonFunctionsMap);
const authRegistry = (0, functions_registry_1.createFunctionsRegistry)(auth_functions_map_1.authFunctionsMap);
const commonRegistry = {
    functions: functionsRegistry,
    auth: authRegistry,
};
exports.default = commonRegistry;
