"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkbook = exports.createWorkbookResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const operation_1 = require("../../schemas/operation");
const workbooks_1 = require("../../schemas/workbooks");
const createWorkbookArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string().nullable().optional(),
    project: zod_1.default.string().optional(),
    title: zod_1.default.string(),
    description: zod_1.default.string().optional(),
});
exports.createWorkbookResultSchema = workbooks_1.workbookSchema.extend({
    operation: operation_1.datalensOperationSchema,
});
exports.createWorkbook = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: createWorkbookArgsSchema,
    resultSchema: exports.createWorkbookResultSchema,
}, {
    method: 'POST',
    path: () => '/v2/workbooks',
    params: ({ collectionId, project, title, description }, headers) => ({
        body: { collectionId, project, title, description },
        headers,
    }),
});
