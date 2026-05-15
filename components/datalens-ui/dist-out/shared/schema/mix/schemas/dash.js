"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashResultSchema = exports.getDashArgsSchema = exports.createDashResultSchema = exports.createDashArgsSchema = exports.updateDashResultSchema = exports.updateDashArgsSchema = exports.deleteDashResultSchema = exports.deleteDashArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const __1 = require("../../..");
const dash_1 = require("../../../zod-schemas/dash");
exports.deleteDashArgsSchema = zod_1.default.strictObject({
    dashboardId: zod_1.default.string(),
    lockToken: zod_1.default.string().optional(),
});
exports.deleteDashResultSchema = zod_1.default.object({});
const dashUsSchema = zod_1.default.object({
    ...dash_1.dashSchema.shape,
    entryId: zod_1.default.string(),
    scope: zod_1.default.literal(__1.EntryScope.Dash),
    public: zod_1.default.boolean(),
    isFavorite: zod_1.default.boolean(),
    createdAt: zod_1.default.string(),
    createdBy: zod_1.default.string(),
    updatedAt: zod_1.default.string(),
    updatedBy: zod_1.default.string(),
    revId: zod_1.default.string(),
    savedId: zod_1.default.string(),
    publishedId: zod_1.default.string(),
    meta: zod_1.default.record(zod_1.default.string(), zod_1.default.string()),
    links: zod_1.default.record(zod_1.default.string(), zod_1.default.string()).optional(),
    key: zod_1.default.union([zod_1.default.null(), zod_1.default.string()]),
    workbookId: zod_1.default.union([zod_1.default.null(), zod_1.default.string()]),
    type: zod_1.default.literal(''),
});
exports.updateDashArgsSchema = zod_1.default.strictObject({
    key: zod_1.default.string().min(1),
    workbookId: zod_1.default.string().optional(),
    data: dash_1.dataSchema,
    meta: zod_1.default.record(zod_1.default.any(), zod_1.default.any()),
    links: zod_1.default.record(zod_1.default.string(), zod_1.default.string()),
    entryId: zod_1.default.string(),
    revId: zod_1.default.string(),
    mode: zod_1.default.enum(__1.EntryUpdateMode),
});
exports.updateDashResultSchema = dashUsSchema;
exports.createDashArgsSchema = zod_1.default.strictObject({
    key: zod_1.default.string().min(1),
    data: dash_1.dataSchema,
    meta: zod_1.default.record(zod_1.default.any(), zod_1.default.any()).optional(),
    links: zod_1.default.record(zod_1.default.string(), zod_1.default.string()).optional(),
    workbookId: zod_1.default.string().optional(),
    lockToken: zod_1.default.string().optional(),
    mode: zod_1.default.enum(__1.EntryUpdateMode),
});
exports.createDashResultSchema = dashUsSchema;
exports.getDashArgsSchema = zod_1.default.strictObject({
    dashboardId: zod_1.default.string(),
    revId: zod_1.default.string().optional(),
    includePermissions: zod_1.default.boolean().optional().default(false),
    includeLinks: zod_1.default.boolean().optional().default(false),
    includeFavorite: zod_1.default.boolean().optional().default(false),
    branch: zod_1.default.enum(['published', 'saved']).optional(),
});
exports.getDashResultSchema = dashUsSchema;
