"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStructureItems = void 0;
const modules_1 = require("../../../../modules");
const gateway_utils_1 = require("../../../gateway-utils");
exports.getStructureItems = (0, gateway_utils_1.createAction)({
    method: 'GET',
    path: () => '/v1/structure-items',
    params: ({ collectionId, includePermissionsInfo, filterString, page, pageSize, orderField, orderDirection, onlyMy, mode, }, headers) => ({
        query: {
            collectionId,
            includePermissionsInfo,
            filterString,
            // null is passed from query parameters
            page: page === null ? 'null' : page,
            pageSize,
            orderField,
            orderDirection,
            onlyMy,
            mode,
        },
        headers,
    }),
    transformResponseData: (data) => ({
        ...data,
        items: data.items.map((item) => {
            if ('displayKey' in item) {
                return { ...item, title: (0, modules_1.getEntryNameByKey)({ key: item.displayKey }) };
            }
            return item;
        }),
    }),
});
