"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDirectory = void 0;
const modules_1 = require("../../../../modules");
const gateway_utils_1 = require("../../../gateway-utils");
const utils_1 = require("../../../utils");
const list_directory_1 = require("../../schemas/entries/list-directory");
exports.listDirectory = (0, gateway_utils_1.createTypedAction)({
    paramsSchema: list_directory_1.listDirectoryArgsSchema,
    resultSchema: list_directory_1.listDirectoryResultSchema,
    transformedSchema: list_directory_1.listDirectoryTransformedSchema,
}, {
    method: 'GET',
    path: () => '/v1/navigation',
    params: (query, headers) => ({ query, headers }),
    transformResponseData: (data) => ({
        hasNextPage: Boolean(data.nextPageToken),
        breadCrumbs: data.breadCrumbs,
        entries: data.entries.map((entry) => ({
            ...entry,
            name: (0, modules_1.getEntryNameByKey)({ key: entry.key }),
        })),
    }),
    paramsSerializer: utils_1.defaultParamsSerializer,
});
