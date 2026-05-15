"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateEntriesToWorkbookByCopy = void 0;
const gateway_utils_1 = require("../../../gateway-utils");
exports.migrateEntriesToWorkbookByCopy = (0, gateway_utils_1.createAction)({
    method: 'POST',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/migrate-copied-entries`,
    params: ({ entryIds }, headers) => ({ body: { entryIds }, headers }),
});
