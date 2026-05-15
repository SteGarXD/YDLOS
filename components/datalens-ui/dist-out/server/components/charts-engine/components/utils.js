"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDashEntry = void 0;
exports.resolveRelativeDate = resolveRelativeDate;
exports.resolveIntervalDate = resolveIntervalDate;
exports.resolveOperation = resolveOperation;
exports.resolveParams = resolveParams;
exports.resolveNormalizedParams = resolveNormalizedParams;
exports.normalizeParams = normalizeParams;
exports.normalizeDatasetParamsForMssql = normalizeDatasetParamsForMssql;
exports.getDuration = getDuration;
exports.hideSensitiveData = hideSensitiveData;
exports.getSourceAuthorizationHeaders = getSourceAuthorizationHeaders;
exports.getDefaultColorPaletteId = getDefaultColorPaletteId;
const shared_1 = require("../../../../shared");
const SENSITIVE_PARAMS_NAMES = ['password', 'pass', 'token'];
const HIDDEN_SENSITIVE_VALUE = '<hidden>';
function getValue(originalValue) {
    const value = Array.isArray(originalValue) ? originalValue[0] : originalValue;
    if (typeof value !== 'string') {
        return null;
    }
    return value;
}
function resolveRelativeDate(originalValue, intervalPart) {
    const value = getValue(originalValue);
    return (value && (0, shared_1.resolveRelativeDate)(value, intervalPart)) || null;
}
function resolveIntervalDate(originalValue) {
    const value = getValue(originalValue);
    return (value && (0, shared_1.resolveIntervalDate)(value)) || null;
}
function resolveOperation(originalValue) {
    const value = getValue(originalValue);
    return (0, shared_1.resolveOperation)(value);
}
/*
 * @deprecated mutation is bad practice, use resolveNormalizedParams.
 */
// Done in order to change the values that come to params before transferring them to other tabs.
// Converts the entered date parameters. If the date is not valid, then it is forwarded as is.
// Apparently made only for __relative. Because according to the tests, just __interval_from_to is returned as is
function resolveParams(params) {
    Object.keys(params).forEach((param) => {
        const paramValues = params[param];
        paramValues.forEach((value, i) => {
            if (typeof value === 'string') {
                if (value.indexOf('__relative') === 0) {
                    const resolvedRelative = resolveRelativeDate(value);
                    if (resolvedRelative) {
                        // BI-1308
                        paramValues[i] = resolvedRelative;
                    }
                }
                else if (value.indexOf('__interval') === 0) {
                    const resolvedInterval = resolveIntervalDate(value);
                    if (resolvedInterval) {
                        // BI-1308
                        const from = resolvedInterval.from;
                        const to = resolvedInterval.to;
                        paramValues[i] = `__interval_${from}_${to}`;
                    }
                }
            }
        });
    });
}
// Done in order to change the values that come to params before transferring them to other tabs.
// Converts the entered date parameters. If the date is not valid, then it is forwarded as is.
// Apparently made only for __relative. Because according to the tests, just __interval_from_to is returned as is
function resolveNormalizedParams(params = {}) {
    return Object.entries(params).reduce((result, [key, wrappedValue]) => {
        result[key] = wrappedValue.map((value) => {
            const resolvedRelative = resolveRelativeDate(value);
            if (resolvedRelative) {
                // BI-1308
                return resolvedRelative;
            }
            const resolvedInterval = resolveIntervalDate(value);
            if (resolvedInterval) {
                // BI-1308
                const from = resolvedInterval.from;
                const to = resolvedInterval.to;
                return `__interval_${from}_${to}`;
            }
            return value;
        });
        return result;
    }, {});
}
function normalizeParams(params = {}) {
    const actionParams = {};
    const preparedParams = Object.entries(params).reduce((result, [key, value]) => {
        const normalizedVal = Array.isArray(value) ? value : [value];
        if (key.startsWith(shared_1.URL_ACTION_PARAMS_PREFIX)) {
            actionParams[key.slice(shared_1.URL_ACTION_PARAMS_PREFIX.length)] = normalizedVal;
        }
        else {
            result[key] = normalizedVal;
        }
        return result;
    }, {});
    return { params: preparedParams, actionParams };
}
/**
 * YDL OS: нормализация параметров датасета для MSSQL/TVF.
 * - Строка интервала _interval_<start>_<end> → одна дата в формате YYYY-MM-DD (начало интервала).
 * - Массив значений (мультиселект) → одна строка через запятую.
 */
function normalizeDatasetParamsForMssql(params) {
    const result = {};
    const intervalRe = /^__interval_(.+?)_(.+)$/;
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined)
            continue;
        if (Array.isArray(value)) {
            result[key] = value.filter((v) => v != null && String(v).trim() !== '').join(',');
            continue;
        }
        const str = String(value).trim();
        const intervalMatch = str.match(intervalRe);
        if (intervalMatch) {
            const startPart = intervalMatch[1].replace('T', ' ').trim();
            const dateMatch = startPart.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
                result[key] = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
            }
            else {
                result[key] = str;
            }
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
function getDuration(hrStart) {
    const hrDuration = process.hrtime(hrStart);
    return (hrDuration[0] * 1e9 + hrDuration[1]) / 1e6;
}
function hideSensitiveData(data = '') {
    if (typeof data === 'string') {
        return data;
    }
    if (typeof data === 'object' && data !== null) {
        const result = { ...data };
        SENSITIVE_PARAMS_NAMES.forEach((name) => {
            if (result[name]) {
                result[name] = HIDDEN_SENSITIVE_VALUE;
            }
        });
        return result;
    }
    return data;
}
function getSourceAuthorizationHeaders() {
    return {};
}
const isDashEntry = (entry) => {
    if (entry.scope === shared_1.EntryScope.Dash) {
        return true;
    }
    else {
        return false;
    }
};
exports.isDashEntry = isDashEntry;
function getDefaultColorPaletteId({ ctx, tenantSettings, }) {
    var _a;
    const tenantDefaultPalette = tenantSettings === null || tenantSettings === void 0 ? void 0 : tenantSettings.defaultColorPaletteId;
    if (tenantDefaultPalette) {
        return tenantDefaultPalette;
    }
    return (_a = ctx.config.defaultColorPaletteId) !== null && _a !== void 0 ? _a : shared_1.PALETTE_ID.CLASSIC_20;
}
