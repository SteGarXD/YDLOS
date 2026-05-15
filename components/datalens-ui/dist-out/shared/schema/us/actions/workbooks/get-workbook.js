"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkbook = exports.getWorkbookResultSchema = exports.getWorkbookArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
exports.getWorkbookArgsSchema = zod_1.default.object({
    workbookId: zod_1.default.string(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
});
exports.getWorkbookResultSchema = workbooks_1.workbookSchema.extend({
    permissions: workbooks_1.workbookPermissionsSchema,
});
exports.getWorkbook = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: exports.getWorkbookArgsSchema,
    resultSchema: exports.getWorkbookResultSchema,
}, {
    method: 'GET',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}`,
    params: ({ includePermissionsInfo }, headers) => ({ query: { includePermissionsInfo }, headers }),
});
