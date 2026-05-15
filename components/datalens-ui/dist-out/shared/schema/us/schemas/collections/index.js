"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionSchema = exports.collectionPermissionsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.collectionPermissionsSchema = zod_1.default.object({
    listAccessBindings: zod_1.default.boolean(),
    updateAccessBindings: zod_1.default.boolean(),
    createSharedEntry: zod_1.default.boolean(),
    createCollection: zod_1.default.boolean(),
    createWorkbook: zod_1.default.boolean(),
    limitedView: zod_1.default.boolean(),
    view: zod_1.default.boolean(),
    update: zod_1.default.boolean(),
    copy: zod_1.default.boolean(),
    move: zod_1.default.boolean(),
    delete: zod_1.default.boolean(),
});
exports.collectionSchema = zod_1.default.object({
    collectionId: zod_1.default.string(),
    title: zod_1.default.string(),
    description: zod_1.default.string().nullable(),
    parentId: zod_1.default.string().nullable(),
    projectId: zod_1.default.string().nullable(),
    tenantId: zod_1.default.string(),
    createdBy: zod_1.default.string(),
    createdAt: zod_1.default.string(),
    updatedBy: zod_1.default.string(),
    updatedAt: zod_1.default.string(),
    meta: zod_1.default.record(zod_1.default.string(), zod_1.default.unknown()),
});
