"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualizationCanHaveContinuousAxis = exports.doesQueryContainOrderBy = exports.prepareQuery = exports.parseNumberValueForTable = exports.parseNumberValue = exports.renderValue = exports.formatUnknownTypeValue = void 0;
exports.setConsole = setConsole;
exports.log = log;
exports.logTiming = logTiming;
exports.buildSource = buildSource;
exports.getRows = getRows;
exports.getColumns = getColumns;
exports.getColumnsAndRows = getColumnsAndRows;
exports.isGroup = isGroup;
exports.iterateThroughVisibleQueries = iterateThroughVisibleQueries;
const date_utils_1 = require("@gravity-ui/date-utils");
const shared_1 = require("../../../../../../shared");
const constants_1 = require("../../control/url/constants");
const connection_1 = require("./connection");
const constants_2 = require("./constants");
var value_helpers_1 = require("./value-helpers");
Object.defineProperty(exports, "formatUnknownTypeValue", { enumerable: true, get: function () { return value_helpers_1.formatUnknownTypeValue; } });
Object.defineProperty(exports, "renderValue", { enumerable: true, get: function () { return value_helpers_1.renderValue; } });
Object.defineProperty(exports, "parseNumberValue", { enumerable: true, get: function () { return value_helpers_1.parseNumberValue; } });
Object.defineProperty(exports, "parseNumberValueForTable", { enumerable: true, get: function () { return value_helpers_1.parseNumberValueForTable; } });
let currentConsole = console;
function setConsole(newConsole) {
    currentConsole = newConsole;
}
function log(...data) {
    return constants_2.LOG_INFO && currentConsole.log(...data);
}
function logTiming(...data) {
    return constants_2.LOG_TIMING && currentConsole.log(...data);
}
const clickhouseQuotemap = {
    // Unlike most databases, CH only works with binary strings
    // (not unicode), and supports entering a 0 byte via \0.
    '\b': '\\b',
    '\f': '\\f',
    '\r': '\\r',
    '\n': '\\n',
    '\t': '\\t',
    '\0': '\\0',
    '\\': '\\\\',
    "'": "\\'",
};
function escapeSingleForClickhouse(input, type) {
    var _a, _b;
    const escapedValue = String(input).replace(/([\b\f\r\n\t\0\\'])/g, (match) => clickhouseQuotemap[match]);
    switch (type) {
        case shared_1.QLParamType.String:
            return `'${escapedValue}'`;
        case shared_1.QLParamType.Number:
        case shared_1.QLParamType.Boolean:
            return escapedValue;
        case shared_1.QLParamType.Date:
        case shared_1.QLParamType.DateInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `toDate('${(_a = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _a === void 0 ? void 0 : _a.format('YYYY-MM-DD')}')`;
        case shared_1.QLParamType.Datetime:
        case shared_1.QLParamType.DatetimeInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `toDateTime('${(_b = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _b === void 0 ? void 0 : _b.format('YYYY-MM-DD HH:mm:ss')}')`;
        default:
            throw new Error('Unsupported parameter type passed');
    }
}
const quotemap = {
    // Common to most databases: quotas via backslash, with the exception of
    // the 0 byte, which can only be cut.
    '\b': '\\b',
    '\f': '\\f',
    '\r': '\\r',
    '\n': '\\n',
    '\t': '\\t',
    '\0': '',
    '\\': '\\\\',
    "'": "\\'",
};
function escapeSingleForPostgreSQL(input, type) {
    var _a, _b;
    const escapedValue = String(input).replace(/([\b\f\r\n\t\0\\'])/g, (match) => quotemap[match]);
    switch (type) {
        case shared_1.QLParamType.String:
            return `E'${escapedValue}'`;
        case shared_1.QLParamType.Number:
        case shared_1.QLParamType.Boolean:
            return escapedValue;
        case shared_1.QLParamType.Date:
        case shared_1.QLParamType.DateInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `'${(_a = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _a === void 0 ? void 0 : _a.format('YYYY-MM-DD')}'::date`;
        case shared_1.QLParamType.Datetime:
        case shared_1.QLParamType.DatetimeInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `'${(_b = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _b === void 0 ? void 0 : _b.format('YYYY-MM-DDTHH:mm:ss')}'::timestamp`;
        default:
            throw new Error('Unsupported parameter type passed');
    }
}
function escapeSingleOther(input, type) {
    var _a, _b;
    const escapedValue = String(input).replace(/([\b\f\r\n\t\0\\'])/g, (match) => quotemap[match]);
    switch (type) {
        case shared_1.QLParamType.String:
            return `'${escapedValue}'`;
        case shared_1.QLParamType.Number:
        case shared_1.QLParamType.Boolean:
            return escapedValue;
        case shared_1.QLParamType.Date:
        case shared_1.QLParamType.DateInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `'${(_a = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _a === void 0 ? void 0 : _a.format('YYYY-MM-DD')}'`;
        case shared_1.QLParamType.Datetime:
        case shared_1.QLParamType.DatetimeInterval:
            // The time is already in UTC, so we do .utc() so it does not convert once again
            return `'${(_b = (0, date_utils_1.dateTimeParse)(escapedValue, { timeZone: 'UTC' })) === null || _b === void 0 ? void 0 : _b.format('YYYY-MM-DDTHH:mm:ss')}'`;
        default:
            throw new Error('Unsupported parameter type passed');
    }
}
function wrapQuotedValue(quotedValue, operation) {
    switch (operation === null || operation === void 0 ? void 0 : operation.toLowerCase()) {
        case 'in':
            return `(${quotedValue})`;
        case '=':
        default:
            return quotedValue;
    }
}
function escape(input, connectionType, paramDescription, operation) {
    const type = paramDescription ? paramDescription.type.toLowerCase() : 'string';
    let quoter = escapeSingleOther;
    if (connectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE) {
        quoter = escapeSingleForClickhouse;
    }
    else if (connectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL) {
        quoter = escapeSingleForPostgreSQL;
    }
    if (Array.isArray(input)) {
        if (input.length === 1) {
            return wrapQuotedValue(quoter(String(input[0]), type), operation);
        }
        else {
            const result = input.map((inputEntry) => quoter(inputEntry, type)).join(', ');
            return `(${result})`;
        }
    }
    else {
        return wrapQuotedValue(quoter(String(input), type), operation);
    }
}
function dumpReqParamValue(input, type, datalensQLConnectionType) {
    var _a, _b, _c, _d;
    let newValue;
    switch (type) {
        case shared_1.QLParamType.String:
        case shared_1.QLParamType.Number:
        case shared_1.QLParamType.Boolean:
            newValue = input;
            break;
        case shared_1.QLParamType.Date:
        case shared_1.QLParamType.DateInterval:
            if (datalensQLConnectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.MONITORING ||
                datalensQLConnectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.PROMQL) {
                newValue = (_a = (0, shared_1.getUtcDateTime)(input)) === null || _a === void 0 ? void 0 : _a.toISOString();
                if (!newValue) {
                    throw new Error('Invalid date passed');
                }
            }
            else {
                newValue = (_b = (0, shared_1.getUtcDateTime)(input)) === null || _b === void 0 ? void 0 : _b.format('YYYY-MM-DD');
            }
            if (!newValue) {
                newValue = 'Invalid date';
            }
            break;
        case shared_1.QLParamType.Datetime:
        case shared_1.QLParamType.DatetimeInterval:
            if (datalensQLConnectionType === shared_1.ConnectorType.Monitoring ||
                datalensQLConnectionType === shared_1.ConnectorType.Promql) {
                newValue = (_c = (0, shared_1.getUtcDateTime)(input)) === null || _c === void 0 ? void 0 : _c.toISOString();
                if (!newValue) {
                    throw new Error('Invalid date passed');
                }
            }
            else {
                newValue = (_d = (0, shared_1.getUtcDateTime)(input)) === null || _d === void 0 ? void 0 : _d.format('YYYY-MM-DDTHH:mm:ss');
            }
            if (!newValue) {
                newValue = 'Invalid date';
            }
            break;
        default:
            throw new Error('Unsupported parameter type passed');
    }
    return newValue;
}
function dumpReqParam(input, paramDescription, datalensQLConnectionType) {
    const type = paramDescription.type.toLowerCase();
    let dumped;
    if (Array.isArray(input)) {
        if (input.length === 1) {
            dumped = dumpReqParamValue(String(input[0]), type, datalensQLConnectionType);
        }
        else {
            dumped = input.map((inputEntry) => dumpReqParamValue(inputEntry, type, datalensQLConnectionType));
        }
    }
    else {
        dumped = dumpReqParamValue(String(input), type, datalensQLConnectionType);
    }
    let bi_type = type;
    if (bi_type === 'number') {
        bi_type = 'float';
    }
    return { type_name: bi_type, value: dumped };
}
function buildSource({ id, connectionType, query, params, paramsDescription, qlConnectionTypeMap }) {
    let sqlQuery = query;
    const datalensQLConnectionType = (0, connection_1.convertConnectionType)(qlConnectionTypeMap, connectionType);
    const QLRequestParams = {};
    if (datalensQLConnectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL ||
        datalensQLConnectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE) {
        // For PG/CH, we temporarily leave the old version, for greater compatibility.
        if (params) {
            // For correctness, the replacement should occur with a single call to `replace`,
            // in order not to replace the excess in case the inserted new value
            // contains any `{{key}}`
            sqlQuery = sqlQuery.replace(/(\s*)(=|in)?(\s*)\{\{([^}]+)\}\}/gi, (_, spaceBefore, operation, spaceAfter, key) => {
                const fixedKey = key.replace('_from', '').replace('_to', '');
                const paramDescription = paramsDescription.find((param) => param.name === key || param.name === fixedKey);
                let escapedValue;
                if (paramDescription) {
                    escapedValue = escape(params[key], datalensQLConnectionType, paramDescription, operation);
                }
                else {
                    escapedValue = key;
                }
                return `${operation
                    ? `${spaceBefore}${operation}${spaceAfter}`
                    : `${spaceBefore}${spaceAfter}`}${escapedValue}`;
            });
        }
    }
    else {
        // For the rest - we leave the text as it is, we pass the parameters to the back.
        Object.keys(params).forEach((key) => {
            const paramDescription = paramsDescription.find((param) => param.name === key);
            if ((paramDescription === null || paramDescription === void 0 ? void 0 : paramDescription.defaultValue) !== undefined) {
                if (paramDescription.type === shared_1.QLParamType.DateInterval ||
                    paramDescription.type === shared_1.QLParamType.DatetimeInterval) {
                    paramDescription.type =
                        paramDescription.type === shared_1.QLParamType.DateInterval
                            ? shared_1.QLParamType.Date
                            : shared_1.QLParamType.Datetime;
                    QLRequestParams[`${key}_from`] = dumpReqParam(params[`${key}_from`], {
                        ...paramDescription,
                        defaultValue: paramDescription.defaultValue
                            .from,
                    }, datalensQLConnectionType);
                    QLRequestParams[`${key}_to`] = dumpReqParam(params[`${key}_to`], {
                        ...paramDescription,
                        defaultValue: paramDescription.defaultValue
                            .to,
                    }, datalensQLConnectionType);
                }
                else {
                    QLRequestParams[key] = dumpReqParam(params[key], paramDescription, datalensQLConnectionType);
                }
            }
        });
    }
    const payload = {
        sql_query: sqlQuery,
        params: QLRequestParams,
    };
    const connectionsUrl = constants_1.CONNECTIONS_DASHSQL_WITH_EXPORT_INFO;
    return {
        url: connectionsUrl.replace(constants_1.CONNECTION_ID_PLACEHOLDER, id),
        method: 'post',
        data: payload,
    };
}
function getRows(data, field = 'sql') {
    let rows = [];
    const events = 'events' in data[field] ? data[field].events : data[field];
    rows = events
        .filter((entry) => entry.event === 'row')
        .map((entry) => entry.data);
    return rows;
}
function getColumns(args) {
    const { data, connectionType, field = 'sql', qlConnectionTypeMap } = args;
    const events = 'events' in data[field] ? data[field].events : data[field];
    const row = events.find((entry) => entry.event === 'metadata');
    const datalensQLConnectionType = (0, connection_1.convertConnectionType)(qlConnectionTypeMap, connectionType);
    if (row) {
        const metadataRow = row;
        return metadataRow.data.names.map((name, idx) => {
            const bi_type = metadataRow.data.bi_types[idx];
            const driver_type = datalensQLConnectionType === shared_1.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL
                ? (metadataRow.data.postgresql_typnames || [])[idx]
                : metadataRow.data.driver_types[idx];
            return {
                name: name,
                // typeName -- legacy type, incompatible with Field
                // we can remove it once wizard ql common visualization will be enabled
                typeName: (bi_type
                    ? (0, shared_1.biToDatalensQL)(bi_type)
                    : (0, shared_1.getDatalensQLTypeName)(driver_type, datalensQLConnectionType)) ||
                    shared_1.DATALENS_QL_TYPES.UNKNOWN,
                // biType -- new type, compatable with Field
                biType: bi_type,
            };
        });
    }
    else {
        return null;
    }
}
function getColumnsAndRows({ chartType, ChartEditor, queries, connectionType, data, qlConnectionTypeMap, }) {
    let columns = [];
    const columnsOrder = {};
    const columnsByQuery = {};
    let rows = [];
    if ((0, shared_1.isMonitoringOrPrometheusChart)(chartType)) {
        iterateThroughVisibleQueries(queries, (_query, i) => {
            let localColumns = [];
            try {
                const parsedColumns = getColumns({
                    data,
                    connectionType,
                    field: `ql_${i}`,
                    qlConnectionTypeMap,
                });
                if (parsedColumns === null) {
                    return;
                }
                localColumns = parsedColumns;
            }
            catch (error) {
                ChartEditor._setError({
                    code: 'ERR.CK.PROCESSING_ERROR',
                });
            }
            localColumns.push({
                biType: 'string',
                name: constants_2.QUERY_TITLE,
                typeName: 'string',
            });
            if (columns && columns.length > 0) {
                const uniqueLocalColumns = localColumns.filter((localColumn) => {
                    return (columns === null || columns === void 0 ? void 0 : columns.find((column) => column.name === localColumn.name)) === null;
                });
                columns = columns.concat(uniqueLocalColumns);
                columnsOrder[i] = uniqueLocalColumns.map((column) => {
                    return localColumns.findIndex((localColumn) => {
                        return localColumn.name === column.name;
                    });
                });
                columnsByQuery[i] = localColumns;
            }
            else {
                columns = localColumns;
                columnsOrder[i] = columns.map((_column, j) => j);
                columnsByQuery[i] = localColumns;
            }
        });
        iterateThroughVisibleQueries(queries, (query, i) => {
            let localRows;
            try {
                localRows = getRows(data, `ql_${i}`);
            }
            catch (error) {
                ChartEditor._setError({
                    code: 'ERR.CK.PROCESSING_ERROR',
                });
            }
            if (!localRows) {
                return;
            }
            localRows.forEach((row) => {
                row.push(query.queryName);
            });
            if (rows.length > 0) {
                localRows.forEach((localRow) => {
                    const newRow = [];
                    const localColumns = columnsByQuery[i];
                    columns === null || columns === void 0 ? void 0 : columns.forEach((column) => {
                        const targetColumnIndex = localColumns.findIndex((localColumn) => localColumn.name === column.name);
                        if (targetColumnIndex > -1) {
                            newRow.push(localRow[targetColumnIndex]);
                        }
                        else {
                            newRow.push('null');
                        }
                    });
                    rows.push(newRow);
                });
            }
            else {
                rows = localRows;
            }
        });
        if (rows.length === 0) {
            return {};
        }
    }
    else {
        try {
            columns = getColumns({
                data,
                connectionType: connectionType || shared_1.ConnectorType.Clickhouse,
                qlConnectionTypeMap,
            });
            if (columns !== null) {
                rows = getRows(data);
            }
        }
        catch (error) {
            ChartEditor._setError({
                code: 'ERR.CK.PROCESSING_ERROR',
            });
        }
        if (!columns || !rows || rows.length === 0) {
            return {};
        }
    }
    return { columns, rows };
}
function isGroup(item) {
    return Boolean(item.group);
}
function iterateThroughVisibleQueries(queries, cb) {
    queries.forEach((query, ...args) => {
        if (query.hidden) {
            return;
        }
        cb(query, ...args);
    });
}
const prepareQuery = (query) => {
    return query.trim().replace(/;+$/g, '');
};
exports.prepareQuery = prepareQuery;
const removeComments = (query) => {
    const result = query.replace(/("(""|[^"])*")|('(''|[^'])*')|(--[^\n\r]*)|(\/\*[\w\W]*?(?=\*\/)\*\/)/gm, (match) => {
        if ((match[0] === '"' && match[match.length - 1] === '"') ||
            (match[0] === "'" && match[match.length - 1] === "'"))
            return match;
        return '';
    });
    return result;
};
const removeQuotes = (query) => {
    // eslint-disable-next-line security/detect-unsafe-regex
    const result = query.replace(/(["'])(?:(?=(\\?))\2.)*?\1/gm, '');
    return result;
};
const doesQueryContainOrderBy = (query) => {
    const queryWithoutComments = removeComments(removeQuotes(query));
    return /order by/gim.test(queryWithoutComments);
};
exports.doesQueryContainOrderBy = doesQueryContainOrderBy;
const visualizationCanHaveContinuousAxis = (visualization) => {
    return (constants_2.LINEAR_VISUALIZATIONS.has(visualization.id) ||
        visualization.id === shared_1.WizardVisualizationId.BarXD3);
};
exports.visualizationCanHaveContinuousAxis = visualizationCanHaveContinuousAxis;
