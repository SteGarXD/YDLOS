"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetsActions = void 0;
const lodash_1 = __importDefault(require("lodash"));
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PATH_PREFIX = '/v1';
exports.presetsActions = {
    getPreset: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ presetId }) => `${PATH_PREFIX}/presets/${(0, utils_1.filterUrlFragment)(presetId)}`,
        params: (args, headers) => ({ query: lodash_1.default.omit(args, 'presetId'), headers }),
    }),
};
