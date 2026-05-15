"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSources = buildSources;
const shared_1 = require("../../../../../../../shared");
const ql_1 = require("../../../../../../../shared/modules/config/ql");
const color_palettes_1 = require("../../../helpers/color-palettes");
const misc_helpers_1 = require("../../utils/misc-helpers");
const resolveUrlParameter = (urlParamValue) => {
    if (Array.isArray(urlParamValue)) {
        return urlParamValue.map((value) => {
            const resolvedValueAndOperation = (0, shared_1.resolveOperation)(value);
            return (resolvedValueAndOperation === null || resolvedValueAndOperation === void 0 ? void 0 : resolvedValueAndOperation.value) || '';
        });
    }
    else {
        const resolvedValueAndOperation = (0, shared_1.resolveOperation)(urlParamValue);
        return (resolvedValueAndOperation === null || resolvedValueAndOperation === void 0 ? void 0 : resolvedValueAndOperation.value) || '';
    }
};
const prepareDefaultDate = (date) => {
    const resolvedDate = (0, shared_1.resolveRelativeDate)(date);
    return resolvedDate || date;
};
function buildSources(args) {
    const { shared, ChartEditor, palettes, qlConnectionTypeMap, features } = args;
    const config = (0, ql_1.mapQlConfigToLatestVersion)(shared, { i18n: ChartEditor.getTranslation });
    const urlParams = ChartEditor.getParams();
    let params = {};
    // Measure the values of the parameters:
    // 1) default
    // 2) override - which in ui ql overwritten the default ones (this is for ui)
    // 3) from the url (this is for dashboards)
    if (config.params) {
        const chartParams = config.params.reduce(
        // eslint-disable-next-line complexity
        (accumulated, param) => {
            var _a, _b, _c, _d;
            const paramIsInterval = param.type === shared_1.QLParamType.DateInterval ||
                param.type === shared_1.QLParamType.DatetimeInterval;
            // If the parameter is interval
            if (paramIsInterval && !Array.isArray(param.defaultValue)) {
                const fromKey = `${param.name}_from`;
                const toKey = `${param.name}_to`;
                // If there is in the url
                if (urlParams[param.name] && urlParams[param.name][0] !== '') {
                    // We take from the url
                    const resolvedValueAndOperation = (0, shared_1.resolveOperation)(urlParams[param.name][0]);
                    if (resolvedValueAndOperation) {
                        const resolvedInterval = (0, shared_1.resolveIntervalDate)(resolvedValueAndOperation.value);
                        if (resolvedInterval !== null) {
                            accumulated[fromKey] = resolvedInterval.from;
                            accumulated[toKey] = resolvedInterval.to;
                        }
                    }
                }
                else if (typeof param.overridenValue === 'object' &&
                    param.overridenValue !== null &&
                    !Array.isArray(param.overridenValue) &&
                    typeof param.overridenValue.from !== 'undefined' &&
                    typeof param.overridenValue.to !== 'undefined') {
                    // Otherwise, we take override (if there is)
                    accumulated[fromKey] = param.overridenValue.from;
                    accumulated[toKey] = param.overridenValue.to;
                }
                else if (typeof param.defaultValue === 'object') {
                    // And if there is no override, then we take default
                    if (typeof ((_a = param.defaultValue) === null || _a === void 0 ? void 0 : _a.from) !== 'undefined') {
                        accumulated[fromKey] = prepareDefaultDate((_b = param.defaultValue) === null || _b === void 0 ? void 0 : _b.from);
                    }
                    if (typeof ((_c = param.defaultValue) === null || _c === void 0 ? void 0 : _c.to) !== 'undefined') {
                        accumulated[toKey] = prepareDefaultDate((_d = param.defaultValue) === null || _d === void 0 ? void 0 : _d.to);
                    }
                }
            }
            else if (typeof param.defaultValue === 'string') {
                // The parameter is the usual value
                // If there is in the url, we take from the url
                if (urlParams[param.name] && urlParams[param.name][0] !== '') {
                    accumulated[param.name] = resolveUrlParameter(urlParams[param.name]);
                }
                else if ((typeof param.overridenValue === 'string' && param.overridenValue !== '') ||
                    Array.isArray(param.overridenValue)) {
                    // Otherwise, we take override (if there is)
                    accumulated[param.name] = param.overridenValue;
                }
                else if (param.type === shared_1.QLParamType.Date ||
                    param.type === shared_1.QLParamType.Datetime) {
                    accumulated[param.name] = prepareDefaultDate(param.defaultValue);
                }
                else {
                    accumulated[param.name] = param.defaultValue;
                }
            }
            else if (Array.isArray(param.defaultValue)) {
                // Parameter - array
                // If there is in the url, we take from the url
                if (urlParams[param.name] && urlParams[param.name][0] !== '') {
                    accumulated[param.name] = resolveUrlParameter(urlParams[param.name]);
                }
                else if ((typeof param.overridenValue === 'string' && param.overridenValue !== '') ||
                    Array.isArray(param.overridenValue)) {
                    // Otherwise, we take override (if there is)
                    accumulated[param.name] = param.overridenValue;
                }
                else {
                    // Otherwise we take default
                    accumulated[param.name] = param.defaultValue;
                }
            }
            return accumulated;
        }, {});
        params = { ...urlParams, ...chartParams };
    }
    const { connection: { entryId: connectionEntryId, type: connectionType }, } = config;
    let sources = {};
    try {
        if ((0, shared_1.isMonitoringOrPrometheusChart)(config.chartType)) {
            if (params.interval) {
                const operation = ChartEditor.resolveOperation(params.interval[0]);
                if (operation) {
                    const intervalValues = ChartEditor.resolveInterval(operation.value);
                    if (intervalValues && intervalValues.from && intervalValues.to) {
                        params.from = intervalValues === null || intervalValues === void 0 ? void 0 : intervalValues.from;
                        params.to = intervalValues === null || intervalValues === void 0 ? void 0 : intervalValues.to;
                    }
                }
            }
            (0, misc_helpers_1.iterateThroughVisibleQueries)(config.queries, ({ value: queryValue, params: queryParams = [] }, i) => {
                const localParams = { ...params };
                queryParams.forEach((queryParam) => {
                    if (typeof queryParam.defaultValue === 'string') {
                        localParams[queryParam.name] = queryParam.defaultValue;
                    }
                });
                const localParamsDescription = [...config.params, ...queryParams];
                const source = (0, misc_helpers_1.buildSource)({
                    // specify the desired connection id
                    id: connectionEntryId,
                    connectionType: connectionType || shared_1.ConnectorType.Clickhouse,
                    // requesting a query
                    query: (0, misc_helpers_1.prepareQuery)(queryValue),
                    params: localParams,
                    paramsDescription: localParamsDescription,
                    qlConnectionTypeMap,
                    features,
                });
                sources[`ql_${i}`] = source;
            });
        }
        else {
            sources = {
                sql: (0, misc_helpers_1.buildSource)({
                    // specify the desired connection id
                    id: connectionEntryId,
                    connectionType: connectionType || shared_1.ConnectorType.Clickhouse,
                    // requesting a query
                    query: (0, misc_helpers_1.prepareQuery)(config.queryValue),
                    params,
                    paramsDescription: config.params,
                    qlConnectionTypeMap,
                    features,
                }),
            };
        }
        Object.assign(sources, (0, color_palettes_1.getColorPalettesRequests)({ config: config, palettes }));
    }
    catch (error) {
        ChartEditor._setError({
            code: 'ERR.CK.PROCESSING_ERROR',
        });
    }
    (0, misc_helpers_1.log)('SOURCES:', sources);
    return {
        ...sources,
    };
}
