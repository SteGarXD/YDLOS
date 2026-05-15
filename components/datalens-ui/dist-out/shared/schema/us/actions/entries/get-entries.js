"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntries = void 0;
const modules_1 = require("../../../../modules");
const gateway_utils_1 = require("../../../gateway-utils");
const utils_1 = require("../../../utils");
const get_entries_1 = require("../../schemas/entries/get-entries");
exports.getEntries = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: get_entries_1.getEntriesArgsSchema,
    resultSchema: get_entries_1.getEntriesResultSchema,
    transformedSchema: get_entries_1.getEntriesTransformedSchema,
}, {
    method: 'GET',
    path: () => '/v1/entries',
    params: (query, headers) => ({ query, headers }),
    transformResponseData: (data) => ({
        hasNextPage: Boolean(data.nextPageToken),
        entries: data.entries.map((entry) => ({
            ...entry,
            name: 'key' in entry ? (0, modules_1.getEntryNameByKey)({ key: entry.key }) : '',
        })),
    }),
    paramsSerializer: utils_1.defaultParamsSerializer,
});
