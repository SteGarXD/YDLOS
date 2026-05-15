"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.datalensOperationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const timeSchema = zod_1.default.object({
    seconds: zod_1.default.string(),
    nanos: zod_1.default.number().optional(),
});
exports.datalensOperationSchema = zod_1.default.object({
    id: zod_1.default.string(),
    description: zod_1.default.string(),
    //project: z.string(),
    createdBy: zod_1.default.string(),
    createdAt: timeSchema,
    modifiedAt: timeSchema,
    metadata: zod_1.default.object({}),
    done: zod_1.default.boolean(),
});
