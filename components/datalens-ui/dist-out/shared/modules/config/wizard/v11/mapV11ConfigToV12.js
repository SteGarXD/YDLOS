"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapV11ConfigToV12 = void 0;
const set_1 = __importDefault(require("lodash/set"));
const types_1 = require("../../../../types");
function replaceObjectField(item) {
    if (item && typeof item === 'object') {
        if ('isMarkdown' in item) {
            delete item['isMarkdown'];
            (0, set_1.default)(item, 'markupType', types_1.MARKUP_TYPE.markdown);
        }
        else {
            Object.values(item).forEach(replaceObjectField);
        }
    }
}
const mapV11ConfigToV12 = (config) => {
    replaceObjectField(config);
    return {
        ...config,
        version: types_1.ChartsConfigVersion.V12,
    };
};
exports.mapV11ConfigToV12 = mapV11ConfigToV12;
