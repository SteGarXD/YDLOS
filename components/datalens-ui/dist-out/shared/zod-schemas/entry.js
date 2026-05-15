"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTRY_SCHEMAS = void 0;
const zod_1 = __importDefault(require("zod"));
exports.ENTRY_SCHEMAS = {
    entryId: zod_1.default.string(),
    createdAt: zod_1.default.string(),
    createdBy: zod_1.default.string(),
    updatedAt: zod_1.default.string(),
    updatedBy: zod_1.default.string(),
    annotation: zod_1.default
        .object({
        description: zod_1.default.string().optional(),
    })
        .nullable()
        .optional(),
};
