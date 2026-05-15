"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkbook = exports.deleteWorkbookResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const deleteWorkbookArgsSchema = zod_1.default.object({
    workbookId: zod_1.default.string(),
});
exports.deleteWorkbookResultSchema = workbooks_1.workbookSchema;
exports.deleteWorkbook = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: deleteWorkbookArgsSchema,
    resultSchema: exports.deleteWorkbookResultSchema,
}, {
    method: 'DELETE',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}`,
    params: (_, headers) => ({ headers }),
});
