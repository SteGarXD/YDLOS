"use strict";
/* eslint-disable camelcase */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrlsRequestBody = void 0;
exports.getJoinedParamsFilters = getJoinedParamsFilters;
exports.getSeparateParamsValues = getSeparateParamsValues;
exports.prepareSingleRequest = prepareSingleRequest;
const date_utils_1 = require("@gravity-ui/date-utils");
const shared_1 = require("../../../../../../../shared");
const config_helpers_1 = require("../../utils/config-helpers");
const constants_1 = require("../../utils/constants");
const hierarchy_helpers_1 = require("../../utils/hierarchy-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const helpers_1 = require("../helpers");
const filters_1 = require("../helpers/filters");
const table_settings_1 = require("../helpers/table-settings");
const constants_2 = require("./constants");
const default_request_1 = require("./default-request");
const pivot_request_1 = require("./pivot-request");
function formatParamsFilters({ datasetSchema, links, params, datasetId, }) {
    if (!params) {
        return [];
    }
    const resultSchema = datasetSchema;
    const paramsFilters = [];
    Object.keys(params)
        .filter((param) => !constants_2.RESERVED_PARAM_KEYS.has(param))
        .filter((param) => {
        const paramValue = params[param];
        return (0, helpers_1.isRawParamValid)(paramValue);
    })
        .forEach((param) => {
        const paramValue = params[param];
        if (!(0, helpers_1.isParamValid)(paramValue)) {
            return;
        }
        // We take into account the possibility to accept an array of values and a single value
        const values = Array.isArray(paramValue) ? paramValue : [paramValue];
        const foundField = resultSchema.find((item) => item.guid === param || item.title === param);
        const valuesWithOperations = (0, shared_1.prepareFilterValuesWithOperations)({
            values,
            field: foundField,
        });
        let guid = param;
        // Crutch: if it's not Guid who came, but the title of the field
        if (guid.length !== 36 && (foundField === null || foundField === void 0 ? void 0 : foundField.guid)) {
            guid = foundField.guid;
        }
        if (links.length &&
            !resultSchema.some((field) => {
                return field.guid === guid;
            })) {
            const targetLink = links.find((link) => {
                const datasetsIdsInLink = Object.keys(link.fields);
                if (datasetsIdsInLink.indexOf(datasetId) === -1) {
                    return false;
                }
                return datasetsIdsInLink.some((someDatasetId) => {
                    return link.fields[someDatasetId].field.guid === param;
                });
            });
            if (targetLink) {
                guid = targetLink.fields[datasetId].field.guid;
            }
        }
        const existingFilterIndex = paramsFilters.findIndex((existingFilter) => {
            if (existingFilter.column === guid) {
                const operation = existingFilter.operation;
                if (operation === shared_1.Operations.IN || operation === shared_1.Operations.NIN) {
                    existingFilter.values.forEach((filterValue) => {
                        valuesWithOperations.values.push(filterValue);
                        valuesWithOperations.operations.push(existingFilter.operation);
                    });
                }
                return true;
            }
            return false;
        });
        if (existingFilterIndex > -1) {
            paramsFilters.splice(existingFilterIndex, 1);
        }
        // Returning the payload for the API
        paramsFilters.push(...getJoinedParamsFilters(guid, valuesWithOperations));
        paramsFilters.push(...getSeparateParamsValues(guid, valuesWithOperations));
    });
    return paramsFilters;
}
function getJoinedParamsFilters(guid, { operations, values, }) {
    const joinedFilters = [];
    const groupedOperations = {
        [shared_1.Operations.IN]: [],
        [shared_1.Operations.NIN]: [],
    };
    operations.forEach((operation, index) => {
        if (operation === shared_1.Operations.IN || operation === shared_1.Operations.NIN) {
            groupedOperations[operation].push(values[index]);
        }
    });
    for (const [operation, operationValues] of Object.entries(groupedOperations)) {
        if (operationValues.length) {
            joinedFilters.push({
                column: guid,
                operation,
                values: operationValues,
            });
        }
    }
    return joinedFilters;
}
function getSeparateParamsValues(guid, { operations, values, }) {
    const separateParamsFilters = [];
    values.forEach((value, index) => {
        if (operations[index] !== shared_1.Operations.IN && operations[index] !== shared_1.Operations.NIN) {
            separateParamsFilters.push({
                column: guid,
                operation: operations[index],
                values: Array.isArray(value) ? value : [value],
            });
        }
    });
    return separateParamsFilters;
}
function formatFilters({ filters, links, datasetId, datasetSchema, filterParams, drillDownData, }) {
    let chartFilters = [];
    let paramsFilters = formatParamsFilters({
        datasetSchema,
        datasetId,
        links,
        params: filterParams,
    });
    if (drillDownData) {
        const filtersToApply = drillDownData.filters.slice(0, drillDownData.level);
        const drillDownParamsFilters = filtersToApply.reduce((acc, el, index) => {
            var _a;
            if (el) {
                const field = drillDownData.fields[index];
                if ((0, shared_1.isDateField)(field)) {
                    const clientFormat = field.data_type === 'genericdatetime'
                        ? constants_1.DEFAULT_DATETIME_FORMAT
                        : constants_1.DEFAULT_DATE_FORMAT;
                    const serverFormat = (0, misc_helpers_1.getServerDateFormat)(field.data_type);
                    acc[field.guid] =
                        ((_a = (0, date_utils_1.dateTimeParse)(el, { format: clientFormat })) === null || _a === void 0 ? void 0 : _a.format(serverFormat)) || el;
                }
                else {
                    acc[field.guid] = el;
                }
            }
            return acc;
        }, {});
        const formattedDrillDownParams = formatParamsFilters({
            datasetSchema,
            datasetId,
            links,
            params: drillDownParamsFilters,
        }).map((drillDownFilter) => ({ ...drillDownFilter, isDrillDown: true }));
        paramsFilters = [...paramsFilters, ...formattedDrillDownParams];
    }
    if (filters.length) {
        chartFilters = filters
            .filter((filter) => {
            if (filter.disabled) {
                return false;
            }
            if (filter.datasetId === datasetId) {
                return true;
            }
            const linkExists = links.some((link) => {
                return (filter.datasetId && link.fields[filter.datasetId] && link.fields[datasetId]);
            });
            return linkExists;
        })
            .map((filter) => {
            if (!filter.filter) {
                return null;
            }
            const operation = filter.filter.operation.code;
            const value = filter.filter.value;
            if ((typeof value === 'number' && isNaN(value)) || !value) {
                return null;
            }
            let values = Array.isArray(value) ? value : [value];
            let valuesValidationFailed = false;
            if (values.length === 1) {
                values = [].concat(...(0, shared_1.prepareFilterValues)({ values }));
            }
            else {
                values = values
                    .map((entry, i) => {
                    if (/^__relative/.test(entry)) {
                        let intervalPart = undefined; // eslint-disable-line no-undef-init
                        if (operation === 'BETWEEN') {
                            intervalPart = i === 0 ? 'start' : 'end';
                        }
                        const resolved = (0, shared_1.resolveRelativeDate)(entry, intervalPart);
                        if (resolved === null) {
                            valuesValidationFailed = true;
                            return null;
                        }
                        return resolved;
                    }
                    else {
                        return entry;
                    }
                })
                    .filter((value) => value !== null);
            }
            if (valuesValidationFailed) {
                return null;
            }
            let { guid } = filter;
            if (filter.datasetId !== datasetId) {
                const targetLink = (0, shared_1.getItemLinkWithDatasets)(filter, datasetId, links);
                if (targetLink) {
                    guid = targetLink.fields[datasetId].field.guid;
                }
            }
            const result = {
                column: guid,
                operation,
                values,
            };
            return result;
        })
            .filter((filter) => filter !== null);
    }
    const resultFilters = (0, filters_1.getMergedChartAndParamsFilters)({ chartFilters, paramsFilters }).filter((filter) => {
        if (filter.operation === shared_1.Operations.NO_SELECTED_VALUES) {
            return false;
        }
        const filterField = datasetSchema.find((field) => field.guid === filter.column);
        if (!filter.isDrillDown &&
            filterField &&
            (Object.hasOwnProperty.call(filterParams, filterField.guid) ||
                Object.hasOwnProperty.call(filterParams, filterField.title))) {
            const paramFilter = filterParams[filterField.guid] || filterParams[filterField.title];
            return Array.isArray(paramFilter) ? paramFilter[0] !== '' : paramFilter !== '';
        }
        return true;
    });
    return resultFilters.length ? resultFilters : undefined;
}
// This function prepares a request for fields and data for a single dataset and layer
function prepareSingleRequest({ apiVersion, datasetSchema, datasetId, links = [], params, visualization, placeholders, filters = [], colors = [], shapes = [], sort = [], labels = [], tooltips = [], updates = [], segments = [], extraSettings, sharedData, revisionId, }) {
    (0, hierarchy_helpers_1.preprocessHierarchies)({
        visualizationId: visualization.id,
        placeholders,
        params,
        sharedData,
        colors,
        shapes,
        segments,
    });
    const items = (0, misc_helpers_1.getAllPlaceholderItems)(placeholders);
    const fields = items.filter((item) => !(0, shared_1.isParameter)(item));
    const itemsParameters = items.filter((item) => (0, shared_1.isParameter)(item));
    const allItems = [...items, ...colors, ...sort, ...labels, ...tooltips, ...shapes, ...segments];
    const { allItemsIds, allMeasuresMap } = allItems.reduce((acc, item) => {
        acc.allItemsIds[item.guid] = true;
        if ((0, shared_1.isMeasureField)(item)) {
            acc.allMeasuresMap[item.guid] = true;
            acc.allMeasuresMap[item.title] = true;
        }
        return acc;
    }, { allMeasuresMap: {}, allItemsIds: {} });
    const isMeasureInFields = fields.some(shared_1.isMeasureField);
    const withTotals = (visualization.id === shared_1.WizardVisualizationId.FlatTable ||
        visualization.id === shared_1.WizardVisualizationId.Donut ||
        visualization.id === shared_1.WizardVisualizationId.DonutD3 ||
        visualization.id === shared_1.WizardVisualizationId.PivotTable) &&
        (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.totals) === 'on' &&
        isMeasureInFields;
    const backgroundColorsFieldsIds = (0, helpers_1.getBackgroundColorFieldsIds)(fields, datasetId, visualization.id);
    const parameters = (0, helpers_1.prepareParameterForPayload)(itemsParameters, datasetId);
    let payload = {
        with_totals: withTotals,
        columns: (0, helpers_1.prepareColumns)({
            fields,
            datasetId,
            backgroundColorsFieldsIds,
            parameters: itemsParameters,
        }),
    };
    const parametersMap = (0, helpers_1.getParametersMap)(parameters);
    // We form all fields for which connections are made in columns
    links.forEach((link) => {
        const fieldFromCurrentDataset = link.fields[datasetId];
        if (fieldFromCurrentDataset) {
            const { guid } = fieldFromCurrentDataset.field;
            if (allItems.some((item) => {
                const linkForOtherDataset = link.fields[item.datasetId];
                return linkForOtherDataset && linkForOtherDataset.field.guid === item.guid;
            })) {
                if (payload.columns.indexOf(guid) === -1) {
                    payload.columns.push(guid);
                }
            }
        }
    });
    // Forming colors, labels, tooltips in columns
    [colors, labels, tooltips, shapes, segments].forEach((container) => {
        if (container && container.length) {
            container.forEach((item) => {
                if (item.datasetId === datasetId) {
                    const itemGuid = item.guid;
                    if ((0, shared_1.isParameter)(item) && !parametersMap[itemGuid]) {
                        parametersMap[itemGuid] = true;
                        parameters.push((0, helpers_1.mapItemToPayloadParameter)(item));
                    }
                    else if (payload.columns.indexOf(itemGuid) === -1) {
                        payload.columns.push(itemGuid);
                    }
                }
            });
        }
    });
    // Forming and passing order_by
    if (sort && sort.length) {
        const sortItems = sort
            .map((item) => {
            if (item.datasetId === datasetId) {
                return item;
            }
            else {
                const targetLink = (0, shared_1.getItemLinkWithDatasets)(item, datasetId, links);
                if (targetLink) {
                    const targetFieldInfo = targetLink.fields[datasetId].field;
                    return {
                        guid: targetFieldInfo.guid,
                        datasetId,
                        direction: item.direction,
                    };
                }
                else {
                    return item;
                }
            }
        })
            .filter((item) => item.datasetId === datasetId)
            .map((item) => {
            const itemGuid = item.guid;
            if ((0, shared_1.isParameter)(item) && !parametersMap[itemGuid]) {
                parametersMap[itemGuid] = true;
                parameters.push((0, helpers_1.mapItemToPayloadParameter)(item));
            }
            else if (!payload.columns.includes(itemGuid)) {
                payload.columns.push(item.guid);
            }
            return {
                direction: item.direction || constants_1.SORT_ORDER.DESCENDING.STR,
                column: item.guid,
            };
        });
        payload.order_by = sortItems;
    }
    // We form and transmit updates
    if (updates && updates.length) {
        payload.updates = (0, shared_1.filterUpdatesByDatasetId)(updates, datasetId);
    }
    // We pass the flag so that the backend does not swear 400 on non-existent fields in where
    payload.ignore_nonexistent_filters = true;
    // We pass the flag according to the settings for disabling grouping
    if (visualization.id === shared_1.WizardVisualizationId.FlatTable) {
        const { settings } = placeholders[0];
        if (settings &&
            'groupping' in settings &&
            (settings.groupping === 'disabled' || settings.groupping === 'off')) {
            payload.disable_group_by = true;
        }
    }
    if (visualization.id === shared_1.WizardVisualizationId.PivotTable ||
        visualization.id === shared_1.WizardVisualizationId.FlatTable) {
        payload = (0, table_settings_1.getPayloadWithCommonTableSettings)(payload, {
            extraSettings,
            params,
            datasetId,
            allItemsIds,
            visualization,
            fields,
        });
    }
    let resultRequest;
    const pivotFallbackEnabled = (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.pivotFallback) === 'on';
    const urlSearchParams = (0, shared_1.transformParamsToUrlParams)(params);
    const { filtersParams, parametersParams } = (0, shared_1.splitParamsToParametersAndFilters)(urlSearchParams, datasetSchema);
    const transformedFilterParams = (0, shared_1.transformUrlParamsToParams)(filtersParams);
    const transformedParameterParams = (0, shared_1.transformUrlParamsToParams)(parametersParams);
    const formattedFilters = formatFilters({
        filters,
        links,
        datasetSchema,
        datasetId,
        filterParams: transformedFilterParams,
        drillDownData: sharedData.drillDownData,
    });
    if (formattedFilters) {
        payload.where = formattedFilters;
    }
    payload.parameters = (0, helpers_1.prepareParameters)(parameters, transformedParameterParams, datasetSchema);
    if (visualization.id === shared_1.WizardVisualizationId.PivotTable && !pivotFallbackEnabled) {
        resultRequest = (0, pivot_request_1.buildPivotRequest)({
            apiVersion,
            placeholders,
            payload,
            colors,
            params,
            fields: [],
            datasetId,
            revisionId,
            backgroundColorsFieldsIds,
        });
    }
    else {
        // Forming a POST data request
        resultRequest = (0, default_request_1.buildDefaultRequest)({
            payload,
            fields,
            apiVersion,
            params,
            datasetId,
            revisionId,
            allMeasuresMap,
        });
    }
    return resultRequest;
}
const getUrlsRequestBody = (args) => {
    var _a, _b, _c, _d;
    const { params, shared, datasetId, layerId, revisionId } = args;
    const apiVersion = args.apiVersion || '1.5';
    const config = (0, config_helpers_1.mapChartsConfigToServerConfig)(shared);
    shared.sharedData = config.sharedData;
    shared.links = config.links;
    const visualization = config.visualization;
    const layers = config.visualization.layers || [];
    const currentLayer = layers.find((layer) => layer.layerSettings.id === layerId) || visualization;
    const placeholders = currentLayer.placeholders;
    const currentDatasetIndex = config.datasetsIds.findIndex((value) => value === datasetId);
    const currentLocalFields = currentDatasetIndex >= 0 ? (_a = config.datasetsPartialFields) === null || _a === void 0 ? void 0 : _a[currentDatasetIndex] : [];
    const datasetSchema = [...args.datasetFields, ...(currentLocalFields !== null && currentLocalFields !== void 0 ? currentLocalFields : [])];
    const links = config.links;
    const segments = config.segments;
    const sort = (_c = (_b = currentLayer === null || currentLayer === void 0 ? void 0 : currentLayer.commonPlaceholders) === null || _b === void 0 ? void 0 : _b.sort) !== null && _c !== void 0 ? _c : config.sort;
    const updates = config.updates;
    const extraSettings = config.extraSettings;
    const sharedData = shared.sharedData;
    let filters, colors, labels, tooltips, shapes;
    if (layerId) {
        const commonPlaceholders = currentLayer.commonPlaceholders;
        filters = [...commonPlaceholders.filters, ...config.filters];
        colors = commonPlaceholders.colors;
        labels = commonPlaceholders.labels;
        tooltips = commonPlaceholders.tooltips;
        shapes = commonPlaceholders.shapes;
    }
    else {
        filters = config.filters;
        colors = config.colors;
        labels = config.labels;
        tooltips = config.tooltips;
        shapes = config.shapes;
    }
    const request = prepareSingleRequest({
        apiVersion,
        datasetSchema,
        datasetId,
        params,
        links,
        visualization,
        placeholders,
        filters,
        colors,
        shapes,
        sort,
        labels,
        tooltips,
        updates,
        extraSettings,
        sharedData,
        layerId,
        revisionId,
        segments,
    });
    (0, misc_helpers_1.log)(`REQUEST`);
    (0, misc_helpers_1.log)(`datasetId=${datasetId}:`);
    if (layerId) {
        (0, misc_helpers_1.log)(`layerId=${layerId}`);
        (0, misc_helpers_1.log)(`layerName=${(_d = currentLayer === null || currentLayer === void 0 ? void 0 : currentLayer.layerSettings) === null || _d === void 0 ? void 0 : _d.name}`);
    }
    (0, misc_helpers_1.log)(request);
    (0, misc_helpers_1.log)('UPDATES:');
    (0, misc_helpers_1.log)(request.updates || []);
    return request;
};
exports.getUrlsRequestBody = getUrlsRequestBody;
