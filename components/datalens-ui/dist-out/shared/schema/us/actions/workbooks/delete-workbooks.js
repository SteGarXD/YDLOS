"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkbooks = exports.deleteWorkbooksResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const deleteWorkbooksArgsSchema = zod_1.default.object({
    workbookIds: zod_1.default.array(zod_1.default.string()),
});
exports.deleteWorkbooksResultSchema = zod_1.default.object({
    workbooks: zod_1.default.array(workbooks_1.workbookSchema),
});
exports.deleteWorkbooks = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: deleteWorkbooksArgsSchema,
    resultSchema: exports.deleteWorkbooksResultSchema,
}, {
    method: 'DELETE',
    path: () => '/v2/delete-workbooks',
    params: ({ workbookIds }, headers) => ({
        body: { workbookIds },
        headers,
    }),
});
