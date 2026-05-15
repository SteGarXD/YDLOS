"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollections = exports.deleteCollectionsResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const deleteCollectionsArgsSchema = zod_1.default.object({
    collectionIds: zod_1.default.array(zod_1.default.string()),
});
exports.deleteCollectionsResultSchema = zod_1.default.object({
    collections: zod_1.default.array(collections_1.collectionSchema),
});
exports.deleteCollections = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: deleteCollectionsArgsSchema,
    resultSchema: exports.deleteCollectionsResultSchema,
}, {
    method: 'DELETE',
    path: () => '/v1/delete-collections',
    params: ({ collectionIds }, headers) => ({
        body: { collectionIds },
        headers,
    }),
});
