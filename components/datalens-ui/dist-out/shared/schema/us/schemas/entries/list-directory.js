"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDirectoryTransformedSchema = exports.listDirectoryResultSchema = exports.listDirectoryEntryResponseSchema = exports.listDirectoryEntryOutputSchema = exports.listDirectoryBreadCrumbSchema = exports.listDirectoryArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const permissions_1 = require("../../../../zod-schemas/permissions");
exports.listDirectoryArgsSchema = zod_1.default.object({
    path: zod_1.default.string().optional(),
    createdBy: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]).optional(),
    orderBy: zod_1.default
        .object({
        field: zod_1.default.enum(['createdAt', 'name']),
        direction: zod_1.default.enum(['desc', 'asc']),
    })
        .optional(),
    filters: zod_1.default
        .object({
        name: zod_1.default.string().optional(),
    })
        .optional(),
    page: zod_1.default.number().optional(),
    pageSize: zod_1.default.number().optional(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
    // Broken in US controller
    // ignoreWorkbookEntries: z.boolean().optional(),
});
exports.listDirectoryBreadCrumbSchema = zod_1.default.object({
    title: zod_1.default.string(),
    path: zod_1.default.string(),
    entryId: zod_1.default.string(),
    isLocked: zod_1.default.boolean(),
    permissions: permissions_1.permissionsSchema,
});
exports.listDirectoryEntryOutputSchema = zod_1.default.object({
    entryId: zod_1.default.string(),
    key: zod_1.default.string(),
    scope: zod_1.default.string(),
    type: zod_1.default.string(),
    meta: zod_1.default.record(zod_1.default.string(), zod_1.default.unknown()).nullable(),
    createdAt: zod_1.default.string(),
    updatedAt: zod_1.default.string(),
    createdBy: zod_1.default.string(),
    updatedBy: zod_1.default.string(),
    savedId: zod_1.default.string(),
    publishedId: zod_1.default.string().nullable(),
    hidden: zod_1.default.boolean(),
    workbookId: zod_1.default.string(),
    workbookTitle: zod_1.default.string().nullable().optional(),
    isFavorite: zod_1.default.boolean(),
    isLocked: zod_1.default.boolean(),
    permissions: permissions_1.permissionsSchema.optional(),
    name: zod_1.default.string(),
});
exports.listDirectoryEntryResponseSchema = exports.listDirectoryEntryOutputSchema.extend({
    name: zod_1.default.string(),
});
exports.listDirectoryResultSchema = zod_1.default.object({
    nextPageToken: zod_1.default.boolean(),
    breadCrumbs: zod_1.default.array(exports.listDirectoryBreadCrumbSchema),
    entries: zod_1.default.array(exports.listDirectoryEntryOutputSchema),
});
exports.listDirectoryTransformedSchema = zod_1.default.object({
    hasNextPage: zod_1.default.boolean(),
    breadCrumbs: zod_1.default.array(exports.listDirectoryBreadCrumbSchema),
    entries: zod_1.default.array(exports.listDirectoryEntryResponseSchema),
});
