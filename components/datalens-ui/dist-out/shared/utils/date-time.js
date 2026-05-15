"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUtcDateTime = getUtcDateTime;
const dayjs_1 = __importDefault(require("@gravity-ui/date-utils/build/dayjs"));
// https://github.com/gravity-ui/date-utils/issues/49
function getUtcDateTime(value) {
    return dayjs_1.default.utc(value);
}
