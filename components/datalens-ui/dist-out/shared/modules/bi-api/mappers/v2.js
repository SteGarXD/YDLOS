"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParametersApiV2RequestSection = exports.getFiltersApiV2RequestSection = exports.getFieldsApiV2RequestSection = exports.mapParameterToApiV2ParametersFormat = exports.mapFilterToApiV2FiltersFormat = exports.mapFieldToApiV2FieldsFormat = void 0;
const types_1 = require("../../../types");
const charts_shared_1 = require("../../charts-shared");
const helpers_1 = require("../../helpers");
const mapFieldToApiV2FieldsFormat = (field, role) => {
    if (role === 'range') {
        return [
            {
                ref: {
                    type: 'id',
                    id: field.guid,
                },
                role_spec: {
                    role,
                    range_type: 'min',
                },
            },
            {
                ref: {
                    type: 'id',
                    id: field.guid,
                },
                role_spec: {
                    role,
                    range_type: 'max',
                },
            },
        ];
    }
    return [
        {
            ref: {
                type: 'id',
                id: field.guid,
            },
            role_spec: {
                role,
            },
        },
    ];
};
exports.mapFieldToApiV2FieldsFormat = mapFieldToApiV2FieldsFormat;
const mapFilterToApiV2FiltersFormat = (filter) => {
    const column = filter.guid;
    const value = filter.filter.value;
    const values = Array.isArray(value) ? value : [value];
    const operation = filter.filter.operation.code;
    // Check legacy datetime value because of old configs
    if ((0, types_1.isDateField)(filter)) {
        return {
            values: [].concat(...(0, helpers_1.prepareFilterValues)({ values })),
            operation,
            ref: { type: 'id', id: column },
        };
    }
    return {
        values,
        operation,
        ref: { type: 'id', id: column },
    };
};
exports.mapFilterToApiV2FiltersFormat = mapFilterToApiV2FiltersFormat;
const mapParameterToApiV2ParametersFormat = (parameter) => {
    let defaultValue = parameter.default_value;
    if (typeof defaultValue === 'string') {
        if (/^__relative/.test(defaultValue)) {
            defaultValue = (0, charts_shared_1.resolveRelativeDate)(defaultValue);
        }
        else if (/^__interval/.test(defaultValue)) {
            const parsedInterval = (0, charts_shared_1.resolveIntervalDate)(defaultValue);
            defaultValue = `__interval_${parsedInterval.from}_${parsedInterval.to}`;
        }
    }
    return {
        ref: {
            type: 'id',
            id: parameter.guid,
        },
        value: defaultValue,
    };
};
exports.mapParameterToApiV2ParametersFormat = mapParameterToApiV2ParametersFormat;
const getFieldsApiV2RequestSection = (fields, role) => {
    return fields.reduce((apiV2RequestFields, field) => [
        ...apiV2RequestFields,
        ...(0, exports.mapFieldToApiV2FieldsFormat)(field, role),
    ], []);
};
exports.getFieldsApiV2RequestSection = getFieldsApiV2RequestSection;
const getFiltersApiV2RequestSection = (filters) => {
    const filtersWithoutDashboardFilters = filters.filter((item) => !item.disabled);
    return filtersWithoutDashboardFilters.reduce((apiV2Filters, filter) => [...apiV2Filters, (0, exports.mapFilterToApiV2FiltersFormat)(filter)], []);
};
exports.getFiltersApiV2RequestSection = getFiltersApiV2RequestSection;
const getParametersApiV2RequestSection = ({ parameters, dashboardParameters = [], }) => {
    const dashboardParametersGuids = dashboardParameters.reduce((acc, parameter) => ({ ...acc, [parameter.guid]: true }), {});
    const filteredParameters = parameters.filter((parameter) => !dashboardParametersGuids[parameter.guid]);
    const requestParameters = [...filteredParameters, ...dashboardParameters];
    return requestParameters.reduce((apiV2Parametes, parameter) => {
        return [...apiV2Parametes, (0, exports.mapParameterToApiV2ParametersFormat)(parameter)];
    }, []);
};
exports.getParametersApiV2RequestSection = getParametersApiV2RequestSection;
