"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesActions = void 0;
const modules_1 = require("../../../modules");
const gateway_utils_1 = require("../../gateway-utils");
const utils_1 = require("../../utils");
const PATH_PREFIX = '/v1';
exports.favoritesActions = {
    addFavorite: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/favorites/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: (_, headers) => ({ headers }),
    }),
    deleteFavorite: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ entryId }) => `${PATH_PREFIX}/favorites/${(0, utils_1.filterUrlFragment)(entryId)}`,
        params: (_, headers) => ({ headers }),
    }),
    renameFavorite: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ entryId }) => `${PATH_PREFIX}/favorites/${entryId}/rename`,
        params: ({ name }, headers) => ({ body: { name }, headers }),
    }),
    getFavorites: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => `${PATH_PREFIX}/favorites`,
        params: (query, headers) => ({ query, headers }),
        transformResponseData: (data) => ({
            hasNextPage: Boolean(data.nextPageToken),
            entries: data.entries.map((entry) => {
                var _a;
                return ({
                    ...entry,
                    isFavorite: true,
                    name: (0, modules_1.getEntryNameByKey)({ key: entry.key }),
                    displayAlias: (_a = entry.displayAlias) !== null && _a !== void 0 ? _a : entry.alias,
                });
            }),
        }),
        paramsSerializer: utils_1.defaultParamsSerializer,
    }),
};
