"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkbookEntries = void 0;
const modules_1 = require("../../../../modules");
const gateway_utils_1 = require("../../../gateway-utils");
const utils_1 = require("../../../utils");
exports.getWorkbookEntries = (0, gateway_utils_1.createAction)({
    method: 'GET',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/entries`,
    params: ({ includePermissionsInfo, page, pageSize, onlyMy, orderBy, filters, scope }, headers, { ctx }) => ({
        query: {
            includePermissionsInfo,
            page,
            pageSize,
            orderBy,
            filters,
            scope,
            createdBy: onlyMy ? (0, modules_1.makeUserId)(ctx.get('userId')) : undefined,
        },
        headers,
    }),
    paramsSerializer: utils_1.defaultParamsSerializer,
});
