"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistinctsRequestBody = void 0;
const shared_1 = require("../../../../../../../shared");
function buildDistinctsBodyRequest({ where, fieldGuid, parameters, datasetFieldsMap, }) {
    var _a;
    const finalFieldGuid = ((_a = datasetFieldsMap[fieldGuid]) === null || _a === void 0 ? void 0 : _a.guid) || fieldGuid;
    const filters = (where || [])
        .filter((el) => { var _a; return ((_a = datasetFieldsMap[el.column]) === null || _a === void 0 ? void 0 : _a.fieldType) !== shared_1.DatasetFieldType.Measure; })
        .map((el) => {
        var _a;
        return {
            ref: { type: 'id', id: ((_a = datasetFieldsMap[el.column]) === null || _a === void 0 ? void 0 : _a.guid) || el.column || '' },
            operation: el.operation,
            values: el.values,
        };
    })
        .filter((filter) => {
        return filter.ref.type === 'id' && filter.ref.id !== finalFieldGuid;
    });
    const parameter_values = Object.keys(parameters)
        .map((key) => {
        var _a;
        const guid = ((_a = datasetFieldsMap[key]) === null || _a === void 0 ? void 0 : _a.guid) || key;
        let parameterValue = Array.isArray(parameters[key]) ? parameters[key][0] : parameters[key];
        // YDL OS: MSSQL TVF parameters must receive a single scalar date, not __interval_FROM_TO.
        if (typeof parameterValue === 'string' && parameterValue.startsWith('__interval_')) {
            const m = parameterValue.match(/^__interval_(.+?)_(.+)$/);
            if (m) {
                parameterValue = m[1].replace('T', ' ').split('.')[0].trim();
            }
        }
        return {
            ref: { type: 'id', id: guid },
            value: parameterValue,
        };
    })
        .filter((item) => item.value !== '');
    return {
        ignore_nonexistent_filters: true,
        fields: [
            {
                ref: {
                    type: 'id',
                    id: finalFieldGuid,
                },
                role_spec: {
                    role: 'distinct',
                },
            },
        ],
        filters,
        parameter_values,
    };
}
const getDistinctsRequestBody = ({ shared, params, datasetFields, ctx, }) => {
    var _a, _b, _c, _d, _e;
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_START_PREPARING_DISTINCTS_BODY');
    const targetParam = shared.param;
    const where = [];
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_START_MAPPING_DATASET_FIELDS');
    const datasetFieldsMap = datasetFields.reduce((acc, field) => {
        const fieldData = {
            fieldType: field.type,
            guid: field.guid,
        };
        acc[field.guid] = fieldData;
        acc[field.title] = fieldData;
        return acc;
    }, {});
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_END_MAPPING_DATASET_FIELDS');
    (_a = ctx === null || ctx === void 0 ? void 0 : ctx.log) === null || _a === void 0 ? void 0 : _a.call(ctx, 'CONTROLS_START_TRANSFORMING_PARAMS');
    const urlSearchParams = (0, shared_1.transformParamsToUrlParams)(params);
    (_b = ctx === null || ctx === void 0 ? void 0 : ctx.log) === null || _b === void 0 ? void 0 : _b.call(ctx, 'CONTROLS_END_TRANSFORMING_PARAMS');
    (_c = ctx === null || ctx === void 0 ? void 0 : ctx.log) === null || _c === void 0 ? void 0 : _c.call(ctx, 'CONTROLS_START_SPLIT_PARAMS');
    const { filtersParams, parametersParams } = (0, shared_1.splitParamsToParametersAndFilters)(urlSearchParams, datasetFields);
    (_d = ctx === null || ctx === void 0 ? void 0 : ctx.log) === null || _d === void 0 ? void 0 : _d.call(ctx, 'CONTROLS_START_TRANSFORMING_PARAMS');
    const transformedFilterParams = (0, shared_1.transformUrlParamsToParams)(filtersParams);
    const transformedParametersParams = (0, shared_1.transformUrlParamsToParams)(parametersParams);
    (_e = ctx === null || ctx === void 0 ? void 0 : ctx.log) === null || _e === void 0 ? void 0 : _e.call(ctx, 'CONTROLS_END_TRANSFORMING_PARAMS');
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_START_PROCESSING_FILTERS');
    Object.keys(transformedFilterParams).forEach((param) => {
        var _a;
        if (param === targetParam) {
            return;
        }
        let values = [];
        let operation;
        const paramValue = params[param];
        if (Array.isArray(paramValue)) {
            const valuesWithOperations = paramValue
                .filter((value) => value)
                .map((value) => (0, shared_1.resolveOperation)(value));
            values = valuesWithOperations.map((item) => item.value);
            operation = (_a = valuesWithOperations.find((item) => item && item.operation)) === null || _a === void 0 ? void 0 : _a.operation;
            if (values.length === 1 && String(values[0]).startsWith('__relative')) {
                const resolvedRelative = (0, shared_1.resolveRelativeDate)(values[0]);
                if (resolvedRelative) {
                    values[0] = resolvedRelative;
                }
            }
            if (values.length === 1 && String(values[0]).startsWith('__interval')) {
                const resolvedInterval = (0, shared_1.resolveIntervalDate)(values[0]);
                if (resolvedInterval) {
                    const { from, to } = resolvedInterval;
                    values = [from, to];
                    operation = shared_1.Operations.BETWEEN;
                }
            }
        }
        operation = operation || shared_1.Operations.IN;
        if (values.length) {
            where.push({
                column: param,
                operation,
                values,
            });
        }
    });
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_END_PROCESSING_FILTERS');
    const apiV2RequestBody = buildDistinctsBodyRequest({
        where,
        fieldGuid: targetParam,
        parameters: transformedParametersParams,
        datasetFieldsMap,
    });
    ctx === null || ctx === void 0 ? void 0 : ctx.log('CONTROLS_END_PREPARING_DISTINCTS_BODY');
    return apiV2RequestBody;
};
exports.getDistinctsRequestBody = getDistinctsRequestBody;
