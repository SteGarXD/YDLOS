"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFieldWithDisplaySettings = exports.isDisplaySettingsAvailable = exports.getFieldUISettings = void 0;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const helpers_1 = require("../modules/helpers");
const types_1 = require("../types");
const getFieldUISettings = ({ field }) => {
    const value = field === null || field === void 0 ? void 0 : field.ui_settings;
    let result = null;
    try {
        if (value) {
            result = JSON.parse(value);
        }
    }
    catch (e) {
        console.error('Incorrect ui_settings value', e);
    }
    return result;
};
exports.getFieldUISettings = getFieldUISettings;
const isDisplaySettingsAvailable = ({ field }) => {
    const isNumberFormattingAvailable = (0, types_1.isNumberField)(field);
    const isColoringAvailable = (0, helpers_1.isDimensionField)(field);
    return isNumberFormattingAvailable || isColoringAvailable;
};
exports.isDisplaySettingsAvailable = isDisplaySettingsAvailable;
const isFieldWithDisplaySettings = ({ field }) => {
    const settings = (0, exports.getFieldUISettings)({ field });
    return [settings === null || settings === void 0 ? void 0 : settings.numberFormatting, settings === null || settings === void 0 ? void 0 : settings.colors].some((d) => !(0, isEmpty_1.default)(d));
};
exports.isFieldWithDisplaySettings = isFieldWithDisplaySettings;
