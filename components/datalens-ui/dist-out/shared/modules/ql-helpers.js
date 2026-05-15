"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATALENS_QL_TYPES = exports.DATALENS_QL_CONNECTION_TYPES = void 0;
exports.biToDatalensQL = biToDatalensQL;
exports.getDatalensQLTypeName = getDatalensQLTypeName;
const constants_1 = require("../constants");
exports.DATALENS_QL_CONNECTION_TYPES = {
    CLICKHOUSE: constants_1.ConnectorType.Clickhouse,
    MSSQL: constants_1.ConnectorType.Mssql,
    MYSQL: constants_1.ConnectorType.Mysql,
    ORACLE: constants_1.ConnectorType.Oracle,
    POSTGRESQL: constants_1.ConnectorType.Postgres,
    TRINO: constants_1.ConnectorType.Trino,
    YQL: constants_1.ConnectorType.Yq, // YDB, YQ
    PROMQL: constants_1.ConnectorType.Promql,
    MONITORING: constants_1.ConnectorType.Monitoring,
};
const YQL_TYPES = {
    BOOL: 'Bool',
    DATE: 'Date',
    DATETIME: 'Datetime',
    DATETIMETZ: 'DatetimeTZ',
    UUID: 'UUID',
    STRING: 'String',
    DOUBLE: 'Double',
    INT64: 'Int64',
};
const CLICKHOUSE_TYPES = {
    DATE: 'Date',
    DATETIME: 'DateTime',
    DATETIME64: 'DateTime64',
    ENUM8: 'Enum8',
    ENUM16: 'Enum16',
    UUID: 'UUID',
    STRING: 'String',
    FIXEDSTRING: 'FixedString',
    FLOAT32: 'Float32',
    FLOAT64: 'Float64',
    DECIMAL: 'Decimal',
    INT8: 'Int8',
    INT16: 'Int16',
    INT32: 'Int32',
    INT64: 'Int64',
    UINT8: 'UInt8',
    UINT16: 'UInt16',
    UINT32: 'UInt32',
    UINT64: 'UInt64',
};
const CLICKHOUSE_TO_YQL_BASE = {
    [CLICKHOUSE_TYPES.DATE]: YQL_TYPES.DATE,
    [CLICKHOUSE_TYPES.DATETIME]: YQL_TYPES.DATETIME,
    [CLICKHOUSE_TYPES.UUID]: YQL_TYPES.UUID,
    [CLICKHOUSE_TYPES.STRING]: YQL_TYPES.STRING,
    [CLICKHOUSE_TYPES.FIXEDSTRING]: YQL_TYPES.STRING,
    [CLICKHOUSE_TYPES.FLOAT32]: YQL_TYPES.DOUBLE,
    [CLICKHOUSE_TYPES.FLOAT64]: YQL_TYPES.DOUBLE,
    [CLICKHOUSE_TYPES.DECIMAL]: YQL_TYPES.DOUBLE,
    [CLICKHOUSE_TYPES.INT8]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.INT16]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.INT32]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.INT64]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.UINT8]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.UINT16]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.UINT32]: YQL_TYPES.INT64,
    [CLICKHOUSE_TYPES.UINT64]: YQL_TYPES.INT64,
};
const CLICKHOUSE_TO_YQL = Object.keys(CLICKHOUSE_TO_YQL_BASE).reduce((res, key) => {
    const val = CLICKHOUSE_TO_YQL_BASE[key];
    return {
        ...res,
        [key]: val,
        [`Nullable(${key})`]: val,
        [`LowCardinality(${key})`]: val,
        [`LowCardinality(Nullable(${key}))`]: val,
    };
}, {});
const CLICKHOUSE_TO_YQL_PREFIX_BASE = {
    [CLICKHOUSE_TYPES.DECIMAL]: YQL_TYPES.DOUBLE,
    [CLICKHOUSE_TYPES.DATETIME]: YQL_TYPES.DATETIMETZ,
    [CLICKHOUSE_TYPES.DATETIME64]: YQL_TYPES.DATETIMETZ,
    [CLICKHOUSE_TYPES.ENUM8]: YQL_TYPES.STRING,
    [CLICKHOUSE_TYPES.ENUM8]: YQL_TYPES.STRING,
};
const CLICKHOUSE_TO_YQL_PREFIX = Object.keys(CLICKHOUSE_TO_YQL_PREFIX_BASE).reduce((res, key) => {
    const val = CLICKHOUSE_TO_YQL_PREFIX_BASE[key];
    return {
        ...res,
        [key]: val,
        [`Nullable(${key}`]: val,
        [`LowCardinality(${key}`]: val,
        [`LowCardinality(Nullable(${key}`]: val,
    };
}, {});
function clickhouseToYQL(typeName) {
    let result = CLICKHOUSE_TO_YQL[typeName];
    if (result) {
        return result;
    }
    const pieces = typeName.split('(');
    for (let i = 1; i <= 3; ++i) {
        result = CLICKHOUSE_TO_YQL_PREFIX[pieces.slice(0, i).join('(')];
        if (result) {
            return result;
        }
    }
    return undefined;
}
const POSTGRESQL_TYPES = {
    BOOL: 'bool',
    INT2: 'int2',
    INT4: 'int4',
    INT8: 'int8',
    OID: 'oid',
    TEXT: 'text',
    CHAR: 'char',
    VARCHAR: 'varchar',
    NAME: 'name',
    ENUM: 'enum',
    FLOAT4: 'float4',
    FLOAT8: 'float8',
    NUMERIC: 'numeric',
    DATE: 'date',
    TIMESTAMP: 'timestamp',
    TIMESTAMPTZ: 'timestamptz',
    UUID: 'uuid',
};
const POSTGRESQL_TO_YQL = {
    [POSTGRESQL_TYPES.BOOL]: YQL_TYPES.BOOL,
    [POSTGRESQL_TYPES.INT2]: YQL_TYPES.INT64,
    [POSTGRESQL_TYPES.INT4]: YQL_TYPES.INT64,
    [POSTGRESQL_TYPES.INT8]: YQL_TYPES.INT64,
    [POSTGRESQL_TYPES.OID]: YQL_TYPES.INT64,
    [POSTGRESQL_TYPES.TEXT]: YQL_TYPES.STRING,
    [POSTGRESQL_TYPES.CHAR]: YQL_TYPES.STRING,
    [POSTGRESQL_TYPES.VARCHAR]: YQL_TYPES.STRING,
    [POSTGRESQL_TYPES.NAME]: YQL_TYPES.STRING,
    [POSTGRESQL_TYPES.ENUM]: YQL_TYPES.STRING,
    [POSTGRESQL_TYPES.FLOAT4]: YQL_TYPES.DOUBLE,
    [POSTGRESQL_TYPES.FLOAT8]: YQL_TYPES.DOUBLE,
    [POSTGRESQL_TYPES.NUMERIC]: YQL_TYPES.DOUBLE,
    [POSTGRESQL_TYPES.DATE]: YQL_TYPES.DATE,
    [POSTGRESQL_TYPES.TIMESTAMP]: YQL_TYPES.DATETIME,
    [POSTGRESQL_TYPES.TIMESTAMPTZ]: YQL_TYPES.DATETIMETZ,
    [POSTGRESQL_TYPES.UUID]: YQL_TYPES.UUID,
};
function postgreSQLToYQL(typeName) {
    return POSTGRESQL_TO_YQL[typeName];
}
exports.DATALENS_QL_TYPES = {
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    STRING: 'string',
    DATE: 'date',
    DATETIME: 'datetime',
    UNKNOWN: 'unknown',
};
const YQL_TO_DATALENS_SQL = {
    [YQL_TYPES.BOOL]: exports.DATALENS_QL_TYPES.BOOLEAN,
    [YQL_TYPES.INT64]: exports.DATALENS_QL_TYPES.NUMBER,
    [YQL_TYPES.STRING]: exports.DATALENS_QL_TYPES.STRING,
    [YQL_TYPES.DOUBLE]: exports.DATALENS_QL_TYPES.NUMBER,
    [YQL_TYPES.DATE]: exports.DATALENS_QL_TYPES.DATE,
    [YQL_TYPES.DATETIME]: exports.DATALENS_QL_TYPES.DATETIME,
    [YQL_TYPES.DATETIMETZ]: exports.DATALENS_QL_TYPES.DATETIME,
    [YQL_TYPES.UUID]: exports.DATALENS_QL_TYPES.STRING,
};
const BI_TYPES = {
    // Without: geopoint, geopolygon, markup, unsupported
    STRING: 'string',
    INTEGER: 'integer',
    FLOAT: 'float',
    DATE: 'date',
    DATETIME: 'datetime',
    DATETIMETZ: 'datetimetz',
    GENERICDATETIME: 'genericdatetime',
    BOOLEAN: 'boolean',
    UUID: 'uuid',
};
const BI_TO_DATALENS_SQL = {
    [BI_TYPES.STRING]: exports.DATALENS_QL_TYPES.STRING,
    [BI_TYPES.INTEGER]: exports.DATALENS_QL_TYPES.NUMBER,
    [BI_TYPES.FLOAT]: exports.DATALENS_QL_TYPES.NUMBER,
    [BI_TYPES.DATE]: exports.DATALENS_QL_TYPES.DATE,
    [BI_TYPES.DATETIME]: exports.DATALENS_QL_TYPES.DATETIME,
    [BI_TYPES.DATETIMETZ]: exports.DATALENS_QL_TYPES.DATETIME,
    [BI_TYPES.GENERICDATETIME]: exports.DATALENS_QL_TYPES.DATETIME,
    [BI_TYPES.BOOLEAN]: exports.DATALENS_QL_TYPES.BOOLEAN,
    [BI_TYPES.UUID]: exports.DATALENS_QL_TYPES.STRING,
};
function yqlToDatalensQL(typeName) {
    return typeName
        ? YQL_TO_DATALENS_SQL[typeName] || exports.DATALENS_QL_TYPES.UNKNOWN
        : exports.DATALENS_QL_TYPES.UNKNOWN;
}
function biToDatalensQL(typeName) {
    return typeName
        ? BI_TO_DATALENS_SQL[typeName] || exports.DATALENS_QL_TYPES.UNKNOWN
        : exports.DATALENS_QL_TYPES.UNKNOWN;
}
function getDatalensQLTypeName(typeName, connectionType) {
    let yqlType = exports.DATALENS_QL_TYPES.UNKNOWN;
    if (connectionType === exports.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE) {
        yqlType = clickhouseToYQL(typeName);
    }
    else if (connectionType === exports.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL) {
        yqlType = postgreSQLToYQL(typeName);
    }
    else {
        return yqlType;
    }
    return yqlToDatalensQL(yqlType);
}
