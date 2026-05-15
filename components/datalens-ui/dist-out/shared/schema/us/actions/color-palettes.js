"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorPalettesActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
const PATH_PREFIX = '/v1/color-palettes';
exports.colorPalettesActions = {
    createColorPalette: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: () => PATH_PREFIX,
        params: (body, headers) => ({
            body,
            headers,
        }),
    }),
    getColorPalettesList: (0, gateway_utils_1.createAction)({
        method: 'GET',
        path: () => PATH_PREFIX,
        params: (_args, headers) => ({
            headers,
        }),
    }),
    updateColorPalette: (0, gateway_utils_1.createAction)({
        method: 'POST',
        path: ({ colorPaletteId }) => `${PATH_PREFIX}/${colorPaletteId}/update`,
        params: (body, headers) => ({ body, headers }),
    }),
    deleteColorPalette: (0, gateway_utils_1.createAction)({
        method: 'DELETE',
        path: ({ colorPaletteId }) => `${PATH_PREFIX}/${colorPaletteId}`,
        params: (_, headers) => ({ headers }),
    }),
};
