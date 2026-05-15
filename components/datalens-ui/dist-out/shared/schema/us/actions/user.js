"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/v1';
exports.userActions = {
    updateUserSettings: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/userSettings`,
        params: (body, headers) => ({ body, headers }),
    }),
    getUserSettings: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/userSettings`,
        params: (_, headers) => ({ headers }),
    }),
};
