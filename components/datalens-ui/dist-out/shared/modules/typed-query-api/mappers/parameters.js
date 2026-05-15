"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapParametersRecordToTypedQueryApiParameters = exports.mapStringParameterToTypedQueryApiParameter = void 0;
const mapStringParameterToTypedQueryApiParameter = (key, value) => {
    return {
        name: key,
        data_type: 'string',
        value: Array.isArray(value) ? value[0] : value,
    };
};
exports.mapStringParameterToTypedQueryApiParameter = mapStringParameterToTypedQueryApiParameter;
const mapParametersRecordToTypedQueryApiParameters = (parameters) => {
    return Object.entries(parameters)
        .filter(([_key, value]) => value.length)
        .map((pair) => {
        const key = pair[0];
        const value = pair[1];
        return (0, exports.mapStringParameterToTypedQueryApiParameter)(key, value);
    });
};
exports.mapParametersRecordToTypedQueryApiParameters = mapParametersRecordToTypedQueryApiParameters;
