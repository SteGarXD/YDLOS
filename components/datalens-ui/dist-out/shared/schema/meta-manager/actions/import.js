"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/workbooks/import';
exports.importActions = {
    startWorkbookImport: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => PATH_PREFIX,
        params: ({ data, title, description, collectionId }, headers) => ({
            body: { data, title, description, collectionId },
            headers,
        }),
    }),
    getWorkbookImportStatus: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ importId }) => `${PATH_PREFIX}/${importId}`,
        params: (_, headers) => ({ headers }),
    }),
};
