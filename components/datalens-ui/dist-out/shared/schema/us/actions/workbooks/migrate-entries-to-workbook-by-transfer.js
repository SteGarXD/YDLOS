"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateEntriesToWorkbookByTransfer = void 0;
const gateway_utils_1 = require("../../../gateway-utils");
exports.migrateEntriesToWorkbookByTransfer = (0, gateway_utils_1.createAction)({
    method: 'POST',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/migrate-entries`,
    params: ({ entryIds }, headers) => ({ body: { entryIds }, headers }),
});
