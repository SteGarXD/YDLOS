"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEditorChartResultSchema = exports.deleteEditorChartArgsSchema = void 0;
const v4_1 = __importDefault(require("zod/v4"));
exports.deleteEditorChartArgsSchema = v4_1.default.object({
    chartId: v4_1.default.string(),
});
exports.deleteEditorChartResultSchema = v4_1.default.object({});
