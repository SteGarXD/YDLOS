"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
function validate(data, schema) {
    const validateFn = ajv.compile(schema);
    return validateFn(data) ? false : ajv.errorsText(validateFn.errors);
}
