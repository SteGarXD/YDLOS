"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../../shared/types");
exports.default = {
    module: 'libs/control/v1',
    identifyParams: () => {
        return {};
    },
    identifyChartType: () => {
        return types_1.ControlType.Dash;
    },
    identifyLinks: () => {
        return {};
    },
};
