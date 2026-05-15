"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntriesTransformedSchema = exports.getEntriesResultSchema = exports.getEntriesEntryResponseSchema = exports.getEntriesEntryOutputSchema = exports.getEntriesArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const permissions_1 = require("../../../../zod-schemas/permissions");
exports.getEntriesArgsSchema = zod_1.default
    .object({
    excludeLocked: zod_1.default.boolean().optional(),
    includeData: zod_1.default.boolean().optional(),
    includeLinks: zod_1.default.boolean().optional(),
    filters: zod_1.default
        .object({
        name: zod_1.default.string().optional(),
    })
        .optional(),
    orderBy: zod_1.default
        .object({
        field: zod_1.default.enum(['createdAt', 'name']),
        direction: zod_1.default.enum(['desc', 'asc']),
    })
        .optional(),
    createdBy: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]).optional(),
    page: zod_1.default.number().optional(),
    pageSize: zod_1.default.number().optional(),
    includePermissionsInfo: zod_1.default.boolean().optional(),
    ignoreWorkbookEntries: zod_1.default.boolean().optional(),
})
    .and(zod_1.default.union([
    zod_1.default.object({
        scope: zod_1.default.string(),
        ids: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]).optional(),
    }),
    zod_1.default.object({
        scope: zod_1.default.string().optional(),
        ids: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]),
    }),
]));
const getEntriesLockedEntry = zod_1.default.object({
    isLocked: zod_1.default.literal(true),
    entryId: zod_1.default.string(),
    scope: zod_1.default.string(),
    type: zod_1.default.string(),
});
const getEntriesEntry = zod_1.default.object({
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
    workbookId: zod_1.default.string().nullable(),
    workbookTitle: zod_1.default.string().nullable().optional(),
    isFavorite: zod_1.default.boolean(),
    isLocked: zod_1.default.literal(false).optional(),
    permissions: permissions_1.permissionsSchema.optional(),
    links: zod_1.default.record(zod_1.default.string(), zod_1.default.string()).nullable(),
    data: zod_1.default.record(zod_1.default.string(), zod_1.default.unknown()).optional(),
});
exports.getEntriesEntryOutputSchema = zod_1.default.union([getEntriesLockedEntry, getEntriesEntry]);
exports.getEntriesEntryResponseSchema = zod_1.default.union([
    getEntriesLockedEntry.extend({ name: zod_1.default.string() }),
    getEntriesEntry.extend({ name: zod_1.default.string() }),
]);
exports.getEntriesResultSchema = zod_1.default.object({
    nextPageToken: zod_1.default.string().optional(),
    entries: zod_1.default.array(exports.getEntriesEntryOutputSchema),
});
exports.getEntriesTransformedSchema = zod_1.default.object({
    hasNextPage: zod_1.default.boolean(),
    entries: zod_1.default.array(exports.getEntriesEntryResponseSchema),
});
