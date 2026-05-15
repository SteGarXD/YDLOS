"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveCollection = exports.moveCollectionResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const moveCollectionArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
    parentId: zod_1.default.string().nullable(),
    title: zod_1.default.string().optional(),
});
exports.moveCollectionResultSchema = collections_1.collectionSchema;
exports.moveCollection = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: moveCollectionArgsSchema,
    resultSchema: exports.moveCollectionResultSchema,
}, {
    method: 'POST',
    path: ({ collectionId }) => `/v1/collections/${collectionId}/move`,
    params: ({ parentId, title }, headers) => ({
        body: {
            parentId,
            title,
        },
        headers,
    }),
});
