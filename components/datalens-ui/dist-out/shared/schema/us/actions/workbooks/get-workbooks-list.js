"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkbooksList = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const getWorkbooksListArgsSchema = zod_1.default
    .object({
    collectionId: zod_1.default.string().nullable().optional(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
    filterString: zod_1.default.string().optional(),
    page: zod_1.default.number().optional(),
    pageSize: zod_1.default.number().optional(),
    orderField: zod_1.default.enum(['title', 'createdAt', 'updatedAt']).optional(),
    orderDirection: zod_1.default.enum(['asc', 'desc']).optional(),
    onlyMy: zod_1.default.boolean().optional(),
})
    .optional();
const getWorkbooksListResultSchema = zod_1.default.object({
    workbooks: zod_1.default.array(workbooks_1.workbookSchema.extend({
        permissions: workbooks_1.workbookPermissionsSchema.optional(),
    })),
    nextPageToken: zod_1.default.string().optional(),
});
exports.getWorkbooksList = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: getWorkbooksListArgsSchema,
    resultSchema: getWorkbooksListResultSchema,
}, {
    method: 'GET',
    path: () => '/v2/workbooks',
    params: (args, headers) => ({
        headers,
        query: args
            ? {
                collectionId: args.collectionId,
                includePermissionsInfo: args.includePermissionsInfo,
                filterString: args.filterString,
                page: args.page,
                pageSize: args.pageSize,
                orderField: args.orderField,
                orderDirection: args.orderDirection,
                onlyMy: args.onlyMy,
            }
            : undefined,
    }),
});
