"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkbook = exports.updateWorkbookResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const updateWorkbookArgsSchema = zod_1.default.object({
    workbookId: zod_1.default.string(),
    project: zod_1.default.string().optional(),
    title: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
});
exports.updateWorkbookResultSchema = workbooks_1.workbookSchema;
exports.updateWorkbook = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: updateWorkbookArgsSchema,
    resultSchema: exports.updateWorkbookResultSchema,
}, {
    method: 'POST',
    path: ({ workbookId }) => `/v2/workbooks/${workbookId}/update`,
    params: ({ title, project, description }, headers) => ({ body: { title, project, description }, headers }),
});
