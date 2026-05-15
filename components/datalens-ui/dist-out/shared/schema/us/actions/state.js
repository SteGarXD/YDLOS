"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PATH_PREFIX = '/v1';
exports.stateActions = {
    getDashState: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId, hash }) => `${PATH_PREFIX}/states/${(0, utils_1.filterUrlFragment)(entryId)}/${(0, utils_1.filterUrlFragment)(hash)}`,
        params: (_, headers) => ({ headers }),
    }),
    createDashState: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/states/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ data }, headers) => ({ body: { data }, headers }),
    }),
};
