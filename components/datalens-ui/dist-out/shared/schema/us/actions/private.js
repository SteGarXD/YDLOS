"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/private';
exports.privateActions = {
    _ensurePersonalFolderIsPresent: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/ensurePersonalFolderPresent`,
        params: (_, headers) => ({ headers }),
    }),
};
