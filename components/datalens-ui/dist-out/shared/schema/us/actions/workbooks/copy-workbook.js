"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyWorkbook = void 0;
const constants_1 = require("../../../../constants");
const gateway_utils_1 = require("../../../gateway-utils");
exports.copyWorkbook = (0, gateway_utils_1.createAction)({
    method: 'POST',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/copy`,
    params: ({ collectionId, title }, headers) => ({ body: { collectionId, title }, headers }),
    timeout: constants_1.TIMEOUT_60_SEC,
});
