"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPivotRequest = void 0;
const shared_1 = require("../../../../../../../../shared");
const helpers_1 = require("../../helpers");
const helpers_2 = require("./helpers");
const totals_1 = require("./helpers/totals");
const buildPivotRequest = (args) => {
    var _a, _b, _c;
    const { placeholders, colors, payload, revisionId, backgroundColorsFieldsIds, params } = args;
    const columns = ((_a = placeholders.find((placeholder) => placeholder.id === 'pivot-table-columns')) === null || _a === void 0 ? void 0 : _a.items) || [];
    const rows = ((_b = placeholders.find((placeholder) => placeholder.id === 'rows')) === null || _b === void 0 ? void 0 : _b.items) || [];
    const measures = ((_c = placeholders.find((placeholder) => placeholder.id === 'measures')) === null || _c === void 0 ? void 0 : _c.items) || [];
    const orderBy = payload.order_by || [];
    const legendItemCounter = {
        legendItemIdIndex: 0,
    };
    let fields = [];
    const orderByMap = orderBy.reduce((acc, orderByPayload) => {
        return {
            ...acc,
            [orderByPayload.column]: orderByPayload.direction.toLowerCase(),
        };
    }, {});
    const { columnsReq, rowsReq, measuresReq } = (0, helpers_2.getRegularFields)({
        columns,
        rows,
        measures,
        legendItemCounter,
        orderByMap,
    });
    const { usedFieldsMap, usedLegendItemIds } = [...measuresReq, ...columnsReq, ...rowsReq].reduce((acc, reqField) => {
        var _a, _b;
        if (typeof reqField.legend_item_id === 'undefined') {
            return acc;
        }
        switch (reqField.ref.type) {
            case 'measure_name':
                acc.usedFieldsMap[shared_1.PseudoFieldTitle.MeasureNames] = {
                    legendItemId: reqField.legend_item_id,
                    role: ((_a = reqField.role_spec) === null || _a === void 0 ? void 0 : _a.role) || '',
                };
                break;
            case 'id':
                acc.usedFieldsMap[reqField.ref.id] = {
                    legendItemId: reqField.legend_item_id,
                    role: ((_b = reqField.role_spec) === null || _b === void 0 ? void 0 : _b.role) || '',
                };
                break;
        }
        acc.usedLegendItemIds[reqField.legend_item_id] = true;
        return acc;
    }, {
        usedFieldsMap: {},
        usedLegendItemIds: {},
    });
    const annotations = (0, helpers_2.getAnnotations)({
        colors,
        orderByMap,
        legendItemCounter,
        backgroundColors: backgroundColorsFieldsIds,
        usedFieldsMap,
    });
    const annotationsForRequest = annotations.filter((annotation) => {
        const isFieldMissedInRequest = annotation.ref.type === 'id' && !usedFieldsMap[annotation.ref.id];
        const isLegendItemIdMissedInRequest = typeof annotation.legend_item_id !== 'undefined' &&
            !usedLegendItemIds[annotation.legend_item_id];
        return isFieldMissedInRequest && isLegendItemIdMissedInRequest;
    });
    fields = fields.concat(columnsReq, rowsReq, measuresReq, annotationsForRequest);
    const pivot_pagination = {
        offset_rows: payload.offset,
        limit_rows: payload.limit,
    };
    const { settings } = (0, totals_1.getTotalsForPivot)({
        columnsFields: columns,
        rowsFields: rows,
    });
    const pivot = {
        structure: (0, helpers_2.getPivotStructure)({
            columnsReq,
            rowsReq,
            measuresReq,
            annotations,
            params,
        }),
        pagination: pivot_pagination,
        ...settings,
    };
    const filters = (payload.where || []).map((el) => {
        return {
            ref: { type: 'id', id: el.column || '' },
            operation: el.operation,
            values: el.values,
        };
    });
    const order_by = orderBy.map((el) => {
        return {
            ref: { type: 'id', id: el.column },
            direction: el.direction.toLowerCase(),
        };
    });
    const parameter_values = (payload.parameters || []).map(helpers_1.mapParameterToRequestFormat);
    fields.forEach((field) => {
        var _a, _b;
        if (((_a = field.role_spec) === null || _a === void 0 ? void 0 : _a.role) !== 'total' && ((_b = field.role_spec) === null || _b === void 0 ? void 0 : _b.role) !== 'template') {
            delete field.role_spec;
        }
    });
    return {
        fields,
        pivot,
        filters,
        order_by,
        parameter_values,
        pivot_pagination,
        dataset_revision_id: revisionId,
        updates: payload.updates,
        ignore_nonexistent_filters: payload.ignore_nonexistent_filters,
        disable_group_by: payload.disable_group_by,
        autofill_legend: true,
    };
};
exports.buildPivotRequest = buildPivotRequest;
