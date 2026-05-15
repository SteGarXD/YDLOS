"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormatOptions = exports.MINIMUM_FRACTION_DIGITS = void 0;
exports.getFakeTitleOrTitle = getFakeTitleOrTitle;
exports.getFieldDistinctValues = getFieldDistinctValues;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const types_1 = require("../types");
const utils_1 = require("../utils");
const distincts_helpers_1 = require("./colors/distincts-helpers");
const wizard_helpers_1 = require("./wizard-helpers");
exports.MINIMUM_FRACTION_DIGITS = 2;
const getFormatOptions = (field) => {
    var _a, _b;
    if ((0, types_1.isNumberField)(field)) {
        let formatOptions = (_a = field.formatting) !== null && _a !== void 0 ? _a : {};
        if ((0, isEmpty_1.default)(formatOptions)) {
            const fieldUISettings = (0, utils_1.getFieldUISettings)({ field });
            formatOptions = (_b = fieldUISettings === null || fieldUISettings === void 0 ? void 0 : fieldUISettings.numberFormatting) !== null && _b !== void 0 ? _b : {};
        }
        if (typeof (formatOptions === null || formatOptions === void 0 ? void 0 : formatOptions.precision) !== 'number' && (0, types_1.isFloatField)(field)) {
            formatOptions.precision = exports.MINIMUM_FRACTION_DIGITS;
        }
        return formatOptions;
    }
    return undefined;
};
exports.getFormatOptions = getFormatOptions;
function getFakeTitleOrTitle(field) {
    if (!field) {
        return '';
    }
    return field.fakeTitle || field.title;
}
function getFieldDistinctValues(field, distinctsData) {
    return distinctsData.reduce((acc, cur) => {
        const rawDistinctValue = cur[0];
        let distinctValue;
        if (field.data_type === types_1.DATASET_FIELD_TYPES.MARKUP && rawDistinctValue) {
            distinctValue = (0, wizard_helpers_1.markupToRawString)(rawDistinctValue);
        }
        else {
            distinctValue = (0, distincts_helpers_1.getDistinctValue)(rawDistinctValue);
        }
        return acc.concat(distinctValue);
    }, []);
}
