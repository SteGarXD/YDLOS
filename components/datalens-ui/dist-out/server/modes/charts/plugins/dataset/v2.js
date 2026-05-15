"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const OPERATIONS = {
    ISNULL: 'ISNULL',
    ISNOTNULL: 'ISNOTNULL',
    GT: 'GT',
    LT: 'LT',
    GTE: 'GTE',
    LTE: 'LTE',
    EQ: 'EQ',
    NE: 'NE',
    STARTSWITH: 'STARTSWITH',
    ISTARTSWITH: 'ISTARTSWITH',
    ENDSWITH: 'ENDSWITH',
    IENDSWITH: 'IENDSWITH',
    CONTAINS: 'CONTAINS',
    ICONTAINS: 'ICONTAINS',
    NOTCONTAINS: 'NOTCONTAINS',
    NOTICONTAINS: 'NOTICONTAINS',
    IN: 'IN',
    NIN: 'NIN',
    BETWEEN: 'BETWEEN',
};
const ORDERS = {
    DESC: 'DESC',
    ASC: 'ASC',
};
function getTimezoneOffsettedTime(value) {
    return value.getTime() - value.getTimezoneOffset() * 60 * 1000;
}
function convertSimpleType(data, dataType, options) {
    if (data === null) {
        return null;
    }
    switch (dataType) {
        case 'integer':
        case 'uinteger':
        case 'float':
            return Number(data);
        case 'date':
        case 'datetime':
        case 'genericdatetime':
        case 'datetimetz': {
            if (options.disableProcessDates) {
                return data;
            }
            const date = new Date(data);
            if (!options.utc) {
                date.setTime(getTimezoneOffsettedTime(date));
            }
            return date;
        }
        case 'string':
        default:
            return data;
    }
}
function getTypedData(data, dataType, options) {
    return convertSimpleType(data, dataType, options);
}
function getResultRows(data, fields, options) {
    const fieldsDict = fields.reduce((acc, field) => {
        acc[field.legend_item_id] = field;
        return acc;
    }, {});
    const rows = data[0];
    return rows.rows.map((item) => {
        const rowHash = {};
        const rowData = item.data;
        const rowLegend = item.legend;
        rowData.forEach((rowDataItem, rowDataItemIndex) => {
            const rowField = fieldsDict[rowLegend[rowDataItemIndex]];
            const columnId = rowField.title;
            const columnType = rowField.data_type;
            rowHash[columnId] = getTypedData(rowDataItem, columnType, options);
        });
        return rowHash;
    });
}
function processTableData(resultData, fields, options = {}) {
    return getResultRows(resultData, fields, options);
}
const mapColumnsToRequestFields = (columns) => {
    return columns.map((fieldId) => ({
        ref: {
            type: 'title',
            title: fieldId,
        },
        block_id: 0,
    }));
};
function buildSource(payload) {
    var _a, _b, _c;
    const fields = mapColumnsToRequestFields(payload.columns);
    const filters = (_a = payload.where) === null || _a === void 0 ? void 0 : _a.map((filter) => {
        const type = filter.type || 'title';
        const value = filter.column || '';
        const ref = type === 'title'
            ? {
                type: 'title',
                title: value,
            }
            : {
                type: 'id',
                id: value,
            };
        return {
            ref,
            operation: filter.operation,
            values: filter.values,
        };
    });
    const order_by = (_b = payload.order_by) === null || _b === void 0 ? void 0 : _b.map(({ direction, column }) => ({
        ref: { type: 'title', title: column },
        direction: direction.toLowerCase(),
    }));
    const parameter_values = (_c = payload.parameters) === null || _c === void 0 ? void 0 : _c.map((parameter) => {
        return {
            ref: {
                type: 'id',
                id: parameter.id,
            },
            value: parameter.value,
        };
    });
    let disable_group_by;
    if (payload.disable_group_by && typeof payload.disable_group_by !== 'undefined') {
        disable_group_by = true;
    }
    const requestData = {
        fields,
        filters,
        order_by,
        updates: payload.updates,
        parameter_values,
        limit: payload.limit,
        offset: payload.offset,
        disable_group_by,
        autofill_legend: true,
    };
    Object.keys(requestData).forEach((key) => {
        if (typeof requestData[key] === 'undefined') {
            delete requestData[key];
        }
    });
    return {
        datasetId: String(payload.id || payload.datasetId),
        path: 'result',
        data: requestData,
        ui: payload.ui,
        cache: payload.cache,
    };
}
function processData(data, field = 'dataset', ChartEditor, options = {}) {
    var _a;
    const dataResult = data[field];
    if (ChartEditor) {
        // we put the information for the inspector in ChartKit
        const query = dataResult.blocks.map((block) => block.query).join('\n');
        ChartEditor.setDataSourceInfo(field, { query });
        if (dataResult.data_export_forbidden) {
            (_a = ChartEditor.setExtra) === null || _a === void 0 ? void 0 : _a.call(ChartEditor, 'dataExportForbidden', true);
        }
    }
    return processTableData(dataResult.result_data, dataResult.fields, options);
}
function getDatasetRows(params) {
    if (!(0, lodash_1.isObject)(params)) {
        throw new Error('Params should be an object');
    }
    const { datasetName } = params;
    if (!datasetName) {
        throw new Error('datasetName is not defined in params');
    }
    const EditorAPI = globalThis.Editor;
    if (!EditorAPI) {
        throw new Error('EditorAPI is not defined');
    }
    const data = EditorAPI.getLoadedData();
    if (!data[datasetName]) {
        throw new Error(`Dataset "${datasetName}" is not defined`);
    }
    return processData(data, datasetName, EditorAPI, { disableProcessDates: true });
}
exports.default = {
    buildSource,
    processTableData,
    processData,
    getDatasetRows,
    OPERATIONS,
    ORDERS,
};
