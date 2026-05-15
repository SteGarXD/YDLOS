"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWizardChartResultSchema = exports.getWizardChartArgsSchema = exports.deleteWizardChartResultSchema = exports.deleteWizardChartArgsSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.deleteWizardChartArgsSchema = zod_1.default.strictObject({
    chartId: zod_1.default.string(),
});
exports.deleteWizardChartResultSchema = zod_1.default.object({});
exports.getWizardChartArgsSchema = zod_1.default.strictObject({
    chartId: zod_1.default.string(),
    workbookId: zod_1.default.union([zod_1.default.string(), zod_1.default.null()]).optional(),
    revId: zod_1.default.string().optional(),
    includePermissions: zod_1.default.boolean().optional(),
    includeLinks: zod_1.default.boolean().optional(),
    includeFavorite: zod_1.default.boolean().optional(),
    branch: zod_1.default.enum(['saved', 'published']).optional(),
});
exports.getWizardChartResultSchema = zod_1.default.unknown();
