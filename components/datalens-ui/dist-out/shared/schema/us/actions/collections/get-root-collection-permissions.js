"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootCollectionPermissions = exports.getRootCollectionPermissionsResultSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const gateway_utils_1 = require("../../../gateway-utils");
exports.getRootCollectionPermissionsResultSchema = zod_1.default.object({
    createCollectionInRoot: zod_1.default.boolean(),
    createWorkbookInRoot: zod_1.default.boolean(),
});
exports.getRootCollectionPermissions = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: undefined,
    resultSchema: exports.getRootCollectionPermissionsResultSchema,
}, {
    method: 'GET',
    path: () => '/v1/root-collection-permissions',
    params: (_, headers) => ({
        headers,
    }),
});
