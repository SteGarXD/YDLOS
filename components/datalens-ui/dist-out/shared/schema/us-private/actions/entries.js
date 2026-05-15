"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entriesActions = void 0;
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PRIVATE_PATH_PREFIX = '/private';
exports.entriesActions = {
    _getEntryMeta: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PRIVATE_PATH_PREFIX}/entries/${entryId}/meta`,
        params: (_, headers) => ({
            headers,
        }),
    }),
    _proxyGetEntry: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: ({ entryId }) => `${PRIVATE_PATH_PREFIX}/entries/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: ({ entryId: _entryId, workbookId, ...query }, headers) => {
            return {
                query,
                headers: {
                    ...headers,
                    ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
                },
            };
        },
    }),
    _proxyCreateEntry: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => `${PRIVATE_PATH_PREFIX}/entries/`,
        params: ({ workbookId, data, name, type, scope, mode, links, key, recursion, includePermissionsInfo, annotation, }, headers) => ({
            headers: {
                ...headers,
                ...(workbookId ? { [constants_1.WORKBOOK_ID_HEADER]: workbookId } : {}),
            },
            body: {
                workbookId,
                data,
                name,
                type,
                scope,
                mode,
                links,
                recursion,
                includePermissionsInfo,
                annotation,
                ...(key ? { key } : {}),
            },
        }),
    }),
};
