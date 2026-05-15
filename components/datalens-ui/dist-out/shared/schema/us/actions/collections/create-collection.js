"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollection = exports.createCollectionResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const operation_1 = require("../../schemas/operation");
const createCollectionArgsSchema = zod_1.default.object({
    title: zod_1.default.string(),
    project: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
    parentId: zod_1.default.string().nullable(),
});
exports.createCollectionResultSchema = collections_1.collectionSchema.extend({
    operation: operation_1.datalensOperationSchema.optional(),
});
exports.createCollection = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: createCollectionArgsSchema,
    resultSchema: exports.createCollectionResultSchema,
}, {
    method: 'POST',
    path: () => '/v1/collections',
    params: ({ title, project, description, parentId }, headers) => ({
        body: { title, project, description, parentId },
        headers,
    }),
});
