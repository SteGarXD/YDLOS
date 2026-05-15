"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorActions = void 0;
const __1 = require("../../..");
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PATH_PREFIX = '/v1';
exports.editorActions = {
    _createEditorChart: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PATH_PREFIX}/entries`,
        params: ({ type, key, data, meta = {}, name, workbookId, mode = __1.EntryUpdateMode.Publish, links, description = '', annotation, }, headers) => {
            var _a;
            return {
                body: {
                    scope: 'widget',
                    type,
                    key,
                    meta,
                    data,
                    name,
                    workbookId,
                    mode,
                    links,
                    annotation: {
                        description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                    },
                },
                headers,
            };
        },
    }),
    _updateEditorChart: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ data, mode, revId, meta = {}, links, annotation, description = '' }, headers) => {
            var _a;
            return {
                body: {
                    mode,
                    meta,
                    data,
                    revId,
                    links,
                    annotation: {
                        description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                    },
                },
                headers,
            };
        },
    }),
};
