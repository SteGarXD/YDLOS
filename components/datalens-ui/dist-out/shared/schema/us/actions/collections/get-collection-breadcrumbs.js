"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionBreadcrumbs = exports.getCollectionBreadcrumbsResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
const collections_1 = require("../../schemas/collections");
const getCollectionBreadcrumbsArgsSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
});
exports.getCollectionBreadcrumbsResultSchema = zod_1.default.array(collections_1.collectionSchema.extend({
    permissions: collections_1.collectionPermissionsSchema.optional(),
}));
exports.getCollectionBreadcrumbs = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: getCollectionBreadcrumbsArgsSchema,
    resultSchema: exports.getCollectionBreadcrumbsResultSchema,
}, {
    method: 'GET',
    path: ({ collectionId }) => `/v1/collections/${collectionId}/breadcrumbs`,
    params: ({ includePermissionsInfo }, headers) => ({ headers, query: { includePermissionsInfo } }),
});
