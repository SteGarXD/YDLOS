"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartsInsightLocator = exports.getDefaultTitleForOperation = exports.DEFAULT_OPERATION_TITLE = exports.IS_NULL_FILTER_TEMPLATE = exports.OperationsWithoutValue = exports.Operations = exports.ScaleToDurationUnit = exports.CLIP_SCALES = void 0;
exports.getParsedRelativeDate = getParsedRelativeDate;
exports.resolveRelativeDate = resolveRelativeDate;
exports.getParsedIntervalDates = getParsedIntervalDates;
exports.resolveIntervalDate = resolveIntervalDate;
exports.resolveOperation = resolveOperation;
exports.splitParamsToParametersAndFilters = splitParamsToParametersAndFilters;
exports.isObjectWith = isObjectWith;
const date_utils_1 = require("@gravity-ui/date-utils");
const helpers_1 = require("./helpers");
exports.CLIP_SCALES = ['d', 'w', 'M', 'Q', 'y'];
exports.ScaleToDurationUnit = {
    y: 'year',
    Q: 'quarter',
    M: 'month',
    w: 'week',
    d: 'day',
    h: 'hour',
    m: 'minute',
    s: 'second',
    ms: 'millisecond',
};
var Operations;
(function (Operations) {
    Operations["IN"] = "IN";
    Operations["NIN"] = "NIN";
    Operations["EQ"] = "EQ";
    Operations["NE"] = "NE";
    Operations["GT"] = "GT";
    Operations["LT"] = "LT";
    Operations["GTE"] = "GTE";
    Operations["LTE"] = "LTE";
    Operations["ISNULL"] = "ISNULL";
    Operations["ISNOTNULL"] = "ISNOTNULL";
    Operations["ISTARTSWITH"] = "ISTARTSWITH";
    Operations["STARTSWITH"] = "STARTSWITH";
    Operations["IENDSWITH"] = "IENDSWITH";
    Operations["ENDSWITH"] = "ENDSWITH";
    Operations["ICONTAINS"] = "ICONTAINS";
    Operations["CONTAINS"] = "CONTAINS";
    Operations["NOTICONTAINS"] = "NOTICONTAINS";
    Operations["NOTCONTAINS"] = "NOTCONTAINS";
    Operations["BETWEEN"] = "BETWEEN";
    Operations["LENEQ"] = "LENEQ";
    Operations["LENGT"] = "LENGT";
    Operations["LENGTE"] = "LENGTE";
    Operations["LENLT"] = "LENLT";
    Operations["LENLTE"] = "LENLTE";
    Operations["NO_SELECTED_VALUES"] = "NO_SELECTED_VALUES";
})(Operations || (exports.Operations = Operations = {}));
var OperationsWithoutValue;
(function (OperationsWithoutValue) {
    OperationsWithoutValue["ISNULL"] = "ISNULL";
    OperationsWithoutValue["ISNOTNULL"] = "ISNOTNULL";
})(OperationsWithoutValue || (exports.OperationsWithoutValue = OperationsWithoutValue = {}));
exports.IS_NULL_FILTER_TEMPLATE = `__${Operations.ISNULL}_`;
exports.DEFAULT_OPERATION_TITLE = {
    ...Operations,
    [Operations.EQ]: '=',
    [Operations.NE]: '≠',
    [Operations.GT]: '>',
    [Operations.LT]: '<',
    [Operations.GTE]: '≥',
    [Operations.LTE]: '≤',
};
const getDefaultTitleForOperation = (operation) => exports.DEFAULT_OPERATION_TITLE[operation];
exports.getDefaultTitleForOperation = getDefaultTitleForOperation;
const IntervalRegExp = {
    DL: /^__interval_(__relative_\W\d+\w(?:_\w\w)?|[^_]+)_(.+)$/,
    DATE_UTILS: /^__interval_(now(?:_now)?|[^_]+)_(.+)$/,
};
function getParsedRelativeDate(value) {
    if (!value) {
        return null;
    }
    const match = value.match(/^__relative_([+-])(\d+)(y|Q|M|w|d|h|m|s|ms)(?:_([se])([yQMwdhms]))?$/);
    if (!match) {
        return null;
    }
    const [, sign, amount, scale, cast, castScale] = match;
    return [sign, amount, scale, cast, castScale];
}
function resolveDlRelative(value, intervalPart = 'start') {
    const parsedDate = getParsedRelativeDate(value);
    if (!parsedDate) {
        return null;
    }
    const [sign, amount, scale, cast, castScale] = parsedDate;
    const durationUnit = exports.ScaleToDurationUnit[scale];
    let date = (0, date_utils_1.dateTime)({ timeZone: 'UTC' }).add(`${sign}${amount}`, durationUnit);
    if (cast) {
        const castUnit = exports.ScaleToDurationUnit[castScale];
        date = cast === 's' ? date.startOf(castUnit) : date.endOf(castUnit);
    }
    else if (exports.CLIP_SCALES.indexOf(scale) !== -1) {
        date = intervalPart === 'start' ? date.startOf('day') : date.endOf('day');
    }
    return date.toISOString();
}
function isDateUtilsRelative(value) {
    return typeof value === 'string' && value.startsWith('now');
}
function resolveDateUtilsRelative(value, intervalPart) {
    if (!isDateUtilsRelative(value)) {
        return null;
    }
    const date = (0, date_utils_1.dateTimeParse)(value, {
        timeZone: 'UTC',
        roundUp: intervalPart === 'end',
    });
    return (date === null || date === void 0 ? void 0 : date.toISOString()) || null;
}
// processes the relative format and generates an ISO date
// for scales from a day or more, depending on intervalPart, the time is set to the beginning/end of the day:
// * IntervalPart.Start - YYYY-MM-DDT00:00:00.000Z
// * IntervalPart.End - YYYY-MM-DDT23:59:59.999Z
function resolveRelativeDate(value, intervalPart) {
    const parsedDl = resolveDlRelative(value, intervalPart);
    const parsedDateUtils = resolveDateUtilsRelative(value, intervalPart);
    return parsedDl || parsedDateUtils;
}
function getParsedIntervalDates(value) {
    if (!value) {
        return null;
    }
    const match = value.match(IntervalRegExp.DL) || value.match(IntervalRegExp.DATE_UTILS);
    if (!match) {
        return null;
    }
    const [, matchedFrom, matchedTo] = match;
    return [matchedFrom, matchedTo];
}
// processes interval format and generates two ISO dates: {from, to}
// if from or to is an incorrect date, return null
function resolveIntervalDate(value) {
    const parsedData = getParsedIntervalDates(value);
    if (!parsedData) {
        return null;
    }
    const [parsedFrom, parsedTo] = parsedData;
    const from = resolveRelativeDate(parsedFrom, 'start') ||
        ((0, date_utils_1.dateTime)({ input: parsedFrom }).isValid() && parsedFrom) ||
        null;
    const to = resolveRelativeDate(parsedTo, 'end') ||
        ((0, date_utils_1.dateTime)({ input: parsedTo }).isValid() && parsedTo) ||
        null;
    if (from && to) {
        return { from, to };
    }
    return null;
}
function resolveOperation(urlValue, defaultOperation) {
    var _a;
    if (!urlValue) {
        return null;
    }
    // In an ideal world, urlValue should always be string. However, in Editor, the user can put in params
    // absolutely anything. Therefore, if it is not a string, then we make a fallback to the old behavior.
    if (typeof urlValue !== 'string') {
        return getFallbackForUrlFilters(urlValue, defaultOperation);
    }
    const match = urlValue.match(/^_{2}([^_]+)_([\s\S]+)?$/);
    if (!match) {
        return getFallbackForUrlFilters(urlValue, defaultOperation);
    }
    const operation = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    const value = match[2];
    if (typeof value === 'undefined' &&
        !Object.values(OperationsWithoutValue).includes(operation)) {
        return getFallbackForUrlFilters(urlValue);
    }
    if (Object.values(Operations).includes(operation)) {
        return {
            operation: operation,
            value,
        };
    }
    return getFallbackForUrlFilters(urlValue);
}
function getFallbackForUrlFilters(urlValue, defaultOperation) {
    let operation = defaultOperation !== null && defaultOperation !== void 0 ? defaultOperation : Operations.IN;
    if (typeof urlValue === 'string' && urlValue.indexOf('__interval') > -1) {
        operation = Operations.BETWEEN;
    }
    return {
        operation,
        value: urlValue,
    };
}
function splitParamsToParametersAndFilters(urlSearchParams, fields) {
    const parametersMap = fields.filter(helpers_1.isParameter).reduce((acc, field) => {
        acc[field.guid] = true;
        acc[field.title] = true;
        return acc;
    }, {});
    return urlSearchParams.reduce((acc, curr) => {
        const paramGuid = curr[0] || '';
        if (parametersMap[paramGuid]) {
            const parameterValue = curr[1];
            const resolvedParameterValue = resolveOperation(parameterValue);
            acc.parametersParams.push([
                paramGuid,
                (resolvedParameterValue === null || resolvedParameterValue === void 0 ? void 0 : resolvedParameterValue.value) || parameterValue,
            ]);
        }
        else {
            acc.filtersParams.push(curr);
        }
        return acc;
    }, {
        filtersParams: [],
        parametersParams: [],
    });
}
var ChartsInsightLocator;
(function (ChartsInsightLocator) {
    ChartsInsightLocator["UsingDeprecatedDatetimeFields"] = "using_deprecated_datetime_fields";
})(ChartsInsightLocator || (exports.ChartsInsightLocator = ChartsInsightLocator = {}));
function isObjectWith(value, check, ignore, path = '') {
    if (!value) {
        return false;
    }
    if (check(value)) {
        return path;
    }
    if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
            const pathToItem = isObjectWith(value[index], check, ignore, `${path}[${index}]`);
            if (pathToItem) {
                return pathToItem;
            }
        }
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value);
        for (let index = 0; index < entries.length; index++) {
            const [key, val] = entries[index];
            if (ignore === null || ignore === void 0 ? void 0 : ignore.includes(key)) {
                continue;
            }
            const pathToItem = isObjectWith(val, check, ignore, path ? `${path}.${key}` : key);
            if (pathToItem) {
                return pathToItem;
            }
        }
    }
    return false;
}
