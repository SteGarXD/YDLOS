"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEntryId = exports.transformUrlParamsToParams = exports.prepareUrlParams = exports.transformParamsToUrlParams = exports.isTreeField = exports.isTreeDataType = exports.isPseudoField = exports.isMeasureField = exports.isDimensionField = exports.isParameter = void 0;
exports.extractEntryId = extractEntryId;
exports.decodeURISafe = decodeURISafe;
exports.prepareFilterValuesWithOperations = prepareFilterValuesWithOperations;
exports.prepareFilterValues = prepareFilterValues;
exports.getAxisMode = getAxisMode;
exports.getIsNavigatorAvailable = getIsNavigatorAvailable;
exports.getIsNavigatorEnabled = getIsNavigatorEnabled;
exports.getSortedData = getSortedData;
exports.getObjectValueByPossibleKeys = getObjectValueByPossibleKeys;
const constants_1 = require("../constants");
const types_1 = require("../types");
const charts_shared_1 = require("./charts-shared");
function getEntryId(str) {
    const possibleEntryId = str.slice(0, constants_1.ENTRY_ID_LENGTH);
    const isEntryIdResult = (0, exports.isEntryId)(possibleEntryId);
    if (isEntryIdResult && str.length === constants_1.ENTRY_ID_LENGTH) {
        return possibleEntryId;
    }
    if (isEntryIdResult && str[constants_1.ENTRY_ID_LENGTH] === constants_1.ENTRY_SLUG_SEPARATOR) {
        return possibleEntryId;
    }
    return null;
}
function extractEntryId(input) {
    if (!input || typeof input !== 'string') {
        return null;
    }
    const [partOne, partTwo, partThree] = input.split('/').filter(Boolean);
    if (partThree === constants_1.WIZARD_ROUTE && partTwo === 'new') {
        return getEntryId(partOne);
    }
    if (partTwo && constants_1.ENTRY_ROUTES.some((route) => partOne === route)) {
        return getEntryId(partTwo);
    }
    if (partOne && partTwo !== 'new') {
        return getEntryId(partOne);
    }
    return null;
}
function decodeURISafe(uri) {
    if (!uri) {
        return uri;
    }
    return decodeURI(uri.replace(/%(?![0-9a-fA-F][0-9a-fA-F]+)/g, '%25'));
}
function prepareFilterValuesWithOperations({ values, field }) {
    return prepareArrayFilterValues({ values, field });
}
function prepareFilterValues({ values }) {
    return prepareArrayFilterValues({ values }).values;
}
function prepareArrayFilterValues({ field, values, }) {
    return values.reduce((acc, rawValue) => {
        const defaultOperation = field && (0, types_1.isDateField)(field) && values.length === 1 ? charts_shared_1.Operations.EQ : undefined;
        const parsedFiltersOperation = (0, charts_shared_1.resolveOperation)(rawValue, defaultOperation);
        if (!parsedFiltersOperation) {
            acc.values.push(rawValue);
            acc.operations.push(charts_shared_1.Operations.IN);
            return acc;
        }
        let value = parsedFiltersOperation.value;
        let operation = parsedFiltersOperation.operation;
        if (/^__relative/.test(value)) {
            value = (0, charts_shared_1.resolveRelativeDate)(value);
        }
        else if (/^__interval/.test(value)) {
            const interval = (0, charts_shared_1.resolveIntervalDate)(value);
            if (!(interval === null || interval.from === null || interval.to === null)) {
                value = [interval.from, interval.to];
                operation = charts_shared_1.Operations.BETWEEN;
            }
        }
        if (value !== null) {
            acc.values.push(value);
            acc.operations.push(operation);
        }
        return acc;
    }, { operations: [], values: [] });
}
function getAxisMode(placeholderSettings, fieldGuid) {
    const xAxisModeMap = (placeholderSettings === null || placeholderSettings === void 0 ? void 0 : placeholderSettings.axisModeMap) || {};
    let xAxisMode;
    if (fieldGuid) {
        xAxisMode = xAxisModeMap[fieldGuid];
    }
    return xAxisMode || "discrete" /* AxisMode.Discrete */;
}
function getIsNavigatorAvailable(visualization) {
    if (!visualization) {
        return false;
    }
    const { placeholders, id } = visualization;
    const xPlaceholder = Array.isArray(placeholders) && placeholders.find((pl) => pl.id === 'x');
    if (!xPlaceholder) {
        return false;
    }
    const xItems = xPlaceholder.items;
    return Boolean(constants_1.VISUALIZATIONS_WITH_NAVIGATOR.has(id) &&
        xItems.length &&
        (0, types_1.isDateField)(xItems[0]) &&
        getAxisMode(xPlaceholder.settings, xItems[0].guid) !== "discrete" /* AxisMode.Discrete */);
}
function getIsNavigatorEnabled(shared) {
    var _a;
    const extraSettings = shared.extraSettings;
    const navigatorMode = ((_a = extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.navigatorSettings) === null || _a === void 0 ? void 0 : _a.navigatorMode) || (extraSettings === null || extraSettings === void 0 ? void 0 : extraSettings.navigatorMode);
    return getIsNavigatorAvailable(shared.visualization) && navigatorMode === constants_1.NavigatorModes.Show;
}
const isParameter = (field) => {
    return field.calc_mode === 'parameter';
};
exports.isParameter = isParameter;
const isDimensionField = (field) => {
    return (field === null || field === void 0 ? void 0 : field.type) === types_1.DatasetFieldType.Dimension && !(0, exports.isParameter)(field);
};
exports.isDimensionField = isDimensionField;
const isMeasureField = (field) => {
    return (field === null || field === void 0 ? void 0 : field.type) === types_1.DatasetFieldType.Measure;
};
exports.isMeasureField = isMeasureField;
const isPseudoField = (field) => {
    return (field === null || field === void 0 ? void 0 : field.type) === types_1.DatasetFieldType.Pseudo;
};
exports.isPseudoField = isPseudoField;
const isTreeDataType = (data_type) => {
    return (data_type === types_1.DATASET_FIELD_TYPES.TREE_STR ||
        data_type === types_1.DATASET_FIELD_TYPES.TREE_INT ||
        data_type === types_1.DATASET_FIELD_TYPES.TREE_FLOAT);
};
exports.isTreeDataType = isTreeDataType;
const isTreeField = (field) => {
    return (0, exports.isTreeDataType)(field.data_type);
};
exports.isTreeField = isTreeField;
const transformParamsToUrlParams = (widgetParams) => {
    return Object.keys(widgetParams).reduce((acc, paramName) => {
        const paramValue = widgetParams[paramName];
        if (Array.isArray(paramValue)) {
            return acc.concat(paramValue.map((value) => [paramName, value]));
        }
        else {
            acc.push([paramName, paramValue]);
            return acc;
        }
    }, []);
};
exports.transformParamsToUrlParams = transformParamsToUrlParams;
const prepareUrlParams = (params) => {
    return params.map((param) => {
        // Ideally, the parameters should always contain strings.
        // But sometimes number|boolean|string can be specified.
        return param.map(String);
    });
};
exports.prepareUrlParams = prepareUrlParams;
const transformUrlParamsToParams = (urlParams) => {
    return (0, exports.prepareUrlParams)(urlParams).reduce((acc, paramsPair) => {
        const [key, value = ''] = paramsPair;
        if (acc[key]) {
            acc[key].push(value);
        }
        else {
            acc[key] = [value];
        }
        return acc;
    }, {});
};
exports.transformUrlParamsToParams = transformUrlParamsToParams;
function getSortedData(data) {
    return Object.keys(data)
        .sort()
        .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
    }, {});
}
function getObjectValueByPossibleKeys(possibleKeys, obj) {
    const firstMatchedKey = possibleKeys.find((key) => typeof obj[key] !== 'undefined');
    if (firstMatchedKey) {
        return obj[firstMatchedKey];
    }
    return undefined;
}
const isEntryId = (value) => {
    const ENTRY_ID_FORMAT = /^[0-9a-z]{13}$/;
    return ENTRY_ID_FORMAT.test(value);
};
exports.isEntryId = isEntryId;
