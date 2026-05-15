"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = exports.formatBytes = void 0;
exports.formatNumber = formatNumber;
exports.getXlsxNumberFormat = getXlsxNumberFormat;
const i18n_1 = require("./i18n/i18n");
const en_json_1 = __importDefault(require("./i18n/en.json"));
const ru_json_1 = __importDefault(require("./i18n/ru.json"));
const i18n = (0, i18n_1.makeInstance)('chartkit-units', { ru: ru_json_1.default, en: en_json_1.default });
function getUnitRate(value, exponent, unitsI18nKeys) {
    let resultUnitRate = 1;
    while (Math.abs(value / Math.pow(exponent, resultUnitRate)) >= 1 &&
        resultUnitRate < 10 &&
        i18n(unitsI18nKeys[resultUnitRate])) {
        resultUnitRate++;
    }
    resultUnitRate--;
    return resultUnitRate;
}
function unitFormatter({ exponent, unitsI18nKeys, unitDelimiterI18nKey, }) {
    return function formatUnit(value, options = {}) {
        const { precision, unitRate, showRankDelimiter = true, lang } = options;
        const i18nLang = i18n_1.i18nInstance.lang;
        if (lang) {
            i18n_1.i18nInstance.setLang(lang);
        }
        let resultUnitRate;
        if (typeof unitRate === 'number') {
            resultUnitRate = unitRate;
        }
        else {
            resultUnitRate = getUnitRate(value, exponent, unitsI18nKeys);
        }
        let result = value / Math.pow(exponent, resultUnitRate);
        if (typeof precision === 'number') {
            result = Number(result.toFixed(precision));
        }
        else if (precision === 'auto' && result % 1 !== 0) {
            result = Number(result.toFixed(Math.abs(result) > 1 ? 2 : 4));
        }
        // precision is set in toFixed above,
        // here you only need to divide the digits by useGrouping,
        // and not to lose the decimal part while setting minimumFractionDigits/maximumFractionDigits
        result = new Intl.NumberFormat(lang !== null && lang !== void 0 ? lang : i18nLang, {
            // to complement the decimal part, where it absent or where there are fewer digits than in precision
            minimumFractionDigits: typeof precision === 'number' ? precision : 0,
            maximumFractionDigits: 20,
            useGrouping: showRankDelimiter,
            // @ts-ignore
            signDisplay: 'negative',
        }).format(result);
        const unit = i18n(unitsI18nKeys[resultUnitRate]);
        const delimiter = i18n(unitDelimiterI18nKey);
        i18n_1.i18nInstance.setLang(i18nLang);
        return `${result}${delimiter}${unit}`;
    };
}
exports.formatBytes = unitFormatter({
    exponent: 1024,
    unitDelimiterI18nKey: 'value_space-delimiter',
    unitsI18nKeys: ['value_short-bytes', 'value_short-kilobytes', 'value_short-megabytes'],
});
exports.formatDuration = unitFormatter({
    exponent: 1000,
    unitDelimiterI18nKey: 'value_space-delimiter',
    unitsI18nKeys: ['value_short-milliseconds', 'value_short-seconds', 'value_short-minutes'],
});
const NUMBER_INITS_I18N_KEYS = [
    'value_short-empty',
    'value_short-k',
    'value_short-m',
    'value_short-b',
    'value_short-t',
];
const baseFormatNumber = unitFormatter({
    exponent: 1000,
    unitDelimiterI18nKey: 'value_number-delimiter',
    unitsI18nKeys: NUMBER_INITS_I18N_KEYS,
});
const NUMBER_UNIT_RATE_BY_UNIT = {
    default: 0,
    auto: undefined,
    k: 1,
    m: 2,
    b: 3,
    t: 4,
};
function formatNumber(value, options = {}) {
    if (Number.isNaN(value) || Number.isNaN(Number(value))) {
        return new Intl.NumberFormat('en').format(Number(value));
    }
    const { format = 'number', multiplier = 1, prefix = '', postfix = '', unit, unitRate, labelMode, } = options;
    let changedMultiplier = multiplier;
    let prePostfix = '';
    if (format === 'percent') {
        changedMultiplier = 100;
        prePostfix = '%';
    }
    if (labelMode === 'percent') {
        prePostfix = '%';
    }
    const formattedValue = baseFormatNumber(Number(value) * changedMultiplier, {
        ...options,
        unitRate: unitRate !== null && unitRate !== void 0 ? unitRate : NUMBER_UNIT_RATE_BY_UNIT[unit !== null && unit !== void 0 ? unit : 'default'],
    });
    return `${prefix}${formattedValue}${prePostfix}${postfix}`;
}
function getXlsxNumberFormat(value, options = {}) {
    var _a, _b;
    let mainPart = '#,##0';
    let decimalPart = '';
    let percent = '';
    let unit = '';
    const prefix = options.prefix ? `"${options.prefix}"` : '';
    const postfix = options.postfix ? `"${options.postfix}"` : '';
    if (options.showRankDelimiter === false) {
        mainPart = '###0';
    }
    if (options.precision) {
        decimalPart = `.${new Array(options.precision).fill(0).join('')}`;
    }
    if (options.format === 'percent') {
        percent = '%';
    }
    else {
        const unitRate = (_a = options.unitRate) !== null && _a !== void 0 ? _a : NUMBER_UNIT_RATE_BY_UNIT[(_b = options.unit) !== null && _b !== void 0 ? _b : 'default'];
        let resultUnitRate;
        if (typeof unitRate === 'number') {
            resultUnitRate = unitRate;
        }
        else {
            const exponent = 1000;
            resultUnitRate = getUnitRate(value, exponent, NUMBER_INITS_I18N_KEYS);
        }
        if (resultUnitRate) {
            unit = `"${i18n(NUMBER_INITS_I18N_KEYS[resultUnitRate])}"`;
            mainPart += decimalPart + new Array(resultUnitRate).fill(',').join('');
            decimalPart = '';
        }
    }
    return `${prefix}${mainPart}${decimalPart}${percent}${unit || ''}${postfix}`;
}
