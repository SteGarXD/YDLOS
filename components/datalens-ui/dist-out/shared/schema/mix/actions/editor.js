"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorActions = void 0;
const types_1 = require("../../../types");
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
const helpers_1 = require("../helpers");
const validation_1 = require("../helpers/editor/validation");
const editor_1 = require("../schemas/editor");
exports.editorActions = {
    createEditorChart: (0, gateway_utils_1.createAction)(async (api, args, { ctx }) => {
        const { checkRequestForDeveloperModeAccess } = ctx.get('gateway');
        const checkResult = await checkRequestForDeveloperModeAccess({ ctx });
        if (checkResult === types_1.DeveloperModeCheckStatus.Allowed) {
            (0, validation_1.validateData)(args.data);
            const typedApi = (0, simple_schema_1.getTypedApi)(api);
            return await typedApi.us._createEditorChart({ ...args, links: (0, helpers_1.getEntryLinks)(args) });
        }
        else {
            throw new Error('Access to Editor developer mode was denied');
        }
    }),
    updateEditorChart: (0, gateway_utils_1.createAction)(async (api, args, { ctx }) => {
        const { checkRequestForDeveloperModeAccess } = ctx.get('gateway');
        const checkResult = await checkRequestForDeveloperModeAccess({ ctx });
        if (checkResult === types_1.DeveloperModeCheckStatus.Allowed) {
            (0, validation_1.validateData)(args.data);
            const typedApi = (0, simple_schema_1.getTypedApi)(api);
            return await typedApi.us._updateEditorChart({ ...args, links: (0, helpers_1.getEntryLinks)(args) });
        }
        else {
            throw new Error('Access to Editor developer mode was denied');
        }
    }),
    // WIP
    __deleteEditorChart__: (0, gateway_utils_1.createTypedAction)({
        paramsSchema: editor_1.deleteEditorChartArgsSchema,
        resultSchema: editor_1.deleteEditorChartResultSchema,
    }, async (api, { chartId }) => {
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        await typedApi.us._deleteUSEntry({
            entryId: chartId,
        });
        return {};
    }),
};
