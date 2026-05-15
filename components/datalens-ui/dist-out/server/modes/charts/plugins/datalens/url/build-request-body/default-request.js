"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTotalRequestFields = exports.buildDefaultRequest = void 0;
const shared_1 = require("../../../../../../../shared");
const helpers_1 = require("../helpers");
const TREE_ROOT = '[]';
const getRequestFields = (payload) => {
    return payload.columns.map((fieldId) => ({
        ref: {
            type: 'id',
            id: fieldId,
        },
        block_id: 0,
    }));
};
const getTreeRequestFields = ({ columns, fields, params }) => {
    const requestFields = [];
    columns.forEach((fieldId) => {
        const field = fields.find((field) => field.guid === fieldId);
        if (field && (0, shared_1.isTreeField)(field)) {
            const treeState = (0, helpers_1.getTreeState)(params);
            const initialLegendItemId = 1;
            let legendItemId = initialLegendItemId + 1;
            const legendDict = {
                [TREE_ROOT]: initialLegendItemId,
            };
            requestFields.push({
                ref: {
                    type: 'id',
                    id: fieldId,
                },
                legend_item_id: initialLegendItemId,
                role_spec: {
                    prefix: '[]',
                    dimension_values: [],
                    role: 'tree',
                    level: 1,
                },
                block_id: 0,
            });
            treeState.forEach((prefix, index2) => {
                legendItemId++;
                const parsedPrefix = JSON.parse(prefix);
                const currentLegendKey = JSON.stringify(parsedPrefix);
                const prevLegendKey = JSON.stringify(parsedPrefix.slice(0, -1));
                legendDict[currentLegendKey] = legendItemId;
                const prevLefend = legendDict[prevLegendKey];
                requestFields.push({
                    ref: {
                        type: 'id',
                        id: fieldId,
                    },
                    legend_item_id: legendItemId,
                    role_spec: {
                        prefix: prefix,
                        dimension_values: !parsedPrefix.length
                            ? []
                            : [{ legend_item_id: prevLefend, value: prefix }],
                        role: 'tree',
                        level: parsedPrefix.length + 1,
                    },
                    block_id: 1 + index2,
                });
            });
            return;
        }
        requestFields.push({
            ref: {
                type: 'id',
                id: fieldId,
            },
        });
    });
    return requestFields;
};
const buildDefaultRequest = ({ payload, fields, apiVersion, params, datasetId, revisionId, allMeasuresMap, }) => {
    const columns = payload.columns;
    const where = payload.where || [];
    const parameters = payload.parameters || [];
    const isTreeRequest = apiVersion === '2' &&
        columns.some((fieldId) => {
            const field = fields.find((field) => field.guid === fieldId);
            return field && (0, shared_1.isTreeField)(field);
        });
    let requestFields;
    if (isTreeRequest) {
        requestFields = getTreeRequestFields({
            columns,
            fields,
            params,
        });
    }
    else {
        requestFields = getRequestFields({
            columns,
        });
    }
    if (apiVersion === '2' && payload.with_totals && fields) {
        requestFields.push(...(0, exports.buildTotalRequestFields)({ fields, columns: payload.columns, datasetId }));
    }
    const filters = where.map((filter) => ({
        ref: { type: 'id', id: filter.column || '' },
        operation: filter.operation,
        values: filter.values,
    }));
    const order_by = (payload.order_by || []).map(({ direction, column }) => ({
        ref: { type: 'id', id: column },
        direction: direction.toLowerCase(),
        block_id: isTreeRequest ? undefined : 0,
    }));
    const parameter_values = parameters.map(helpers_1.mapParameterToRequestFormat);
    requestFields = requestFields.map((field) => {
        var _a;
        if (!((_a = field.role_spec) === null || _a === void 0 ? void 0 : _a.role) &&
            (('id' in field.ref && allMeasuresMap[field.ref.id]) ||
                ('title' in field.ref && allMeasuresMap[field.ref.title]))) {
            return {
                ...field,
                role_spec: { role: 'measure' },
            };
        }
        return field;
    });
    return {
        fields: requestFields,
        filters,
        order_by,
        parameter_values,
        dataset_revision_id: revisionId,
        updates: payload.updates,
        ignore_nonexistent_filters: payload.ignore_nonexistent_filters,
        limit: payload.limit,
        offset: payload.offset,
        disable_group_by: payload.disable_group_by,
        with_totals: payload.with_totals,
        autofill_legend: true,
    };
};
exports.buildDefaultRequest = buildDefaultRequest;
const buildTotalRequestFields = ({ fields, columns = [], datasetId, }) => {
    const totalsColumns = [];
    fields
        .filter((field) => datasetId === field.datasetId)
        .forEach((field) => {
        if ((0, shared_1.isDimensionField)(field)) {
            totalsColumns.push({
                ref: {
                    type: 'placeholder',
                },
                role_spec: {
                    role: 'template',
                    template: '',
                },
                block_id: 1,
            });
            return;
        }
        totalsColumns.push({
            ref: {
                type: 'id',
                id: field.guid,
            },
            role_spec: {
                role: 'total',
            },
            block_id: 1,
        });
    });
    const guidsDict = fields.reduce((acc, item) => {
        acc[item.guid] = true;
        return acc;
    }, {});
    columns
        .filter((column) => {
        return !guidsDict[column];
    })
        .forEach(() => {
        totalsColumns.push({
            ref: {
                type: 'placeholder',
            },
            role_spec: {
                role: 'template',
                template: '',
            },
            block_id: 1,
        });
    });
    return totalsColumns;
};
exports.buildTotalRequestFields = buildTotalRequestFields;
