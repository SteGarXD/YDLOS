"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareParameters = exports.prepareParamsParameters = exports.mapParameterToRequestFormat = exports.getParametersMap = exports.prepareParameterForPayload = exports.mapItemToPayloadParameter = void 0;
const misc_1 = require("./misc");
/** YDL OS: для MSSQL/TVF — значение __interval_from_to подменяем на одну дату начала (YYYY-MM-DD HH:mm:ss), чтобы не было ошибки "Conversion failed when converting date and/or time from character string". */
function normalizeIntervalValueForMssql(value) {
    const intervalRe = /^__interval_(.+?)_(.+)$/;
    const m = value.trim().match(intervalRe);
    if (!m)
        return value;
    const startPart = m[1].replace('T', ' ').trim();
    const dateMatch = startPart.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
    if (dateMatch) {
        const [, y, mo, d, h = '00', min = '00', s = '00'] = dateMatch;
        return `${y}-${mo}-${d} ${h}:${min}:${s}`;
    }
    return value;
}
const mapItemToPayloadParameter = (field) => {
    var _a;
    return {
        id: field.guid,
        value: (_a = field.default_value) !== null && _a !== void 0 ? _a : '',
    };
};
exports.mapItemToPayloadParameter = mapItemToPayloadParameter;
const prepareParameterForPayload = (fields, datasetId) => {
    return fields
        .filter((field) => field.datasetId === datasetId)
        .map(exports.mapItemToPayloadParameter);
};
exports.prepareParameterForPayload = prepareParameterForPayload;
const getParametersMap = (parameters) => {
    return parameters.reduce((acc, curr) => {
        return { ...acc, [curr.id]: true };
    }, {});
};
exports.getParametersMap = getParametersMap;
const mapParameterToRequestFormat = (parameter) => {
    return {
        ref: {
            type: 'id',
            id: parameter.id,
        },
        value: parameter.value,
    };
};
exports.mapParameterToRequestFormat = mapParameterToRequestFormat;
const prepareParamsParameters = ({ params, resultSchema }) => {
    if (!params) {
        return [];
    }
    const filteredParamsKeys = Object.keys(params).filter((key) => {
        const param = params[key];
        const isRawParameterValid = (0, misc_1.isRawParamValid)(param);
        if (!isRawParameterValid) {
            return false;
        }
        return (0, misc_1.isParamValid)(param);
    });
    const preparedParamsParameters = filteredParamsKeys.map((paramKey) => {
        let param = String(params[paramKey]);
        param = normalizeIntervalValueForMssql(param);
        const datasetField = resultSchema.find((item) => item.guid === paramKey || item.title === paramKey);
        const guid = paramKey.length !== 36 && datasetField ? datasetField.guid : paramKey;
        return (0, exports.mapItemToPayloadParameter)({ guid, default_value: param });
    });
    return preparedParamsParameters.filter((p) => Boolean(p));
};
exports.prepareParamsParameters = prepareParamsParameters;
const prepareParameters = (parameters, params, resultSchema) => {
    const paramsParameters = (0, exports.prepareParamsParameters)({ params, resultSchema });
    const paramsParametersMap = (0, exports.getParametersMap)(paramsParameters);
    const filteredWizardParameters = parameters.filter((parameter) => !paramsParametersMap[parameter.id]);
    return [...filteredWizardParameters, ...paramsParameters];
};
exports.prepareParameters = prepareParameters;
