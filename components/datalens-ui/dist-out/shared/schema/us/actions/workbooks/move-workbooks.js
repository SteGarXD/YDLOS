"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveWorkbooks = exports.moveWorkbooksResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const workbooks_1 = require("../../schemas/workbooks");
const moveWorkbooksArgsSchema = zod_1.default.object({
    workbookIds: zod_1.default.array(zod_1.default.string()),
    collectionId: zod_1.default.string().nullable(),
});
exports.moveWorkbooksResultSchema = zod_1.default.object({
    workbooks: zod_1.default.array(workbooks_1.workbookSchema),
});
exports.moveWorkbooks = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: moveWorkbooksArgsSchema,
    resultSchema: exports.moveWorkbooksResultSchema,
}, {
    method: 'POST',
    path: () => '/v2/move-workbooks',
    params: ({ workbookIds, collectionId }, headers) => ({
        body: { workbookIds, collectionId },
        headers,
    }),
});
