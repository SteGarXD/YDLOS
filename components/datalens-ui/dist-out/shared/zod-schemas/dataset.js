"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.datasetSchema = exports.datasetOptionsSchema = exports.datasetBodySchema = void 0;
const v4_1 = __importDefault(require("zod/v4"));
const __1 = require("..");
const dataset_1 = require("../types/dataset");
// Basic type schemas
const parameterDefaultValueSchema = v4_1.default.union([v4_1.default.string(), v4_1.default.number(), v4_1.default.boolean(), v4_1.default.null()]);
const datasetRlsSchema = v4_1.default.record(v4_1.default.string(), v4_1.default.string());
// Dataset field aggregation schema
const datasetFieldAggregationSchema = v4_1.default.enum(dataset_1.DatasetFieldAggregation);
// Dataset field type schema
const datasetFieldTypeSchema = v4_1.default.enum(dataset_1.DatasetFieldType);
// Dataset field types schema
const datasetFieldTypesSchema = v4_1.default.enum(dataset_1.DATASET_FIELD_TYPES);
// Dataset field calc mode schema
const datasetFieldCalcModeSchema = v4_1.default.union([
    v4_1.default.literal('formula'),
    v4_1.default.literal('direct'),
    v4_1.default.literal('parameter'),
]);
// Dataset value constraint schema
const datasetValueConstraintSchema = v4_1.default.discriminatedUnion('type', [
    v4_1.default.object({
        type: v4_1.default.literal(dataset_1.DATASET_VALUE_CONSTRAINT_TYPE.DEFAULT),
    }),
    v4_1.default.object({
        type: v4_1.default.literal(dataset_1.DATASET_VALUE_CONSTRAINT_TYPE.NULL),
    }),
    v4_1.default.object({
        type: v4_1.default.literal(dataset_1.DATASET_VALUE_CONSTRAINT_TYPE.REGEX),
        pattern: v4_1.default.string(),
    }),
]);
// Dataset field schema
const datasetFieldSchema = v4_1.default.object({
    aggregation: datasetFieldAggregationSchema,
    type: datasetFieldTypeSchema,
    calc_mode: datasetFieldCalcModeSchema,
    default_value: parameterDefaultValueSchema,
    initial_data_type: datasetFieldTypesSchema,
    cast: datasetFieldTypesSchema,
    data_type: datasetFieldTypesSchema,
    description: v4_1.default.string(),
    guid: v4_1.default.string(),
    title: v4_1.default.string(),
    managed_by: v4_1.default.string(),
    source: v4_1.default.string(),
    avatar_id: v4_1.default.string(),
    formula: v4_1.default.string().optional(),
    guid_formula: v4_1.default.string().optional(),
    has_auto_aggregation: v4_1.default.boolean(),
    aggregation_locked: v4_1.default.boolean(),
    lock_aggregation: v4_1.default.boolean(),
    virtual: v4_1.default.boolean(),
    valid: v4_1.default.boolean(),
    hidden: v4_1.default.boolean(),
    autoaggregated: v4_1.default.boolean(),
    template_enabled: v4_1.default.boolean().optional(),
    value_constraint: datasetValueConstraintSchema.optional().nullable(),
});
// Dataset component error item schema
const datasetComponentErrorItemSchema = v4_1.default.object({
    code: v4_1.default.string(),
    level: v4_1.default.string(),
    message: v4_1.default.string(),
    details: v4_1.default.object({
        db_message: v4_1.default.string().optional(),
        query: v4_1.default.string().optional(),
    }),
});
// Dataset component error schema
const datasetComponentErrorSchema = v4_1.default.object({
    id: v4_1.default.string(),
    type: v4_1.default.union([v4_1.default.literal('data_source'), v4_1.default.literal('field')]),
    errors: v4_1.default.array(datasetComponentErrorItemSchema),
});
// Obligatory default filter schema
const obligatoryDefaultFilterSchema = v4_1.default.object({
    column: v4_1.default.string(),
    operation: v4_1.default.string(),
    values: v4_1.default.array(v4_1.default.string()),
});
// Obligatory filter schema
const obligatoryFilterSchema = v4_1.default.object({
    id: v4_1.default.string(),
    field_guid: v4_1.default.string(),
    managed_by: v4_1.default.string(),
    valid: v4_1.default.boolean(),
    default_filters: v4_1.default.array(obligatoryDefaultFilterSchema),
});
// Dataset raw schema
const datasetRawSchemaSchema = v4_1.default.object({
    user_type: v4_1.default.string(),
    name: v4_1.default.string(),
    title: v4_1.default.string(),
    description: v4_1.default.string(),
    nullable: v4_1.default.boolean(),
    lock_aggregation: v4_1.default.boolean(),
    has_auto_aggregation: v4_1.default.boolean(),
    native_type: v4_1.default.object({
        name: v4_1.default.string(),
        conn_type: v4_1.default.string().optional(),
    }),
});
// Dataset source schema
const datasetSourceSchema = v4_1.default.object({
    id: v4_1.default.string(),
    connection_id: v4_1.default.string(),
    ref_source_id: v4_1.default.union([v4_1.default.string(), v4_1.default.null(), v4_1.default.undefined()]),
    name: v4_1.default.string().optional(),
    title: v4_1.default.string(),
    source_type: v4_1.default.string(),
    managed_by: v4_1.default.string(),
    parameter_hash: v4_1.default.string(),
    valid: v4_1.default.boolean(),
    is_ref: v4_1.default.boolean().optional(),
    virtual: v4_1.default.boolean(),
    raw_schema: v4_1.default.array(datasetRawSchemaSchema),
    group: v4_1.default.array(v4_1.default.string()).optional(),
    parameters: v4_1.default.object({
        table_name: v4_1.default.string().optional(),
        db_version: v4_1.default.string().optional(),
        db_name: v4_1.default.union([v4_1.default.string(), v4_1.default.null(), v4_1.default.undefined()]),
    }),
});
// Dataset source avatar schema
const datasetSourceAvatarSchema = v4_1.default.object({
    id: v4_1.default.string(),
    title: v4_1.default.string(),
    source_id: v4_1.default.string(),
    managed_by: v4_1.default.string(),
    valid: v4_1.default.boolean(),
    is_root: v4_1.default.boolean(),
    virtual: v4_1.default.boolean(),
});
// Dataset avatar relation condition schema
const datasetAvatarRelationConditionSchema = v4_1.default.object({
    operator: v4_1.default.string(),
    type: v4_1.default.string(),
    left: v4_1.default.object({
        calc_mode: v4_1.default.string(),
        source: v4_1.default.union([v4_1.default.string(), v4_1.default.null()]),
    }),
    right: v4_1.default.object({
        calc_mode: v4_1.default.string(),
        source: v4_1.default.union([v4_1.default.string(), v4_1.default.null()]),
    }),
});
// Dataset avatar relation schema
const datasetAvatarRelationSchema = v4_1.default.object({
    id: v4_1.default.string(),
    join_type: v4_1.default.string(),
    left_avatar_id: v4_1.default.string(),
    right_avatar_id: v4_1.default.string(),
    managed_by: v4_1.default.string(),
    virtual: v4_1.default.boolean(),
    conditions: v4_1.default.array(datasetAvatarRelationConditionSchema),
    required: v4_1.default.boolean(),
});
// Dataset option data type item schema
const datasetOptionDataTypeItemSchema = v4_1.default.object({
    aggregations: v4_1.default.array(datasetFieldAggregationSchema),
    casts: v4_1.default.array(datasetFieldTypesSchema),
    type: v4_1.default.string(),
    filter_operations: v4_1.default.array(v4_1.default.string()),
});
// Dataset option field item schema
const datasetOptionFieldItemSchema = v4_1.default.object({
    aggregations: v4_1.default.array(datasetFieldAggregationSchema),
    casts: v4_1.default.array(datasetFieldTypesSchema),
    guid: v4_1.default.string(),
});
// Dataset options schema
const datasetOptionsSchema = v4_1.default.object({
    connections: v4_1.default.object({
        compatible_types: v4_1.default.array(v4_1.default.string()),
        items: v4_1.default.array(v4_1.default.object({
            id: v4_1.default.string(),
            replacement_types: v4_1.default.array(v4_1.default.object({
                conn_type: v4_1.default.enum(__1.ConnectorType),
            })),
        })),
        max: v4_1.default.number(),
    }),
    syntax_highlighting_url: v4_1.default.string(),
    sources: v4_1.default.object({
        compatible_types: v4_1.default.array(v4_1.default.string()),
        items: v4_1.default.array(v4_1.default.object({
            schema_update_enabled: v4_1.default.boolean(),
            id: v4_1.default.string(),
        })),
    }),
    preview: v4_1.default.object({
        enabled: v4_1.default.boolean(),
    }),
    source_avatars: v4_1.default.object({
        items: v4_1.default.array(v4_1.default.object({
            schema_update_enabled: v4_1.default.boolean(),
            id: v4_1.default.string(),
        })),
        max: v4_1.default.number(),
    }),
    schema_update_enabled: v4_1.default.boolean(),
    supports_offset: v4_1.default.boolean(),
    supported_functions: v4_1.default.array(v4_1.default.string()),
    data_types: v4_1.default.object({
        items: v4_1.default.array(datasetOptionDataTypeItemSchema),
    }),
    fields: v4_1.default.object({
        items: v4_1.default.array(datasetOptionFieldItemSchema),
    }),
    join: v4_1.default.object({
        types: v4_1.default.array(v4_1.default.string()),
        operators: v4_1.default.array(v4_1.default.string()),
    }),
});
exports.datasetOptionsSchema = datasetOptionsSchema;
const datasetBodySchema = v4_1.default.object({
    avatar_relations: v4_1.default.array(datasetAvatarRelationSchema),
    component_errors: v4_1.default.object({
        items: v4_1.default.array(datasetComponentErrorSchema),
    }),
    obligatory_filters: v4_1.default.array(obligatoryFilterSchema),
    preview_enabled: v4_1.default.boolean(),
    result_schema: v4_1.default.array(datasetFieldSchema),
    result_schema_aux: v4_1.default.object({
        inter_dependencies: v4_1.default.object({
            deps: v4_1.default.array(v4_1.default.string()),
        }),
    }),
    rls: datasetRlsSchema,
    rls2: v4_1.default.object({}),
    source_avatars: v4_1.default.array(datasetSourceAvatarSchema),
    source_features: v4_1.default.record(v4_1.default.string(), v4_1.default.any()).optional(),
    sources: v4_1.default.array(datasetSourceSchema),
    revisionId: v4_1.default.string().optional(),
    load_preview_by_default: v4_1.default.boolean(),
    template_enabled: v4_1.default.boolean(),
    data_export_forbidden: v4_1.default.boolean().optional(),
});
exports.datasetBodySchema = datasetBodySchema;
// Main Dataset schema
const datasetSchema = v4_1.default.object({
    id: v4_1.default.string(),
    realName: v4_1.default.string(),
    is_favorite: v4_1.default.boolean(),
    key: v4_1.default.string(),
    options: datasetOptionsSchema,
    dataset: datasetBodySchema,
    workbook_id: v4_1.default.string().optional(),
    permissions: v4_1.default.any().optional(), // Using z.any() for Permissions type as it's complex
    // Backward compatibility fields
    avatar_relations: v4_1.default.array(datasetAvatarRelationSchema),
    component_errors: v4_1.default.object({
        items: v4_1.default.array(datasetComponentErrorSchema),
    }),
    preview_enabled: v4_1.default.boolean(),
    raw_schema: v4_1.default.array(datasetRawSchemaSchema).optional(),
    result_schema: v4_1.default.array(datasetFieldSchema).optional(),
    rls: datasetRlsSchema,
    source_avatars: v4_1.default.array(datasetSourceAvatarSchema),
    source_features: v4_1.default.record(v4_1.default.string(), v4_1.default.any()),
    sources: v4_1.default.array(datasetSourceSchema),
});
exports.datasetSchema = datasetSchema;
