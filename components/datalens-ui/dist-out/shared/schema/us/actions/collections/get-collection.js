"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollection = exports.getCollectionResultSchema = exports.getCollectionArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
exports.getCollectionArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
});
exports.getCollectionResultSchema = collections_1.collectionSchema.extend({
    permissions: collections_1.collectionPermissionsSchema.optional(),
});
exports.getCollection = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: exports.getCollectionArgsSchema,
    resultSchema: exports.getCollectionResultSchema,
}, {
    method: 'GET',
    path: ({ collectionId }) => `/v1/collections/${collectionId}`,
    params: ({ includePermissionsInfo }, headers) => ({ query: { includePermissionsInfo }, headers }),
});
