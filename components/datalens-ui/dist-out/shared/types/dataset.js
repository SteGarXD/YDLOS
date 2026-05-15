"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATASET_VALUE_CONSTRAINT_TYPE = exports.DatasetFieldType = exports.DatasetFieldAggregation = exports.COMMON_FIELD_TYPES = exports.AVAILABLE_FIELD_TYPES = exports.DATASET_IGNORED_DATA_TYPES = exports.DATASET_FIELD_TYPES = void 0;
// eslint-disable-next-line @typescript-eslint/naming-convention
var DATASET_FIELD_TYPES;
(function (DATASET_FIELD_TYPES) {
    DATASET_FIELD_TYPES["DATE"] = "date";
    DATASET_FIELD_TYPES["GENERICDATETIME"] = "genericdatetime";
    DATASET_FIELD_TYPES["DATETIMETZ"] = "datetimetz";
    DATASET_FIELD_TYPES["INTEGER"] = "integer";
    DATASET_FIELD_TYPES["UINTEGER"] = "uinteger";
    DATASET_FIELD_TYPES["STRING"] = "string";
    DATASET_FIELD_TYPES["FLOAT"] = "float";
    DATASET_FIELD_TYPES["BOOLEAN"] = "boolean";
    DATASET_FIELD_TYPES["GEOPOINT"] = "geopoint";
    DATASET_FIELD_TYPES["GEOPOLYGON"] = "geopolygon";
    DATASET_FIELD_TYPES["MARKUP"] = "markup";
    DATASET_FIELD_TYPES["HEATMAP"] = "heatmap";
    DATASET_FIELD_TYPES["ARRAY_INT"] = "array_int";
    DATASET_FIELD_TYPES["ARRAY_FLOAT"] = "array_float";
    DATASET_FIELD_TYPES["ARRAY_STR"] = "array_str";
    DATASET_FIELD_TYPES["UNSUPPORTED"] = "unsupported";
    // HIERARCHY - the value is used in the client part of the wizard, in the future it will come from the backend.
    DATASET_FIELD_TYPES["HIERARCHY"] = "hierarchy";
    DATASET_FIELD_TYPES["TREE_STR"] = "tree_str";
    DATASET_FIELD_TYPES["TREE_INT"] = "tree_int";
    DATASET_FIELD_TYPES["TREE_FLOAT"] = "tree_float";
})(DATASET_FIELD_TYPES || (exports.DATASET_FIELD_TYPES = DATASET_FIELD_TYPES = {}));
exports.DATASET_IGNORED_DATA_TYPES = [
    DATASET_FIELD_TYPES.MARKUP,
    DATASET_FIELD_TYPES.TREE_STR,
    DATASET_FIELD_TYPES.TREE_INT,
    DATASET_FIELD_TYPES.TREE_FLOAT,
    DATASET_FIELD_TYPES.ARRAY_STR,
    DATASET_FIELD_TYPES.ARRAY_INT,
    DATASET_FIELD_TYPES.ARRAY_FLOAT,
];
exports.AVAILABLE_FIELD_TYPES = [
    DATASET_FIELD_TYPES.INTEGER,
    DATASET_FIELD_TYPES.STRING,
    DATASET_FIELD_TYPES.FLOAT,
    DATASET_FIELD_TYPES.BOOLEAN,
    DATASET_FIELD_TYPES.DATE,
    DATASET_FIELD_TYPES.GENERICDATETIME,
];
exports.COMMON_FIELD_TYPES = [
    DATASET_FIELD_TYPES.ARRAY_FLOAT,
    DATASET_FIELD_TYPES.ARRAY_INT,
    DATASET_FIELD_TYPES.ARRAY_STR,
    DATASET_FIELD_TYPES.DATE,
    DATASET_FIELD_TYPES.FLOAT,
    DATASET_FIELD_TYPES.GENERICDATETIME,
    DATASET_FIELD_TYPES.GEOPOINT,
    DATASET_FIELD_TYPES.GEOPOLYGON,
    DATASET_FIELD_TYPES.INTEGER,
    DATASET_FIELD_TYPES.MARKUP,
    DATASET_FIELD_TYPES.STRING,
    DATASET_FIELD_TYPES.UNSUPPORTED,
];
var DatasetFieldAggregation;
(function (DatasetFieldAggregation) {
    DatasetFieldAggregation["None"] = "none";
    DatasetFieldAggregation["Sum"] = "sum";
    DatasetFieldAggregation["Avg"] = "avg";
    DatasetFieldAggregation["Min"] = "min";
    DatasetFieldAggregation["Max"] = "max";
    DatasetFieldAggregation["Count"] = "count";
    DatasetFieldAggregation["Countunique"] = "countunique";
})(DatasetFieldAggregation || (exports.DatasetFieldAggregation = DatasetFieldAggregation = {}));
var DatasetFieldType;
(function (DatasetFieldType) {
    DatasetFieldType["Dimension"] = "DIMENSION";
    DatasetFieldType["Measure"] = "MEASURE";
    DatasetFieldType["Pseudo"] = "PSEUDO";
    DatasetFieldType["Parameter"] = "PARAMETER";
})(DatasetFieldType || (exports.DatasetFieldType = DatasetFieldType = {}));
exports.DATASET_VALUE_CONSTRAINT_TYPE = {
    DEFAULT: 'default',
    NULL: 'null',
    REGEX: 'regex',
};
