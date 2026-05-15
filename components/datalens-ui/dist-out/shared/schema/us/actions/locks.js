"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locksActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PATH_PREFIX = '/v1';
exports.locksActions = {
    createLock: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/locks/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ data: body }, headers) => ({ body, headers }),
    }),
    extendLock: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/locks/${(0, utils_1.filterUrlFragment)(entryId)}/extend`,
        params: ({ data: body }, headers) => ({ body, headers }),
    }),
    deleteLock: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ entryId }) => `${PATH_PREFIX}/locks/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ params: query }, headers) => {
            if (typeof query !== 'object') {
                return { headers };
            }
            return { query, headers };
        },
    }),
};
