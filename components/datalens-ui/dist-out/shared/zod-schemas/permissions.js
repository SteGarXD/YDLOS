"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.permissionsSchema = zod_1.default.object({
    execute: zod_1.default.boolean(),
    read: zod_1.default.boolean(),
    edit: zod_1.default.boolean(),
    admin: zod_1.default.boolean(),
});
