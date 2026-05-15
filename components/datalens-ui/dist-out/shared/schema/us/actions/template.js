"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateActions = void 0;
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/v1';
exports.templateActions = {
    copyTemplate: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/copyTemplate`,
        params: (body, headers) => ({ body, headers }),
        timeout: constants_1.TIMEOUT_60_SEC,
    }),
};
