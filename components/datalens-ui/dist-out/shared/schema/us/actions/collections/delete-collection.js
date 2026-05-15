"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollection = exports.deleteCollectionResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const deleteCollectionArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
});
exports.deleteCollectionResultSchema = zod_1.default.object({
    collections: zod_1.default.array(collections_1.collectionSchema),
});
exports.deleteCollection = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: deleteCollectionArgsSchema,
    resultSchema: exports.deleteCollectionResultSchema,
}, {
    method: 'DELETE',
    path: ({ collectionId }) => `/v1/collections/${collectionId}`,
    params: (_, headers) => ({ headers }),
});
