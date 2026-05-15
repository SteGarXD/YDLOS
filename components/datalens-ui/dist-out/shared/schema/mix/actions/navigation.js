"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navigationActions = void 0;
const constants_1 = require("../../../constants");
const gateway_utils_1 = require("../../gateway-utils");
const simple_schema_1 = require("../../simple-schema");
exports.navigationActions = {
    getNavigationList: (0, gateway_utils_1.createAction)(async (api, args) => {
        const { place, path, ...restArgs } = args;
        const typedApi = (0, simple_schema_1.getTypedApi)(api);
        let data;
        switch (place) {
            case constants_1.PLACE.ROOT: {
                data = await typedApi.us.listDirectory({
                    ...restArgs,
                    path,
                    includePermissionsInfo: true,
                });
                break;
            }
            case constants_1.PLACE.FAVORITES: {
                data = await typedApi.us.getFavorites({
                    ...restArgs,
                    includePermissionsInfo: true,
                });
                break;
            }
            default:
                data = await typedApi.us.getEntries({
                    ...restArgs,
                    scope: constants_1.MAP_PLACE_TO_SCOPE[place],
                    includePermissionsInfo: true,
                    excludeLocked: true,
                });
        }
        return {
            breadCrumbs: 'breadCrumbs' in data ? data.breadCrumbs : [],
            hasNextPage: data.hasNextPage,
            entries: data.entries,
        };
    }),
};
