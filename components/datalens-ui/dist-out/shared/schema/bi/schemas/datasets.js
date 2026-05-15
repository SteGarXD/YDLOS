"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatasetResultSchema = exports.validateDatasetArgsSchema = exports.getDatasetByVersionResultSchema = exports.getDatasetByVersionArgsSchema = exports.deleteDatasetResultSchema = exports.deleteDatasetArgsSchema = exports.updateDatasetResultSchema = exports.updateDatasetArgsSchema = exports.createDatasetResultSchema = exports.createDatasetArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const openapi_1 = require("../../../utils/openapi");
const BI_SCHEMA_NAME = {
    DatasetCreate: 'DatasetCreate',
    DatasetUpdate: 'DatasetUpdate',
    DatasetRead: 'DatasetRead',
    DatasetValidate: 'DatasetValidate',
};
exports.createDatasetArgsSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetCreate),
});
exports.createDatasetResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetRead),
});
exports.updateDatasetArgsSchema = zod_1.default.strictObject({
    datasetId: zod_1.default.string(),
    data: zod_1.default.any().meta({
        $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetUpdate),
    }),
});
exports.updateDatasetResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetRead),
});
exports.deleteDatasetArgsSchema = zod_1.default.strictObject({
    datasetId: zod_1.default.string(),
});
exports.deleteDatasetResultSchema = zod_1.default.unknown();
exports.getDatasetByVersionArgsSchema = zod_1.default.strictObject({
    datasetId: zod_1.default.string(),
    workbookId: zod_1.default.string().nullable().optional(),
    rev_id: zod_1.default.string().optional(),
});
exports.getDatasetByVersionResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetRead),
});
exports.validateDatasetArgsSchema = zod_1.default.strictObject({
    datasetId: zod_1.default.string(),
    workbookId: zod_1.default.string().nullable().optional(),
    data: zod_1.default.any().meta({
        $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetValidate),
    }),
});
exports.validateDatasetResultSchema = zod_1.default.any().meta({
    $ref: (0, openapi_1.makeSchemaRef)(BI_SCHEMA_NAME.DatasetRead),
});
