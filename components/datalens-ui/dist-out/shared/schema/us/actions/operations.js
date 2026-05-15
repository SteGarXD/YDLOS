"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const OPERATIONS_PATH_PREFIX = '/v1/operation';
exports.operationsActions = {
    getOperation: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ operationId }) => `${OPERATIONS_PATH_PREFIX}/${operationId}`,
        params: (_, headers) => ({
            headers,
        }),
    }),
};
