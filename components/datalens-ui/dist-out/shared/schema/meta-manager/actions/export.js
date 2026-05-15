"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/workbooks/export';
exports.exportActions = {
    startWorkbookExport: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => PATH_PREFIX,
        params: ({ workbookId }, headers) => ({
            body: { workbookId },
            headers,
        }),
    }),
    getWorkbookExportStatus: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ exportId }) => `${PATH_PREFIX}/${exportId}`,
        params: (_, headers) => ({ headers }),
    }),
    getWorkbookExportResult: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ exportId }) => `${PATH_PREFIX}/${exportId}/result`,
        params: (_, headers) => ({ headers }),
    }),
    cancelWorkbookExport: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ exportId }) => `${PATH_PREFIX}/${exportId}/cancel`,
        params: (_, headers) => ({ headers }),
    }),
};
