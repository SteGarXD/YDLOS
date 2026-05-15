"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnabledServerFeatureWithBoundedContext = exports.isEnabledServerFeature = exports.getServerFeatures = void 0;
const merge_1 = __importDefault(require("lodash/merge"));
const getServerFeatures = (ctx) => {
    var _a;
    return (0, merge_1.default)({}, ctx.config.features, (_a = ctx.dynamicConfig) === null || _a === void 0 ? void 0 : _a.features);
};
exports.getServerFeatures = getServerFeatures;
/**
 * @deprecated You should use ctx.get('isEnabledServerFeature') instead
 */
const isEnabledServerFeature = (ctx, feature) => {
    return (0, exports.getServerFeatures)(ctx)[feature];
};
exports.isEnabledServerFeature = isEnabledServerFeature;
const getEnabledServerFeatureWithBoundedContext = (ctx) => {
    return (feature) => (0, exports.getServerFeatures)(ctx)[feature];
};
exports.getEnabledServerFeatureWithBoundedContext = getEnabledServerFeatureWithBoundedContext;
