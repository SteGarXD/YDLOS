"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScatterTooltipOptions = getScatterTooltipOptions;
const shared_1 = require("../../../../../../../../shared");
const misc_helpers_1 = require("../../../utils/misc-helpers");
function getScatterTooltipOptions(args) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { shared, placeholders } = args;
    const xField = (_b = (_a = placeholders[0]) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b[0];
    const yField = (_d = (_c = placeholders[1]) === null || _c === void 0 ? void 0 : _c.items) === null || _d === void 0 ? void 0 : _d[0];
    const pointField = (_f = (_e = placeholders[2]) === null || _e === void 0 ? void 0 : _e.items) === null || _f === void 0 ? void 0 : _f[0];
    const colorField = (_g = shared.colors) === null || _g === void 0 ? void 0 : _g[0];
    const shapeField = (_h = shared.shapes) === null || _h === void 0 ? void 0 : _h[0];
    const sizeField = (_k = (_j = placeholders.find((pl) => pl.id === shared_1.PlaceholderId.Size)) === null || _j === void 0 ? void 0 : _j.items) === null || _k === void 0 ? void 0 : _k[0];
    return {
        pointTitle: (0, shared_1.getFakeTitleOrTitle)(pointField),
        colorTitle: (0, misc_helpers_1.getFieldTitle)(colorField),
        shapeTitle: (0, misc_helpers_1.getFieldTitle)(shapeField),
        sizeTitle: (0, misc_helpers_1.getFieldTitle)(sizeField),
        xTitle: (0, misc_helpers_1.getFieldTitle)(xField),
        yTitle: (0, misc_helpers_1.getFieldTitle)(yField),
    };
}
