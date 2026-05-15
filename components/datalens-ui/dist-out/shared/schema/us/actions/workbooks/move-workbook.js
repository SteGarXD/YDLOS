"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveWorkbook = exports.moveWorkbookResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const moveWorkbookArgsSchema = zod_1.default.object({
    workbookId: zod_1.default.string(),
    collectionId: zod_1.default.string().nullable(),
    title: zod_1.default.string().optional(),
});
exports.moveWorkbookResultSchema = workbooks_1.workbookSchema;
exports.moveWorkbook = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: moveWorkbookArgsSchema,
    resultSchema: exports.moveWorkbookResultSchema,
}, {
    method: 'POST',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/move`,
    params: ({ collectionId, title }, headers) => ({ body: { collectionId, title }, headers }),
});
