"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedsActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const EMBEDS_PATH_PREFIX = '/v1/embeds';
exports.embedsActions = {
    createEmbed: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => EMBEDS_PATH_PREFIX,
        params: (params, headers) => ({
            body: params,
            headers,
        }),
    }),
    listEmbeds: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => EMBEDS_PATH_PREFIX,
        params: ({ entryId }, headers) => ({
            query: { entryId },
            headers,
        }),
    }),
    deleteEmbed: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ embedId }) => `${EMBEDS_PATH_PREFIX}/${embedId}`,
        params: (_, headers) => ({
            headers,
        }),
    }),
};
