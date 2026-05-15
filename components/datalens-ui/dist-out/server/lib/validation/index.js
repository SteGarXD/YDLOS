"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkValidation = checkValidation;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
function checkValidation(req, validate) {
    let result = { success: true };
    Object.keys(validate).every((propName) => {
        if (validate[propName]) {
            const validator = ajv.compile(validate[propName]);
            if (!validator(req[propName])) {
                result = {
                    success: false,
                    message: ajv.errorsText(validator.errors),
                    details: validator.errors,
                };
                return false;
            }
        }
        return true;
    });
    return result;
}
