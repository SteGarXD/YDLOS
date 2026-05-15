"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCollection = exports.updateCollectionResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const updateCollectionArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
    project: zod_1.default.string().optional(),
    title: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
});
exports.updateCollectionResultSchema = collections_1.collectionSchema;
exports.updateCollection = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: updateCollectionArgsSchema,
    resultSchema: exports.updateCollectionResultSchema,
}, {
    method: 'POST',
    path: ({ collectionId }) => `/v1/collections/${collectionId}/update`,
    params: ({ title, project, description }, headers) => ({
        body: {
            title,
            project,
            description,
        },
        headers,
    }),
});
