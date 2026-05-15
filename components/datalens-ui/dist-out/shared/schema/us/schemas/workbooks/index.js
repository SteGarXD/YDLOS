"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workbookPermissionsSchema = exports.workbookSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const workbooks_1 = require("../../../../constants/workbooks");
exports.workbookSchema = zod_1.default.object({
    workbookId: zod_1.default.string(),
    collectionId: zod_1.default.string().nullable(),
    title: zod_1.default.string(),
    description: zod_1.default.string().nullable(),
    tenantId: zod_1.default.string(),
    projectId: zod_1.default.string().nullable(),
    meta: zod_1.default
        .object({
        importId: zod_1.default.string().optional(),
    })
        .and(zod_1.default.record(zod_1.default.string(), zod_1.default.unknown())),
    createdBy: zod_1.default.string(),
    createdAt: zod_1.default.string(),
    updatedBy: zod_1.default.string(),
    updatedAt: zod_1.default.string(),
    status: zod_1.default.enum(workbooks_1.WORKBOOK_STATUS).optional(),
});
exports.workbookPermissionsSchema = zod_1.default.object({
    listAccessBindings: zod_1.default.boolean(),
    updateAccessBindings: zod_1.default.boolean(),
    limitedView: zod_1.default.boolean(),
    view: zod_1.default.boolean(),
    update: zod_1.default.boolean(),
    copy: zod_1.default.boolean(),
    move: zod_1.default.boolean(),
    publish: zod_1.default.boolean(),
    embed: zod_1.default.boolean(),
    delete: zod_1.default.boolean(),
});
