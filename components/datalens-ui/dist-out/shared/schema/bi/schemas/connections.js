"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConnectionResultSchema = exports.updateConnectionArgsSchema = exports.createConnectionResultSchema = exports.createConnectionArgsSchema = exports.getConnectionResultSchema = exports.getConnectionArgsSchema = exports.deleteConnectionResultSchema = exports.deleteConnectionArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const openapi_1 = require("../../../utils/openapi");
const BI_SCHEMA_NAME = {
    ConnectionCreate: 'ConnectionCreate',
    ConnectionRead: 'ConnectionRead',
    ConnectionUpdate: 'ConnectionUpdate',
};
exports.deleteConnectionArgsSchema = zod_1.default.strictObject({
    connectionId: zod_1.default.string(),
});
exports.deleteConnectionResultSchema = zod_1.default.unknown();
exports.getConnectionArgsSchema = zod_1.default.strictObject({
    connectionId: zod_1.default.string(),
    workbookId: zod_1.default.string().nullable().optional(),
    rev_id: zod_1.default.string().optional(),
});
exports.getConnectionResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.ConnectionRead),
});
exports.createConnectionArgsSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.ConnectionCreate),
});
exports.createConnectionResultSchema = zod_1.default.object({
    id: zod_1.default.string(),
});
exports.updateConnectionArgsSchema = zod_1.default.strictObject({
    connectionId: zod_1.default.string(),
    data: zod_1.default.any().meta({
        $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.ConnectionUpdate),
    }),
});
exports.updateConnectionResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.ConnectionRead),
});
