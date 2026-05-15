"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCollections = exports.moveCollectionsResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const moveCollectionsArgsSchema = zod_1.default.object({
    collectionIds: zod_1.default.array(zod_1.default.string()),
    parentId: zod_1.default.string().nullable(),
});
exports.moveCollectionsResultSchema = zod_1.default.object({
    collections: zod_1.default.array(collections_1.collectionSchema),
});
exports.moveCollections = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: moveCollectionsArgsSchema,
    resultSchema: exports.moveCollectionsResultSchema,
}, {
    method: 'POST',
    path: () => '/v1/move-collections',
    params: ({ collectionIds, parentId }, headers) => ({
        body: { collectionIds, parentId },
        headers,
    }),
});
